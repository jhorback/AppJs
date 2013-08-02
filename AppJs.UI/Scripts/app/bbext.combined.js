/*
 * appEvents.js
 *
 * Description:
 *     Creates a structure for dealing with application events.
 */
context.module("bbext").construct("appEvents", ["events", function (events) {

	return function (construct) {

		_.extend(construct.prototype, {
			
			listen: function () {
				var eventName, method;

				this.stopListening(); // unbind any currently bound events.
				
				for (eventName in this.events) {
					method = events[eventName];
					if (typeof method !== 'function') {
						method = this[this.events[eventName]];
					}
					if (!method) {
						continue;
					}

					events.on(eventName, method, this);
				}
			},
			
			stopListening: function () {
				events.off(null, null, this);
			}
			 			
		});
		 
		return construct;
	};
}]);
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

/*
 * ModelBinder.js
 */
/*
 * Description:
 *     Binds an element to a model.
 *
 * Dependencies:
 *     jQuery, Backbone
 * 
 * Usage:
 *     var mb = ModelBinder(someModel, someElement);
 * 	   mb.unbind();
 *
 *     Binds to the model property using:
 *     1) data-bind="attributeName"
 *     2) name="attributeName"
 *     3) id="attributeName"
 *
 * Type processing:
 *     Processing data from the view to model or model to view is done by a binding type.
 *     1) data-type="someType"
 *     2) type="someType"
 *     3) tag name
 *     
 * ModelBinder.config:
 *     Type and attribute processing can be configured.
	
		// eventFromDom, getFromDom, setToDom
 *     ModelBinder.config.types["foo"] = {
 *         event: "click",               // additional dom event(s) to listen on the element to update the model
 *         get: function (el, event, binding) { },       // a method to get the value out of the dom for the model
 *         set: function (el, value) { } // a method to set the value in the dom
 *     }
 *     ModelBinder.config.attributes["disabled"] = "boolean";
 *     ModelBinder.config.attributes["foo"] = "string";
 *     ModelBinder.config.attributeTypes["boolean"] = function (el, attr, value) { }; // a setter for the attribute
 *
 * Complex controls:
 *     Complex controls can store their value in a hidden input. In order for the model to update,
 *     a change event must be fired on the hidden field manually.
 *	   $("#some-hidden-field").val("someCmplexControlsValue").change();
 */
