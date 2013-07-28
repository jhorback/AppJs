

var appjsext = appjs.module("appjsext");


appjsext.register("window", function () {
	return window;
});


appjsext.service("console", ["window", function (window) {
	var console, log;

	console = window.console || {
		log: function () {
			window.alert(Array.prototype.slice.call(arguments, 0).join("\n"));
		}
	};
	
	log = function (type) {
		return function () {
			var args = Array.prototype.slice.call(arguments, 0);
			type = console[type] ? type : "log";
			console[type].apply(console, args);
		};
	};
	
	return {
		log: log("log"),
		warn: log("warn"),
		error: log("error")
	};
}]);

appjs.module("appjsext").service("globalCache", ["globals", function (globals) {
	globals.globalCache = globals.globalCache || {};

	return {
		get: function (name) {
			return globals.globalCache[name];
		},
		
		set: function (name, value) {
			globals.globalCache[name] = value;
		}
	};
}]);
// only used for minification