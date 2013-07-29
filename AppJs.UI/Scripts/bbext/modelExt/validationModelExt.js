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
(function () {

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
				var validateFn = ValidationModelExtension.validators[validatorKey],
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
		        ValidationModelExtension.setupInstance(this);

				var model = this,
					errors = null,
					jsonObj = model.toJSON(),
					validateErrors = model.validate && model.validate(true);
				
				_.each(jsonObj, function (value, name) {
					var propErrors = validateProperty(model, name, true);
					if (propErrors) {
						errors = _.extend(errors || { }, propErrors);
					}
				});
				
				if (validateErrors) {
					errors = errors || { };
					_.each(validateErrors, function (errorArray, name) {
						errors[name] = _.union(errors[name] || [], errorArray);
					});
				}
				return errors;
			}
		},

        ValidationModelExtension = {
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
				    return ValidationModelExtension.isNullOrEmpty(value) ? msg : undefined;
			    },
			    email: function (value) {
				    var emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA;-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
				    return (!ValidationModelExtension.isNullOrEmpty(value) && _.isString(value) && !value.match(emailRegex)) ?
					    "Invalid email." : undefined;
			    },
			    custom: function (value, validator) {
				    return validator(value);
			    }
		    }
        };
	
	window.ValidationModelExtension = ValidationModelExtension;
           
})();