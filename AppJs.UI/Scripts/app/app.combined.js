/*
 * context.js
 * 
 * Description:
 *     Creates an inversion of control container for JavaScript.
 *     Function dependencies are determined by their arguments, however, for obfusticated scripts
 *     an $inject property can be placed on the prototype or function itself.
 *
 * Methods:
 *     context.create() - creates a new container.
 *
 * Context methods:
 *     register(name, value, type) - registers an object with the container.
 *         - value can be any object or a constructor/factory function.
 *         - type can be object, function, construtor
 *         - object and constructor can be determined dynamically, function cannot.
 *
 *     get(name)
 *         - creates, retrieves the dependency.
 *
 *     call(method, args, context)
 *         - a utility method for satisfying the dependencies of a method directly.
 *         - the context will be applied to the method call -> 'this'
 *
 *     instantiate(constructor, args)
 *         - calls the constructor which can also be the name
 *           of a registered dependency.
 */
var context = (function () {
	var ioc = {
		INSTANTIATING: {},
		
		getFnArgs: function (fn) {
			var val = fn.$inject || fn.prototype.$inject ||
				(window.debug && fn.toString().match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m)[1].split(',')) || [];
			return val[0] === "" ? [] : val;
		},

		get: function (request, name, args) {
			var reg;

			name = name.replace(/^\s+|\s+$/g, ''); // trim
			reg = request.context.registry[name];
			if (!reg) {
				throw new Error("Unknown dependency: " + name);
			}
			if (reg.instance) {
				return reg.instance;
			}
			
			if (!reg.type && reg.value instanceof Function === false) {
				reg.type = "object";
			}
			
			// if the value is not a function, use it as the instance
			if (reg.type === "object" || reg.type === "function") {
				reg.instance = reg.value;
				reg.type = "object";
				return reg.instance;
			}

			reg.type = "construtor";
			reg.instance = ioc.instantiate(request, reg.value, args);
			return reg.instance;
		},

		instantiate: function (request, constructor, args) {
			var instance, injectedInstance, returnValue;

			injectedInstance = function () { };
			injectedInstance.prototype = constructor.prototype;
			instance = new injectedInstance;

			returnValue = ioc.call(request, constructor, args, instance);
			return returnValue || instance;
		},

		call: function (request, method, args, context) {
			var resolved, deps, t, start;

			args = args || [];
			resolved = Array.prototype.slice.call(args, 0); // clones the array
			start = resolved.length;
			deps = ioc.getFnArgs(method);
			for (t = start; t < Math.max(deps.length, args.length) ; t++) {
				args[t] !== undefined ?
					resolved.push(args[t]) :
					resolved.push(request.get(deps[t]));
			}

			resolved.push(request.context);
			return method.apply(context, resolved);
		},

		createRequest: function (context) {
			return {
				visited: {},
				visitedArray: [],
				context: context,
				get: function (name, args) {
					this.visitedArray.push(name);
					if (this.visited[name] === ioc.INSTANTIATING) {
						throw new Error("Circular reference: " + this.visitedArray.join(" -> "));
					}

					this.visited[name] = ioc.INSTANTIATING;
					return this.visited[name] = ioc.get(this, name, args);
				}
			};
		},
		
		getRegistryValue: function (registry, name) {
			if (!registry[name]) {
				throw new Error("Could not instantiate type not found: " + name);
			}
			return registry[name].value;
		}
	};

	return {
		create: function () {
			return {
				registry: {},

				register: function (name, value, type) {
					// type can be object, function, construtor
					// object and constructor can be determined dynamically, function cannot.
					var reg, key;

					if (arguments.length === 1) {
						reg = arguments[0];
						for (key in reg) {
							this.register(key, reg[key]);
						}
					} else {
						this.registry[name] = {
							value: value,
							type: type
						};
					}
				},

				get: function (name, raw) {
					var request;
					if (raw === true) {
						return ioc.getRegistryValue(this.registry, name);
					}
					request = ioc.createRequest(this);
					return request.get(name);
				},

				call: function (method, args, context) {
					var request = ioc.createRequest(this);
					return ioc.call(request, method, args, context);
				},

				instantiate: function (constructor, args) {
					var name, request;

					if (typeof arguments[0] === "string") {
						name = arguments[0];
						constructor = ioc.getRegistryValue(this.registry, name);
					}

					request = ioc.createRequest(this);
					return ioc.instantiate(request, constructor, args);
				}
			};
		}
	};
}());
/*
 * app.js
 *
 * Description:
 *     Facilitates the create of modules and apps.
 * 
 * Methods:
 *     module(moduleName)
 *         - creates/references the module by name.
 *     app(appName)
 *         - create/references the app by name.
 *
 * App/Module methods:
 *     module.register(name, value)
 *         - a call to register on the internal context object.
 *     module.construct(name, creator)
 *         - Creates a construct to be used by the module.
 *     module.use(moduleDependencies)
 *         - Any number of arguments (or an array) of dependent module names.
 *     module.config(fn)
 *          - registers a config method to execute before application start.
 *          - fn can be injected using the array notation
 *
 * App methods:
 *     app.start(fn)
 *          - registers a start method to execute after all configuration methods have executed.
 *          - fn can be injected using the array notation
 *
 *     app.start()
 *          - calling start without arguments 'starts' the app bootstrapping process.
 *
 * Available services:
 *     context - the ioc container for the app
 *     globals - a global cache shared accross apps.
 *
 * Available constructs:
 *     service - a simple call to register.
 */
