
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