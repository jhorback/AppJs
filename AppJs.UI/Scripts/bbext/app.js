
module("bbext").register("app", [
	"$", "appName", "templateRenderer",
function ($, appName, templateRenderer) {

	return {
		name: appName,
		render: function (model) {
			var templateEl = $("[data-templatefor='" + appName + "']");
			templateRenderer.render(templateEl, model);
		}
	};

}]);