context.module = (function (context) {

	var _ = {
		modCache: {},

		// a global variable cache used to share things across applications
		globals: {},

		isArray: Array.isArray || function (obj) {
			return Object.prototype.toString.call(obj) == '[object Array]';
		},

		mixin: function (destination, source, callback) {
			var k, ok = true;
			for (k in source) {
				if (source.hasOwnProperty(k)) {
					if (callback) {
						ok = callback(k, destination[k], source[k]);
					}
					if (ok) {
						// callback && console.log("COPY: ", k, "source", source[k], "destination", destination[k]);
						destination[k] = source[k];
					}
				}
			}
			return destination;
		},

		handleInject: function (fnOrArray) {
			var fn;
			if (_.isArray(fnOrArray)) {
				fn = fnOrArray.pop();
				fn.$inject = fnOrArray;
			} else {
				fn = fnOrArray;
			}
			return fn;
		},

		construct: function (modvars, creator) {
			return function (name, construct, proto) {
				var retFn, protoObj, module;

				// don't require a constructor (if just an empty function)
				if (typeof construct !== "function" && !_.isArray(construct)) {
					proto = arguments[1];
					construct = function () {};
				}

				module = modvars.instance;
				construct = _.handleInject(construct);
				_.mixin(construct.prototype, proto);

				creator = _.handleInject(creator);
				retFn = modvars.context.call(creator, [], module);
				protoObj = retFn.apply(module, [construct, name]);
				if (!protoObj) {
					throw new Error("The inner construct function did not return anything.");
				}
				module.register(name, protoObj);
				return protoObj;
			};
		},

		mixinRegistries: function (dest, src) {
			_.mixin(dest, src, function (name, i1, i2) {
				// don't copy if it is the context, globals, or already defined
				delete i2.instance; // make sure to not carry over any created instances
				if (name === "context" || name === "globals" || dest[name]) {
					return false;
				}
				return true;
			});
		},
		
		foreachUse: function (appvars, moduleName, callback, visited) {
			var modvars = _.modCache[moduleName],
			    use = modvars.use,
			    i,
			    useModName,
				usemodvars,
				len;


			// mixed - guard against calling on a module more than once
			visited = visited || {};
			len = use.length;
			for (i = 0; i < len; i++) {
				useModName = use[i],
				usemodvars = _.modCache[useModName];

				if (!visited[useModName]) {
					if (!usemodvars || usemodvars.isApp === true) {
						throw new Error("Cannont find module: " + useModName);
					}
					visited[useModName] = true;
					_.foreachUse(appvars, use[i], callback, visited);
				}
			}

			callback(modvars);
		},

		mixinAppRegistries: function (appvars, moduleName) {
			_.foreachUse(appvars, moduleName, function (modvars) {
				_.mixinRegistries(appvars.context.registry, modvars.context.registry);
			});
		},

		bootstrap: function (appvars, moduleName) {
			var i, len, ctx = appvars.context;

			_.foreachUse(appvars, moduleName, function (modvars) {
				// inject and execute config methods
				len = modvars.config.length;
				for (i = 0; i < len; i++) {
					ctx.call(modvars.config[i], [], modvars.instance);
				}

				// inject and execute start methods if an app
				if (modvars.isApp) {
					len = modvars.start.length;
					for (i = 0; i < len; i++) {
						ctx.call(modvars.start[i], [], modvars.instance);
					}
				}
			});
		},

		createModule: function (name, isApp) {

			var modvars = {
				name: name,
				instance: null,
				isApp: isApp,
				context: context.create(),
				constructs: {},
				use: [],
				config: [],
				start: []
			};

			modvars.context.registry._name = name; // testing
			if (isApp) {
				modvars.context.register("context", modvars.context);
			}
			modvars.context.register("globals", _.globals);

			modvars.instance = {
				register: function () {
					modvars.context.register.apply(modvars.context, arguments);
					return this;
				},

				construct: function (constructName, creator) {
					modvars.constructs[constructName] = modvars.instance[constructName] = _.construct(modvars, creator);
					return this;
				},

				use: function (modules) {
					var i, modName, usemodvars, ctx;

					modules = _.isArray(modules) ? modules : Array.prototype.slice.call(arguments, 0);
					ctx = modvars.context;

					for (i = 0; i < modules.length; i++) {
						modName = modules[i];
						modvars.use.push(modName);

						usemodvars = _.modCache[modName];
						if (!usemodvars || usemodvars.isApp === true) {
							continue;
						}

						// mixin the constructs
						_.mixin(modvars.constructs, usemodvars.constructs, function (name, i1, i2) {
							if (modvars.constructs[name]) {
								return false;
							}
							modvars.instance[name] = i2;
							return true;
						});

						_.mixinRegistries(ctx.registry, usemodvars.context.registry);
					}
					return this;
				},

				config: function (fn) {
					modvars.config.push(_.handleInject(fn));
					return this;
				}
			};

			if (modvars.isApp) {
				modvars.instance.start = function (fn) {
					if (arguments.length === 0) {
						if (!modvars.started) {
							_.mixinAppRegistries(modvars, name);
							_.bootstrap(modvars, name);
						}
						modvars.started = true;
					} else {
						modvars.start.push(_.handleInject(fn));
					}
					return this;
				};

				modvars.instance.call = function (fn) {
					modvars.context.call(_.handleInject(fn));
				};
			}

			modvars.instance.construct("service", function () {
				return function (construct) {
					return construct;
				};
			});

			return modvars;
		}
	};

	window.appDebug = function () {
		console.log(_.modCache);
	};

	return function (moduleName) {
		var isApp,
			modvars = _.modCache[moduleName];

		if (!modvars) {
			isApp = arguments[1] ? true : false;
			modvars = _.createModule(moduleName, isApp);
			_.modCache[moduleName] = modvars;
		}

		return modvars.instance;
	};
}(context));


context.app = (function () {

	return function (appName) {
		return context.module(appName, true);
	};

}());