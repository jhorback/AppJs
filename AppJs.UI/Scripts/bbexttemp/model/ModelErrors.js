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