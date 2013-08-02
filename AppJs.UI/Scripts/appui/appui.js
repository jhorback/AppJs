var appui = context.module("appui").use("Underscore", "jQuery");


appui.service("appurl", ["baseUrl", function (baseUrl) {
	return {
		get: function (url) {
			return (baseUrl || "") + (url || "");
		}
	};
}]);


appui.register("appuiMenu", function () {
	return Menu;
});


appui.service("menuFactory", ["context", "appuiMenu", function (context, appuiMenu) {
	return {
		create: function (el, options) {
			return new appuiMenu(el, options);
		}		
	};
}]);


appui.register("appuiDialog", function () {
	return Dialog;
});


appui.service("dialogFactory", ["context", "appuiDialog", function (context, appuiDialog) {
	return {
		create: function (el, options) {
			return new appuiDialog(el, options);
		}		
	};
}]);