(function ($) {

	var config = {
		modelGet: "get",
		modelSet: "set",
		types: {
//			"text": { event: "keyup" },
//			"textarea": { event: "keyup" },
			"checkbox": {
				get: function (el) {
					return el.is(":checked");
				},
				set: function (el, value) {
					el.attr("checked", value);
				}
			},
			"contenteditable": {
				event: ["keydown", "blur"],
				get: function (el, event, binding) {
					var val = this.model.get(binding.name);
					if (event.type === "keydown") {
						if (event.keyCode == 27) { // escape
							setTimeout(function () {
								el.blur();
							}, 0);
							el.text(val);
						} else if (event.keyCode == 13) { // enter
							el.blur();
							val = el.text();
							el.text(val);
						}
					} else { // event is blur
						val = el.text();
					}
					// console.log(event.type, val);
					return val;
				},
				set: function (el, value) {
					el.html(value);
				}
			},
			"multicheckbox": {
				get: function (el) {
					var name = el.attr("name");
					var selected = this.$el.find("[name='" + name + "']:checked");
					var roles = _.map(selected, function (el) {
						return $(el).attr("value");
					});
					return roles;
				},
				set: function (el, value) {

					var elValue = el.val();
					var checked = _.any(value, function (value) {
						return elValue === value;
					});
					el.attr("checked", checked);
				}
			},
			"radio": {
				set: function (el, value) {
					el.attr("checked", el.val() === value);
				}
			}
		},
		attributes: {
			"id": "string",
			"disabled": "boolean",
			"checked": "boolean",
			"class": "string",
			"href": "string",
			"text": "text",
			"src": "string"
		},
		attributeTypes: { // attributeBinders
			"string": function (el, attr, value) {
				el.attr(attr, value);
			},
			"boolean": function (el, attr, value) {
				if (!value) {
					el.removeAttr(attr);
				} else {
					el.attr(attr, true);
				}
			},
			"text": function (el, attr, value) {
				el.html(value);
			}
		}
	};

	var ModelBinder = function (model, el) {
		if (this instanceof ModelBinder === false) {
			return new ModelBinder(model, el);
		}

		this.model = model;
		this.$el = $(el);
		if (this.$el.data("modelbound") === true) {
			this.unbind();
		}
		this.$el.data("modelbound", true);
		// this.attrs = attrs || ModelBinder.config.attributes;
		this.bindings = {};
		this._modelToViewProxy = $.proxy(this._modelToView, this);
		this.model.bind("change", this._modelToViewProxy);
		this._init();
		return this;
	};

	ModelBinder.prototype = {
		model: null, // holds the model
		$el: null, 	// stores the container that is being bound
		bindings: {}, // stores binding elements by name (each value is an array of elements).

		_init: function () {
			var $els, viewToModelProxy;

			viewToModelProxy = $.proxy(this._viewToModelFromEvent, this);
			$els = this.$el.find("[data-bind],[name],[id]");

			// build the bindings 
			$.each($els, $.proxy(function (index, el) {
				var name, type, changeEvent, val;

				el = $(el);
				name = el.attr("data-bind") || el.attr("name") || el.attr("id");
				if (!name) {
					return; // continue;
				}

				val = this.model[config.modelGet](name);
				if (val === undefined) {
					return; // continue - do not add binding for an undefined attr
				}

				type = el.attr("data-type") || el.attr("type") || el[0].tagName.toLowerCase();
				el.data("binding", {
					name: name,
					type: type
				});

				this._addBinding(name, el);

				changeEvent = this._getChangeEvent(el, type);
				if (changeEvent) {
					_.each(changeEvent, function (event) {
						el.bind(event + ".modelbinder", viewToModelProxy);
					});
				}

				// set the initial value
				this.updateEl(el, name, this.model[config.modelGet](name));

			}, this));

			this._initAttrBindings();
			this._updateFromView();
		},

		_getChangeEvent: function (el, type) {
		    var configEv = config.types[type],
		        event = (configEv && configEv.event) || "change",
				attrEv = el.attr("data-bind-event"); // event override in markup
		    event = attrEv || event;
		    return _.isArray(event) ? event : [event];
		},

		_initAttrBindings: function () {

			$.each(config.attributes, $.proxy(function (attr, type) {

				var els = this.$el.find("[data-bind-" + attr + "]");
				$.each(els, $.proxy(function (i, el) {
					var name, binding;

					el = $(el);
					name = el.attr("data-bind-" + attr);
					binding = el.data("binding") || {};
					if (!binding.attrs) {
						binding.attrs = {};
					}
					binding.attrs[attr] = name;
					el.data("binding", binding);

					this._addBinding(name, el);

					this.updateEl(el, name, this.model[config.modelGet](name));
				}, this));

			}, this));
		},
		
		_updateFromView: function () {
			/// <summary>Used to capture autofill values that do not trigger a change event.</summary>
			var self = this;
			setTimeout(function () {
				_.each(self.bindings, function (binding, propName) {
					_.each(binding, function (el) {
						if (el.is(":text,:password,select")) {
							self._viewToModel(el);
						}
					});
				});
			}, 500);
		},

		_addBinding: function (name, el) {
			this.bindings[name] = this.bindings[name] || [];
			this.bindings[name].push(el);
		},

		_viewToModelFromEvent: function (event) {
			this._viewToModel($(event.target), event);
		},
		
		_viewToModel: function (el, event) {
			var binding = el.data("binding"),
				get,
				val,
				opts;
			
			if (!binding) {
				return;
			}

			get = (config.types[binding.type] && config.types[binding.type].get) || function (el) {
				return el.val();
			};

			// don't trigger a change if the initial model value is falsy
			val = get.call(this, el, event, binding);
			if (val === "" && !this.model[config.modelGet](binding.name)) {
				opts = { silent: true };
			}
			this.model[config.modelSet](binding.name, val, opts);
		},

		_modelToView: function (model) {
			var name, els, newVal;

			_.each(model.changed, function (value, key) {
				name = key;
			    els = this.bindings[name];
			    if (els) {
				    newVal = model.get(name);
				    $.each(els, $.proxy(function (index, el) {
					    this.updateEl(el, name, newVal);
				    }, this));
			    }
			}, this);
		},

		updateEl: function (el, name, value) {
			var binding, set;

			el = $(el);
			if (el.is(":focus")) {
				return;
			}
			binding = el.data("binding");
			if (!binding) {
				this.unbind();
				return;
			}
			value = value === null ? "" : value;

			if (binding.name === name) {
				set = (config.types[binding.type] && config.types[binding.type].set) || function (el, value) {
					el.is(":input") ? el.val(value) : el.html(String(value));
				};
				set.call(this, el, value);
			}

			// set the attributes
			if (binding.attrs) {
				$.each(binding.attrs, $.proxy(function (attr, modelPropertyName) {
					var attrType, setter;

					if (modelPropertyName === name) {
						attrType = config.attributes[attr];
						setter = config.attributeTypes[attrType];
						setter(el, attr, value);
					}
				}, this));
			}
		},

		unbind: function () {
			this.$el.find("[data-bind],[name],[id]").unbind(".modelbinder");
			this.model.unbind("change", this._modelToViewProxy);
			this.$el.data("modelbound", false);
		},
		
		off: function () {
			this.unbind();
		}
	};

	window.ModelBinder = ModelBinder;
	ModelBinder.config = config;


	ModelBinder.extend = function (view) {
		/// <summary>
		/// Provide an extension that unbinds the model binder during
		/// the .remove/stopListening view method call.
		/// If an element is not passed, the views $el will be used.
		/// If a model is not passed, this.model or this.collection will be used.
		/// </summary>
		_.extend(view, {
			bindModelToView: function (model, el) {
				var binder,
					listeners = this._listeners || (this._listeners = {});
				
				el = el || this.$el;
				model = model || this.model || this.collection;
				binder = new ModelBinder(model, el);
				listeners[_.uniqueId("ModelBinder")] = binder;
			},
			
			bindTemplate: function (template, el, model) {
				el = el || this.$el;
				model = model || this.model;
				this.template(template, el)(model.toJSON());
				this.bindModelToView(model, el);
			}
		});
	};

} (jQuery));


