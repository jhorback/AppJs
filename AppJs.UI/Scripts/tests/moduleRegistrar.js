

if (window.jQuery) {
	context.module("jQuery").register("$", jQuery);
}

if (window._) {
	context.module("Underscore").register("_", _);
}

if (window.Backbone) {
	context.module("Backbone").register("Backbone", Backbone);
}
