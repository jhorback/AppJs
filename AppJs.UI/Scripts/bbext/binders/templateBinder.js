
module("bbext").register("templateRenderer", function () {
	return {
		render: function (templateEl, model) {
			// cache on templateEl.data("templatefor");
			// find the view/controller create with model
			// wait for initialize promise!! which can change the model
			// view.render -> render the template in the els parent.
		}
	};
});

module("bbext").register("templateCache", ["$", "_", function ($, _) {

	var templates = {};
	

	return {
		cacheTemplateFor: function (name, templateEl) {
			var html = $('<script/>').append(templateEl).html(),
				templateFn = _.template(html);
			templates[name] = templateFn;
			return templateFn;
		},
		
		getTemplateFor: function(name) {
			var templateFn = templates[name],
				templateEl;
			
			if (!templateFn) {
				templateEl = $("[data-templatefor='" + name + "']");
				if (templateEl.length === 0) {
					throw "Template for '" + name + "' not found";
				}
				templateFn = this.cacheTemplateFor(name, templateEl);
			}
			
			return templateFn;
		}
	};

}]);

/*
Needs:
templateRenderer.render(templateEl, potentialModel);
	* called by app.render
	* called by templateBinder.render
	* templateEl will be placed in a script tag in order to extract the entire template
		* then templateCache.cacheTemplateFor(viewName, html); will be called
	* creates a view




templateCache
 * Something to cache a template with a name
 * getTemplateFor("myApp.myView")
	* will look in the cache or pull from the dom 
 * cacheTemplateFor("name", 



 renderViewExtension.render
	* calls getTemplateFor(viewName)
	* calls shims.render()


*/

module("bbext").shim("templateBinder",
	["$", "templateRenderer",
function ($, templateRenderer) {

	function determineModel(templateEl, rootModel) {
		
	}

	function renderTemplate(templateEl, model) {
		
	}

	return {
		// looks for data-templatefor
		render: function (el, model) {
			var jsonModel = model.toJSON(),
				rootModelHasGet = model.get ? true : false;
			
			el = $(el);
			el.find("[data-templatefor]").each(function (i, templateEl) {
				var templateModel = null,
					bindTo;

				templateEl = $(templateEl);
				bindTo = templateEl.data("bind");
				
				if (bindTo) {
					// if data-bind attribute on template try model.get or pulling from json
					templateModel = rootModelHasGet ? model.get(bindTo) : jsonModel[bindTo];
				}
				
				templateRenderer.render(templateEl, templateModel);
			});
		}
	};
}]);



/*
app("userAdmin").start(function (app) {
	app.render(model);
});


app("userAdmin").view("userAdmin", function () {

}, {
	initialize: function() {
		// can return a promise to wait on before rendering - er - how does this work
	},
	methodOnTheView: function() {
		
	}
});

*/