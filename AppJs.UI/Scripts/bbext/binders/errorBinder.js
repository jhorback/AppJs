/*
 * Description:
 *     Used to update the view with the model errors.
 *     Works with the ModelBinder and ValidationModelExtension.
 *
 * Usage:
 *     In the view initialize method use these extensions:
 *         FormErrorHandler.extend(this, [model]);
 *     If using the Application.View then in initialize or render call:
 *         this.listenForErrors([model]);
 *
 *     The ModelBinder is required after the rendering of the view:
 *         ModelBinder(this.model, this.$el);
 *
 *     The displayError method can be called during the model error event:
 *         someModel.bind("error", function (errors, property) {
 *             someView.displayError(property, errors);
 *         });
 *
 *     Before saving the model, make sure to call isValid()
 *     if (someView.isModelValid()) { // this will update the view if there are errors
 *         someModel.save();
 *     }
 *
 * Refactor:
	data-validation-for="attributeName"

	Optionally, any surrounding .form-field tag will get an .error class added.

	For general form errors an .alert-error element will get the error html.


	errorBinder.options = {
		propertyAttribute: "data-validation-for",
		fieldSelector: ".form-field",
		fieldErrorClassName: ".error",
		generalErrorSelector: ".alert-error"
	};

 */
(function () {
 
	var extension = {
		displayError: function (attr, errors, showAll) {
			/// <summary>Updates or removes the errors from the view.</summary>
			var errorStr = errors && errors[attr].join(", ");
			
			if (attr) {
				displayFieldError(this, attr, errorStr, showAll);
			} else {
				displayGeneralError(this, errorStr);
			}
		},

		displayErrors: function (errors, showAll) {
			/// <summary>showAll will show errors that do not have a dom node associated in the summary section (default is true).</summary>
			var displayError = _.bind(this.displayError, this);

			if (showAll === undefined) {
				showAll = true;
			}

			if (errors) {
				_.each(_.keys(errors), function (key) {
					displayError(key, errors, showAll);
				});
				return false;
			}
			return true;
		},

		isModelValid: function (model) {
			/// <summary>
			/// Returns true if the model is valid, otherwise updates the view with the errors.
			/// Will look at the view.model property if the model is not passed.
			/// </summary>
			model = model || this.model;
			return this.displayErrors(model.getErrors(), false);
        },
		
		listenForErrors: function (model) {
			var instance = this;
			
			model = model || this.model;
			this.listenTo(model, "error", function (model, errors, property) {
				if (errors && errors.readyState) { // xhr error
					return;
				}
			  	if ($.isPlainObject(property)) { // is it comming from backbones validate
			  		instance.displayErrors(errors);
			  	} else {
			  		instance.displayError(property, errors);
			  	}
			});
		}
	};

	var displayFieldError = function (view, attr, errorStr, showAll) {
			var errorSpan, formField;

			errorSpan = view.$("[data-validation-for]").filter(function () {
				return $(this).attr("data-validation-for").toLowerCase() === attr.toLowerCase();
			});

			if (errorSpan.length === 0) {
				if (showAll) {
					displayGeneralError(view, "An error occured with: " + attr + " - " + errorStr);
				} else {
					console.warn("There was an error on the model that cannot be displayed: " + attr + " - " + errorStr);
				}
			}

			formField = errorSpan.closest(".form-field");
			if (errorStr) {
				formField.addClass("error");
				addErrorHtml(errorSpan, errorStr);
			} else {
				formField.removeClass("error");
				errorSpan.html("");
			}
		},
		
		displayGeneralError = function (view, errorStr) {
			var form = view.$("form"),
				summarySpan = form.find(".alert-error");

			if (form.length === 0 || summarySpan.length === 0) {
				console.warn("A form or .alert-error element could not be found to display the error.");
			}
			
			if (errorStr) {
				form.addClass("error");
				addErrorHtml(summarySpan, '<h1>' + errorStr + '</h1>');
			} else {
				form.removeClass("error");
				summarySpan.html("");
			}
		},
		
		addErrorHtml = function (el, error) {
			/// <summary>If the error exists, hides then shows it - otherwise just shows it.</summary>
			var innerHtml = $.trim(el.html());

			if (innerHtml === error) {
				el.fadeOut(function () {
					el.fadeIn();
				});
			} else {
				el.html(error);
			}
		};


	window.FormErrorHandler = {
        extend: function (instance, model) {
            /// <summary>
	        /// Extends a view to properly display error messages for a field/form.
            /// if the model is passed and the instance has a displayError method, the binding will be setup.
			/// </summary>
        	model = model || instance.model;
			_.extend(instance, {}, extension);
	        if (model && instance.listenForErrors) {
	        	instance.listenForErrors(model);
	        }
        }
    };
}());
