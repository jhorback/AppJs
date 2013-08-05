/*
 * ModelErrors.js
 * 
 * Description:
 *     A container for model errors.
 *     Provides normalization of errors regardless of source (e.g. client/server).  
 *
 * Usage:
 *     var errors = modelErrors.create();
 *     if (invalid) {
 *         errors.add("someProperty", "This is an error on the property");
 *     }
 *     return errors.toJSON();
 */
context.module("bbext").service("modelErrors", function () {

	return {
		create: function () {
			return {
				hasErrors: false,
				
				errors: {},

				// Can call with a property name and error string or just the error string for general errors.
				add: function (property, error) {
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
		}
	};
});