/*
 * validators.js
 *
 * Exposes and allows for the extension of model validation methods.
 *
 *     validators.add("exclude", function (value, args) {
 *         if (value === args) {
 *     	       retun "The value cannot be " + args;
 *         }
 *     };
 */
context.module("bbext").service("validators", function () {
	var validators, uitl;

	util = {
		isNullOrEmpty: function (value) {
			return !value || !this.trim(value);
		},

		trim: function (str) {
			return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
		}
	};

	validators = {
		required: function (value, args) {
			var msg = (args && args.message) || "Required.";
			return util.isNullOrEmpty(value) ? msg : undefined;
		},

		email: function (value) {
			var emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA;-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
			return (!util.isNullOrEmpty(value) && _.isString(value) && !value.match(emailRegex)) ?
				"Invalid email." : undefined;
		},

		custom: function (value, validator) {
			return validator(value);
		}
	};

	return {
		util: util,

		add: function (name, validator) {
			validators[name] = validator;
		},

		get: function (name) {
			return validators[name];
		}
	};

});