context.module("bbext").service("events", ["globalCache", function (globalCache) {

	var events = globalCache.get("bbextEvents");
	if (!events) {
		events = _.extend({}, Backbone.Events);
		globalCache.set("bbextEvents", events);
	}
	
	return events;
}]);
var bbext = context.module("bbext");

/*
 *  factory for Backbone objects: view, model, collection.
 *      get(name, options)
 *          - creates a new instance.
 *          - options being the Backbone options.
 *          - all other arguments required by the view will be injected.                       
 */
var bbFactory = ["context", function (context) {
	return {
		create: function (name, options) {

			return context.instantiate(name, [options]);
		}
	};
}];

bbext.service("viewFactory", Array.prototype.slice.call(bbFactory, 0));
bbext.service("modelFactory", Array.prototype.slice.call(bbFactory, 0));
bbext.service("collectionFactory", Array.prototype.slice.call(bbFactory, 0));
/*
 * ModelErrors.js
 * 
 * Description:
 *     Provides a container for model errors, an easy way to add an error and retrieve all errors.
 *
 * Usage:
 *     var errors = new ModelErrors();
 *     if (invalid) {
 *         errors.add("someProperty", "This is an error on the property");
 *     }
 *     return errors.toJSON();
 */
var ModelErrors = function () {
	if (this instanceof ModelErrors === false) {
		return new ModelErrors();
	}

	this.hasErrors = false;
	this.errors = { };
	return this;
};

