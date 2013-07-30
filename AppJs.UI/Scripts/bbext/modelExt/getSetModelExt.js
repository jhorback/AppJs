
var getSetModelExt = (function () {

	var gsAppExt = {
		get: function (name) {
			var val,
				getFn = this[name] && this[name].get,
				currentValue = Backbone.Model.prototype.get.apply(this, arguments);
			
			if (_.isFunction(getFn) && getFn !== gsAppExt.get) {
				val = getFn.call(this, currentValue);
				if (val !== undefined) {
					this.attributes[name] = val; // keep the attrs in sync - may not need?
				}
			} else {
				val = currentValue;
			}
			return val;
		},

		set: function (name, value, options) {
		    var model = this,
                multiProps,
                getValueToSet = _.bind(function (name, value) {
                    var  setFn = $.isPlainObject(this[name]) && this[name].set;
                    value = _.isFunction(setFn) ? setFn.call(this, value, options) : value;
                    return value;
                }, this);

		    // set is called in model construction
			// use this as a trigger to parse and handle bindings
		    modelGetSetExt.setupInstance(this);

			if (_.isObject(name)) {
			    multiProps = {};
			    options = arguments[1];
			    _.each(arguments[0], function (value, name) {
			        multiProps[name] = getValueToSet(name, value);
			    }, this);
			    Backbone.Model.prototype.set.call(this, multiProps, options);
				return this;
			}
			
			Backbone.Model.prototype.set.call(this, name, getValueToSet(name, value), options);
			return this;
		},
		
		toJSON: function () {
			var json = { };
			var model = this;
			_.each(this.attributes, function (value, name) {
				var val = model.get(name);
				// if val is undefined use the attribute value (which is the default).
				val = val !== undefined ? val : model.attributes[name];
				json[name] = val;
			});
			return json;
		},
		
		refresh: function () {
			this.set(this.toJSON());
		}
	};


	return {
		
	    setupInstance: function (instance) {
	        if (instance._gsinit === true) {
	            return;
	        }
	        instance._bindings = {};
	        modelGetSetExt.parseBindings(instance);
	        modelGetSetExt.handleBindings(instance);
	        instance._gsinit = true;
	    },
		
		parseBindings: function (instance) {
		    $.each(instance, function (name, value) {
		        var toBind;
		        if (value && value.bind && _.isFunction(value.bind) === false) {
                    toBind = _.isArray(value.bind) ? value.bind : [value.bind];
					_.each(toBind, function (propName) {
						instance._bindings[propName] = instance._bindings[propName] || [];
						instance._bindings[propName].push(name);
					});
				}
			});
		},
		
		handleBindings: function (instance) {
			instance.on("all", function (change) {
			    var prop = change && change.split(":")[1];
			    if (prop && this.attributes[prop] !== undefined) {
					_.each(this._bindings[prop], function (depPropName) {
					    this.set(depPropName, this.get(depPropName));
					}, this);
				}
			});
		},

		extend: function (protoOrInstance) {
		    if (protoOrInstance._gsinit !== true) {
		        _.extend(protoOrInstance, gsAppExt);
		    }
		}
	};

} ());
