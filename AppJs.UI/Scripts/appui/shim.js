
var appui = context.module("appui");

appui.construct("shim", ["shims", function (shims) {

	return function (construct, name) {

		shims.register(name, construct);
		if (!construct.render) {
			throw new Error("A shim must implement render");
		}
		return construct;
	};

}]);


appui.service("shims", ["_", function (_) {

	var shims = {};

	return {
		register: function(name, shim) {
			shims[name] = shim;
		},
		
		render: function(el, model) {
			if (model && !model.toJSON) {
				throw new Error("The model must implement toJSON.");
			}

			_(shims).each(function (shim) {

				shim.render(el, model);

			});
		}
	};

}]);