ModelErrors.prototype = {
	hasErrors: false,
	errors: {},
	
	add: function (property, error) {
		/// <summary>Can call with a property name and error string or just the error string for general errors.</summary>
		var propErrors;
		
		this.hasErrors = true;
		
		if (arguments.length === 1) {
			error = arguments[0];
			property = "";
		}

		propErrors = this.errors[property] || [];
		propErrors.push(error);
		this.errors[property] = propErrors;
	},
	
	toJSON: function () {
		/// <summary>Returns the errors object if there are errors, otherwise returns undefined.</summary>
		return this.hasErrors ? this.errors : undefined;
	}
};
/*
 * BackupModelExtension.js
 * 
 * Description:
 *     A simple memento plugin that handles a single level backup of the JSON representation of the model.
 *
 * Usage:
 *     backupModelExtension.extend(someModel);
 *     someModel.store();
 *     someModel.restore();
 *              .restore(name); // restores only that property
 */
var backupModelExt = (function () {

	var extension = {
		store: function () {
			this.memento = _.extend({}, this.attributes);
			return this.memento;
		},

		restore: function (name) {
			if (this.memento) {
				if (name) {
					this.set(name, this.memento[name]);
				} else {
					this.set(this.memento);
				}
			}
			return this.memento;
		}
	};

	return {
		extend: function (instance) {
			_.extend(instance, extension);
		}
	};
})();

var getSetModelExt = (function () {

	var gsAppExt = {
		get: function (name) {
			var val,
				getFn = this[name] && this[name].get,
				currentValue = Backbone.Model.prototype.get.apply(this, arguments);
			
			if (_.isFunction(getFn) && getFn !== gsAppExt.get) {
				val = getFn.call(this, currentValue);
				if (val !== undefined) {
					this.attributes[name] = val; // keep the attrs in sync - may not need?
				}
			} else {
				val = currentValue;
			}
			return val;
		},

		set: function (name, value, options) {
		    var model = this,
                multiProps,
                getValueToSet = _.bind(function (name, value) {
                    var  setFn = $.isPlainObject(this[name]) && this[name].set;
                    value = _.isFunction(setFn) ? setFn.call(this, value, options) : value;
                    return value;
                }, this);

		    // set is called in model construction
			// use this as a trigger to parse and handle bindings
		    modelGetSetExt.setupInstance(this);

			if (_.isObject(name)) {
			    multiProps = {};
			    options = arguments[1];
			    _.each(arguments[0], function (value, name) {
			        multiProps[name] = getValueToSet(name, value);
			    }, this);
			    Backbone.Model.prototype.set.call(this, multiProps, options);
				return this;
			}
			
			Backbone.Model.prototype.set.call(this, name, getValueToSet(name, value), options);
			return this;
		},
		
		toJSON: function () {
			var json = { };
			var model = this;
			_.each(this.attributes, function (value, name) {
				var val = model.get(name);
				// if val is undefined use the attribute value (which is the default).
				val = val !== undefined ? val : model.attributes[name];
				json[name] = val;
			});
			return json;
		},
		
		refresh: function () {
			this.set(this.toJSON());
		}
	};


	return {
		
	    setupInstance: function (instance) {
	        if (instance._gsinit === true) {
	            return;
	        }
	        instance._bindings = {};
	        modelGetSetExt.parseBindings(instance);
	        modelGetSetExt.handleBindings(instance);
	        instance._gsinit = true;
	    },
		
		parseBindings: function (instance) {
		    $.each(instance, function (name, value) {
		        var toBind;
		        if (value && value.bind && _.isFunction(value.bind) === false) {
                    toBind = _.isArray(value.bind) ? value.bind : [value.bind];
					_.each(toBind, function (propName) {
						instance._bindings[propName] = instance._bindings[propName] || [];
						instance._bindings[propName].push(name);
					});
				}
			});
		},
		
		handleBindings: function (instance) {
			instance.on("all", function (change) {
			    var prop = change && change.split(":")[1];
			    if (prop && this.attributes[prop] !== undefined) {
					_.each(this._bindings[prop], function (depPropName) {
					    this.set(depPropName, this.get(depPropName));
					}, this);
				}
			});
		},

		extend: function (protoOrInstance) {
		    if (protoOrInstance._gsinit !== true) {
		        _.extend(protoOrInstance, gsAppExt);
		    }
		}
	};

} ());

