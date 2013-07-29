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