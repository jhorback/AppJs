/*
 * renderViewExtension
 * 
 * Description
 *     Implements the render method for Backbone views.
 *     Calls an optional onRender method after rendering.
 */
var renderViewExtension = (function (_, shims) {
	"use strict";
	
	var extension,
		getTemplate,
		templates = {};
	
	// set the template parsing to {{value}} instead of <%= value %>
	_.templateSettings = { interpolate: /\{\{(.+?)\}\}/g };

	getTemplate = function (templateId) {
		var templateFn = templates[templateId],
			html;
		
		if (!templateFn) {
			html = $("#" + templateId).html();
			if (!html) {
				throw "Template '" + templateId + "' not found";
			}
			templateFn = _.template(html);
			templates[templateId] = templateFn;
		}

	};

	extension = {
		render: function () {
			var model = this.model || this.collection,
				templateFn = getTemplate(this.templateId);

			// static rendering of template with compiled function			
			this.$el.html(templateFn(model.toJSON()));

			// allow the shims to 
			shims.render(this.$el, model);
			
			this.onRender && this.onRender();
			
			return this;
		}
	};
	

	return  {
		extend: function (proto) {
			_.extend(proto, extension);
		}
	};

});


context && context.module("bbext").service("bbext.renderViewExtension", [
	"_", "shims",
	renderViewExtension
]);