/*!
 * ValidationModelExtension.js
 */
/*
 * Usage:
 *     var SomeModel = Backbone.Model.extend({
 *     	  defaults: {
 *     	  	someField: null
 *     	  },
 *     	  someField: {
 *            validate: {
 *     	  	      required: true,
 *     	  	      min: 0,
 *     	  	      max: 10,
 *     	  	      email: true,
 *     	  	      exclude: "foo",
 *     	  	      custom: function (value) {
 *     	  	   	      if (value === 1) {
 *     	  	   		      return "Value cannot be 1.";
 *     	  	   	        }
 *     	  	       }
 *             }
 *         }
 *     });
 * 
 * 
 * Error notifications:
 *     Whenever a model property changes, its validation is run.
 *     If there are any errors, an "error" will be triggered on the model.
 * 
 *     var sm = new SomeModel();
 *     sm.on("error", function (model, errors, property) {
 *         // errors - hash of property name : array of error messages. { username: ["Required."] }
 *         //     errors will be null if there was an error but it is now cleared
 *         // property - the name of the property that triggered the error.
 *     });
 * 
 *
 *     Calling getErrors will call the validate method on the model with a boolean passed as the only argument.
 *     var errors = sm.getErrors();
 *     if (errors) {
 *          // handle the errors
 *     }
 *
 *     This enables composite validation to execute separate from property change events.
 *     validate: function (onSave) {
 *         if (onSave !== true) {
 *             return;
 *         }
 *      }
 *
 *
 * Adding a global validator:
 *     ValidationModelExtension.validators["exclude"] = function (value, args) {
 *         if (value === args) {
 *     	       retun "The value cannot be " + args;
 *         }
 *     };
 */
