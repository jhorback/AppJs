
var appui = appjs.module("appui");

appui.construct("shim", ["shims", function (shims) {

	return function (construct, name) {

		shims.register(name, construct);
		return construct;
	};

}]);


appui.service("shims", function () {

	var shims = {};

	return {
		register: function(name, shim) {
			shims[name] = shim;
		},
		render: function(el, model) {
			if (model && !model.toJSON) {
				throw new Error("The model must implement toJSON.");
			}
			

		}
	};

});