
var appext = module("appext");


appext.register("window", function () {
	return window;
});


appext.service("console", ["window", function (window) {
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

module("appjs").service("globalCache", ["globals", function (globals) {
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
/*global window, jQuery, _ */
/*
 * Client methods:
 *     JSPM.pkgSrc = "/packagemanager/path";
 *     JSPM.instal("PackageName"); // can be an array
 *     JSPM.register("ServerLoadedPackage");
 * 
 * Server configuration:
 *     Need to set JSPM.pkgSrc and have it return the JavaScript package manafest in json.
 *
 *     Request "~/jspm/PackageName
 *     Response // all arrays can also be a string if only one
 *     {
 *         name: "PackageName",
 *         scripts: [],
 *         styles: [],
 *         templates: [], // the templates are appended to the body
 *         dependencies: []
 *     }
 *
 */
(function (root, $, _) {
	"use strict";

	var jspm, JSPM;
	
	JSPM = {
		
		pkgSrc: null,
		
		install: function (pkgs, success, proxy) {
			/// <summary>
			///     pkgs - A package name or array of package names to install.
			///     success - a callback called when the package has been installed.
			///     proxy - sets the context ('this') in the success callback.
			/// Returns a promise which is resolved when the package has been installed.
			/// </summary>
			var dfds = [];

			pkgs = jspm.asArray(pkgs);
				
			_.each(pkgs, function (pkg) {
				var dfd, promise = jspm.cache[pkg];
				if (!promise) {
				    dfd = jspm.promisePackage(pkg);
				    dfds.push(dfd);
				    jspm.cache[pkg] = dfd;
				}
				dfds.push(promise);
			});
			
			success = success || function () { };
			proxy = proxy || this;
			return $.when.apply($, dfds).then(function () {
				setTimeout(_.bind(success, proxy), 100); // jch! hack but test for now
			});
		},
		
		register: function (packageName) {
			/// <summary>Add the package to the cache and registration table.</summary>
			jspm.cache[packageName] = jspm.resolved();
			JSPM.registered.unshift(packageName);
		},
		
		registered: []
	};
	
	jspm = {
		
		cache: {},
		
		asArray: function (obj) {
			/// <summary>
			/// If not an array, will make the object
			/// the only item in a new array.
			/// </summary>
			return _.isArray(obj) ? obj : [obj];
		},
		
		resolved: function () {
			return $.Deferred().resolve().promise();
		},
		
		url: function (pkg) {
			return JSPM.pkgSrc + "?name=" + pkg;
		},
		
		promisePackage: function (pkg) {
			var promisePackage = $.Deferred(),
			    getPackageManifest = $.get(jspm.url(pkg));

			getPackageManifest.then(function (packageManifest) {
				var installDependencies = packageManifest.dependencies ?
					JSPM.install(packageManifest.dependencies) :
					jspm.resolved();
				
				installDependencies.then(function() {
					var promises;
					promises = [
						jspm.promiseScripts(packageManifest.scripts),
						jspm.promiseStyles(packageManifest.styles),
						jspm.promiseTemplates(packageManifest.templates)
					];
					$.when.apply($, promises).then(promisePackage.resolve);
				});
			});
			return promisePackage.promise();
		},
		
		promiseScripts: function (scripts) {
			var dfd = $.Deferred(),
				toLoad = [];
			
			if (!scripts || scripts.length === 0) {
				return jspm.resolved();
			}
			
			scripts = jspm.asArray(scripts);
			_.each(scripts, function (script) {
				toLoad.push($.getScript(script));
			});
			$.when.apply($, toLoad).then(dfd.resolve);
			return dfd.promise();
		},
		
		promiseStyles: function (styles) {
			_.each(styles, function (style) {
				 $("head").append($('<link/>').attr({
					rel: "stylesheet",
					type: "text/css",
					href: style
				}));
			});
			return jspm.resolved();
		},
		
		promiseTemplates: function (templates) {
			var dfd = $.Deferred(),
			    toLoad = [];

			if (!templates || templates.length === 0) {
				return jspm.resolved();
			}
			
			templates = jspm.asArray(templates);
			_.each(templates, function (template) {
				var getTemplate = $.ajax({ url: template, dataType: "html" })
					.then(function (response) {
						 $(root.document.body).append(response);
					});
				toLoad.push(getTemplate);
			});
			$.when.apply($, toLoad).then(dfd.resolve);
			return dfd.promise();
		}
	};

	root.JSPM = JSPM;

}(window, jQuery, _));
