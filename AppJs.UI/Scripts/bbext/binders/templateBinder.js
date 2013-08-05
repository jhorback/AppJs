
module("bbext").register("templateRenderer", function () {
	return {
		render: function (templateEl, model) {
			// cache on templateEl.data("templatefor");nnki8i;ol.
			// render the template in the els parent.
		}
	};
});


module("bbext").shim("templateModelBinder",
	["$", "templateRenderer",
function ($, templateRenderer) {

	return {
		// looks for data-templatefor
		render: function (el, model) {
			var jsonModel = model.toJSON(),
				rootModelHasGet = model.get ? true : false;
			
			el = $(el);
			el.find("[data-templatefor]").each(function (i, templateEl) {
				var templateModel = model,
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





module("bbext").service("app", [
	"$", "appName", "templateRenderer",
function ($, appName, templateRenderer) {

	return {
		render: function (model) {
			var templateEl = $("[data-templatefor='" + appName + "']");
			templateRenderer.render(templateEl, model);
		}
	};

}]);



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