var validationModelExt = (function () {

	var onModelChange = function (model) {

		_.each(model.changed, function (hasChanged, propertyName) {
			if (hasChanged) {
				validateProperty(model, propertyName);
			}
		});
	},

		validateProperty = function (model, propertyName, silent) {
			var validators,
				errorMsgs = [],
				errors = null;

			validators = model[propertyName] && model[propertyName].validate;
			if (model[propertyName] && !validators) {
				return null;
			}

			_.each(validators, function (args, validatorKey) {
				var validateFn = validationModelExt.validators[validatorKey],
					errorMsg;

				if (!validateFn) {
					throw "Validator does not exist: " + validatorKey;
				}

				errorMsg = validateFn.call(model, model.get(propertyName), args);
				if (errorMsg) {
					errorMsgs.push(errorMsg);
				}
			});

			if (errorMsgs.length > 0) {
				errors = {};
				errors[propertyName] = errorMsgs;
				model._fieldErrors[propertyName] = true;
				!silent && model.trigger("error", model, errors, propertyName);
			} else {
				if (!silent && model._fieldErrors[propertyName] === true) {
					model.trigger("error", model, errors, propertyName);
				}
				delete model._fieldErrors[propertyName];
			}

			return errors;
		},

		valAppExt = {
			getErrors: function () {
				validationModelExt.setupInstance(this);

				var model = this,
					errors = null,
					jsonObj = model.toJSON(),
					validateErrors = model.validate && model.validate(true);

				_.each(jsonObj, function (value, name) {
					var propErrors = validateProperty(model, name, true);
					if (propErrors) {
						errors = _.extend(errors || {}, propErrors);
					}
				});

				if (validateErrors) {
					errors = errors || {};
					_.each(validateErrors, function (errorArray, name) {
						errors[name] = _.union(errors[name] || [], errorArray);
					});
				}
				return errors;
			}
		};

        return {
	        setupInstance: function (instance) {
	            if (instance._valinit === true) {
	                return;
	            }
	            instance._fieldErrors = {};
	            instance.on("change", _.bind(onModelChange, instance));
	            instance._valinit = true;
	        },

	        extend: function (protoOrInstance) {
	            if (protoOrInstance._valinit !== true) {
	                _.extend(protoOrInstance, valAppExt);
	            }
		    },
		
		    isNullOrEmpty: function (value) {
			    return !value || !$.trim(value);
		    },
		
		    validators: {
			    required: function (value, args) {
				    var msg = (args && args.message) || "Required.";
				    return this.isNullOrEmpty(value) ? msg : undefined;
			    },
			    email: function (value) {
				    var emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA;-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
				    return (!this.isNullOrEmpty(value) && _.isString(value) && !value.match(emailRegex)) ?
					    "Invalid email." : undefined;
			    },
			    custom: function (value, validator) {
				    return validator(value);
			    }
		    }
        };
           
})();
/*globals */
/*
*/
(function (_) {

	var extension;

	extension = {
		close: function () {
			/// <summary>An option other than remove that does not
			/// remove the view el and calls an optional 'onClose'
			/// method when called.
			/// </summary>
			this.onClose && this.onClose();
			this.undelegateEvents();
			this.off();
			this.stopListening();
			return this;
		}
	};

	window.CloseViewExtension = {
		extend: function (proto) {
			_.extend(proto, extension);
		}
	};

} (_));
/*globals */
/*
* Desription:
*     Adds JST and template methods to any object.
*     Templates can live in script tags with type="text/template".
*         The id of the script tag is to be used as the template parameter in the JST and template methods.
*     Templates can also be found on any element with a data-template attribute set to the template name.
*         This second way requires a css selector to hide all  
*
* Requires:
*     jQuery, Underscore
*
* Usage:
*     JstViewExtension.extend(this); // 'this' is typically the view
*
* Methods:
*     JST(template, model) - returns a promise containing the html fragment result and model from the template rendering.
*                            the model can have deferred properties which will be resolved before the callback.
*     template(template, el) - returns the compiled template function.
*                              el is an optional argument that will add the result of the template to the dom node. 
*                              this.$el will be used if exists and el is not passed.
*/
(function ($, _) {

	var extension;

	// set the template parsing to {{value}} instead of <%= value %>
	_.templateSettings = { interpolate: /\{\{(.+?)\}\}/g };


	extension = {
		renderTemplate: function (template) {
			return this.template(template, this.$el);
		},

		template: function (template, el) {
			/// <summary>Executes the template and returns the result.</summary>
			var templateHtml,
				templateFn = JstViewExtension.templates[template];

			if (!templateFn) {
				templateHtml = $("#" + template).html();
				if (!templateHtml) {
					templateHtml = $("[data-template='" + template + "']").html();
					if (!templateHtml) {
						throw "Template '" + template + "' not found";
					}
				}
				templateFn = _.template(templateHtml);
				JstViewExtension.templates[template] = templateFn;
			}

			if (el) {
				return function (model) {
					return $(el).html(templateFn(model));
				};
			}
			return templateFn;
		},

		// jch* - remove this when converting the old view extension
		JST: function (template, model) {
			/// <summary>Returns a promise containing the html fragment result from the template rendering.</summary>
			var dfd = $.Deferred(),
				dfds = [],
				templateFn;

			templateFn = extension.template(template);
			model = _.clone(model) || {};

			_.each(model, function (dfd, name) {
				var curryDfd;
				if (dfd && dfd.then) {
					curryDfd = $.Deferred();
					dfd.then(function (data) {
						curryDfd.resolve({
							name: name,
							result: data
						});
					});
					dfds.push(curryDfd);
				}
			});

			$.when.apply($, dfds).then(function () {
				var results = _.toArray(arguments);

				_.each(results, function (result) {
					model[result.name] = result.result;
				});

				dfd.resolve(templateFn(model), model);
			});

			return dfd.promise();
		}
	};

	window.JstViewExtension = {
		templates: {},
		extend: function (instance) {
			_.extend(instance, extension);
		}
	};

}(jQuery, _));

var bbext = context.module("bbext").use("appui");


bbext.service("backupModelExt", backupModelExt);
bbext.service("getSetModelExt", getSetModelExt);
bbext.service("validationModelExt", validationModelExt);
