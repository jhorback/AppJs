/*
 * bbext.js
 *
 * Description:
 *     Application.View and Application.Model contain all of the
 *     bbext Backbone extensions.
 *     
 *     Also contains the registrations for the bbext appjs module.
 *
 * Constructs:
 *     view - Use this contruct when using appjs to get a Backbone view with the
 *            bbext view extensions.
 *
 */

if (window.Application) {
	// create the application view with all view extensions
	Application.View = Backbone.View.extend({});
	ModelBinder.extend(Application.View.prototype);
	JstViewExtension.extend(Application.View.prototype);
	CloseViewExtension.extend(Application.View.prototype);
	FormErrorHandler.extend(Application.View.prototype);


	// create the application model with all model extensions
	Application.Model = Backbone.Model.extend({});
	BackupModelExtension.extend(Application.Model.prototype);
	GetSetModelExtension.extend(Application.Model.prototype);
	ValidationModelExtension.extend(Application.Model.prototype);
}


// jch* - figure the best way to inject this
/*
Module: harborConfig?
baseUrl wold be an injected property
baseUrl could be a service?
*/
if (window.JSPM) {
	JSPM.pkgSrc = Application.url("home/jspm");
}

var bbext = module("bbext").use("appjs");

if (window.jQuery) {
	bbext.register("$", jQuery, "function").register("_", _);
}

bbext.construct("view", function () {
	return function (construct, name) {
		var View, protoProps = {};

		// using the name here to ease debugging (can see the view being created).
		protoProps[name] = construct.prototype;

		protoProps[name].constructor = construct;
		if (protoProps[name].constructor) {
			protoProps[name]._ctor = protoProps[name].constructor;
		}

		protoProps[name].constructor = function () {
			var context = arguments[arguments.length - 1];

			if (this.$inject && this.$inject[0] !== "options") {
				console.warn("First argument is not options of : " + name);
			}

			// inject the constructor
			if (this._ctor) {
				context.call(this._ctor, arguments, this);
			}

			Backbone.View.apply(this, arguments);
			return this;
		};

		View = Application.View.extend(protoProps[name], construct);
		return View;
	};
});


bbext.construct("model", function () {
	return function (construct, name) {
		var Model, protoProps;
		protoProps = construct.prototype;

		protoProps.constructor = construct;
		if (protoProps.constructor) {
			protoProps._ctor = protoProps.constructor;
		}

		protoProps.constructor = function () {
			var context = arguments[arguments.length - 1];
			
			if (this.$inject && this.$inject[0] !== "options") {
				console.warn("First argument is not options of : " + name);
			}
			
			// inject the constructor
			if (this._ctor) {
				if (context.call) {
					context.call(this._ctor, arguments, this);
				} else {
					this._ctor.apply(this, arguments);
				}
			}

			Backbone.Model.apply(this, arguments);
			return this;
		};

		Model = Application.Model.extend(protoProps, construct);
		return Model;
	};
});


bbext.construct("collection", function () {
	return function (construct, name) {
		var protoProps;
		protoProps = construct.prototype;

		protoProps.constructor = construct;
		if (protoProps.constructor) {
			protoProps._ctor = protoProps.constructor;
		}

		protoProps.constructor = function () {
			var context = arguments[arguments.length - 1];

			if (this.$inject && this.$inject[0] !== "options") {
				console.warn("First argument is not options of : " + name);
			}
			
			// inject the constructor
			if (this._ctor) {
				context.call(this._ctor, arguments, this);
			}
			
			this.model = context.get(this.model, true); // true gets the raw value

			Backbone.Collection.apply(this, arguments);
			return this;
		};

		return Backbone.Collection.extend(protoProps, construct);
	};
});


bbext.service("events", ["globalCache", function (globalCache) {

	var events = globalCache.get("bbextEvents");
	if (!events) {
		events = _.extend({}, Backbone.Events);
		globalCache.set("bbextEvents", events);
	}
	return events;

}]);


// for creating simple models
bbext.model("model", function () { });