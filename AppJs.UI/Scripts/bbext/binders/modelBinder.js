/*
 * ModelBinder.js
 */
/*
 * Description:
 *     Binds an element to a model.
 *
 * Dependencies:
 *     jQuery, Backbone
 * 
 * Usage:
 *     var mb = ModelBinder(someModel, someElement);
 * 	   mb.unbind();
 *
 *     Binds to the model property using:
 *     1) data-bind="attributeName"
 *     2) name="attributeName"
 *     3) id="attributeName"
 *
 * Type processing:
 *     Processing data from the view to model or model to view is done by a binding type.
 *     1) data-type="someType"
 *     2) type="someType"
 *     3) tag name
 *     
 * ModelBinder.config:
 *     Type and attribute processing can be configured.
	
		// eventFromDom, getFromDom, setToDom
 *     ModelBinder.config.types["foo"] = {
 *         event: "click",               // additional dom event(s) to listen on the element to update the model
 *         get: function (el, event, binding) { },       // a method to get the value out of the dom for the model
 *         set: function (el, value) { } // a method to set the value in the dom
 *     }
 *     ModelBinder.config.attributes["disabled"] = "boolean";
 *     ModelBinder.config.attributes["foo"] = "string";
 *     ModelBinder.config.attributeTypes["boolean"] = function (el, attr, value) { }; // a setter for the attribute
 *
 * Complex controls:
 *     Complex controls can store their value in a hidden input. In order for the model to update,
 *     a change event must be fired on the hidden field manually.
 *	   $("#some-hidden-field").val("someCmplexControlsValue").change();
 */
(function ($) {

	var config = {
		modelGet: "get",
		modelSet: "set",
		types: {
//			"text": { event: "keyup" },
//			"textarea": { event: "keyup" },
			"checkbox": {
				get: function (el) {
					return el.is(":checked");
				},
				set: function (el, value) {
					el.attr("checked", value);
				}
			},
			"contenteditable": {
				event: ["keydown", "blur"],
				get: function (el, event, binding) {
					var val = this.model.get(binding.name);
					if (event.type === "keydown") {
						if (event.keyCode == 27) { // escape
							setTimeout(function () {
								el.blur();
							}, 0);
							el.text(val);
						} else if (event.keyCode == 13) { // enter
							el.blur();
							val = el.text();
							el.text(val);
						}
					} else { // event is blur
						val = el.text();
					}
					// console.log(event.type, val);
					return val;
				},
				set: function (el, value) {
					el.html(value);
				}
			},
			"multicheckbox": {
				get: function (el) {
					var name = el.attr("name");
					var selected = this.$el.find("[name='" + name + "']:checked");
					var roles = _.map(selected, function (el) {
						return $(el).attr("value");
					});
					return roles;
				},
				set: function (el, value) {

					var elValue = el.val();
					var checked = _.any(value, function (value) {
						return elValue === value;
					});
					el.attr("checked", checked);
				}
			},
			"radio": {
				set: function (el, value) {
					el.attr("checked", el.val() === value);
				}
			}
		},
		attributes: {
			"id": "string",
			"disabled": "boolean",
			"checked": "boolean",
			"class": "string",
			"href": "string",
			"text": "text",
			"src": "string"
		},
		attributeTypes: { // attributeBinders
			"string": function (el, attr, value) {
				el.attr(attr, value);
			},
			"boolean": function (el, attr, value) {
				if (!value) {
					el.removeAttr(attr);
				} else {
					el.attr(attr, true);
				}
			},
			"text": function (el, attr, value) {
				el.html(value);
			}
		}
	};

	var ModelBinder = function (model, el) {
		if (this instanceof ModelBinder === false) {
			return new ModelBinder(model, el);
		}

		this.model = model;
		this.$el = $(el);
		if (this.$el.data("modelbound") === true) {
			this.unbind();
		}
		this.$el.data("modelbound", true);
		// this.attrs = attrs || ModelBinder.config.attributes;
		this.bindings = {};
		this._modelToViewProxy = $.proxy(this._modelToView, this);
		this.model.bind("change", this._modelToViewProxy);
		this._init();
		return this;
	};

	ModelBinder.prototype = {
		model: null, // holds the model
		$el: null, 	// stores the container that is being bound
		bindings: {}, // stores binding elements by name (each value is an array of elements).

		_init: function () {
			var $els, viewToModelProxy;

			viewToModelProxy = $.proxy(this._viewToModelFromEvent, this);
			$els = this.$el.find("[data-bind],[name],[id]");

			// build the bindings 
			$.each($els, $.proxy(function (index, el) {
				var name, type, changeEvent, val;

				el = $(el);
				name = el.attr("data-bind") || el.attr("name") || el.attr("id");
				if (!name) {
					return; // continue;
				}

				val = this.model[config.modelGet](name);
				if (val === undefined) {
					return; // continue - do not add binding for an undefined attr
				}

				type = el.attr("data-type") || el.attr("type") || el[0].tagName.toLowerCase();
				el.data("binding", {
					name: name,
					type: type
				});

				this._addBinding(name, el);

				changeEvent = this._getChangeEvent(el, type);
				if (changeEvent) {
					_.each(changeEvent, function (event) {
						el.bind(event + ".modelbinder", viewToModelProxy);
					});
				}

				// set the initial value
				this.updateEl(el, name, this.model[config.modelGet](name));

			}, this));

			this._initAttrBindings();
			this._updateFromView();
		},

		_getChangeEvent: function (el, type) {
		    var configEv = config.types[type],
		        event = (configEv && configEv.event) || "change",
				attrEv = el.attr("data-bind-event"); // event override in markup
		    event = attrEv || event;
		    return _.isArray(event) ? event : [event];
		},

		_initAttrBindings: function () {

			$.each(config.attributes, $.proxy(function (attr, type) {

				var els = this.$el.find("[data-bind-" + attr + "]");
				$.each(els, $.proxy(function (i, el) {
					var name, binding;

					el = $(el);
					name = el.attr("data-bind-" + attr);
					binding = el.data("binding") || {};
					if (!binding.attrs) {
						binding.attrs = {};
					}
					binding.attrs[attr] = name;
					el.data("binding", binding);

					this._addBinding(name, el);

					this.updateEl(el, name, this.model[config.modelGet](name));
				}, this));

			}, this));
		},
		
		_updateFromView: function () {
			/// <summary>Used to capture autofill values that do not trigger a change event.</summary>
			var self = this;
			setTimeout(function () {
				_.each(self.bindings, function (binding, propName) {
					_.each(binding, function (el) {
						if (el.is(":text,:password,select")) {
							self._viewToModel(el);
						}
					});
				});
			}, 500);
		},

		_addBinding: function (name, el) {
			this.bindings[name] = this.bindings[name] || [];
			this.bindings[name].push(el);
		},

		_viewToModelFromEvent: function (event) {
			this._viewToModel($(event.target), event);
		},
		
		_viewToModel: function (el, event) {
			var binding = el.data("binding"),
				get,
				val,
				opts;
			
			if (!binding) {
				return;
			}

			get = (config.types[binding.type] && config.types[binding.type].get) || function (el) {
				return el.val();
			};

			// don't trigger a change if the initial model value is falsy
			val = get.call(this, el, event, binding);
			if (val === "" && !this.model[config.modelGet](binding.name)) {
				opts = { silent: true };
			}
			this.model[config.modelSet](binding.name, val, opts);
		},

		_modelToView: function (model) {
			var name, els, newVal;

			_.each(model.changed, function (value, key) {
				name = key;
			    els = this.bindings[name];
			    if (els) {
				    newVal = model.get(name);
				    $.each(els, $.proxy(function (index, el) {
					    this.updateEl(el, name, newVal);
				    }, this));
			    }
			}, this);
		},

		updateEl: function (el, name, value) {
			var binding, set;

			el = $(el);
			if (el.is(":focus")) {
				return;
			}
			binding = el.data("binding");
			if (!binding) {
				this.unbind();
				return;
			}
			value = value === null ? "" : value;

			if (binding.name === name) {
				set = (config.types[binding.type] && config.types[binding.type].set) || function (el, value) {
					el.is(":input") ? el.val(value) : el.html(String(value));
				};
				set.call(this, el, value);
			}

			// set the attributes
			if (binding.attrs) {
				$.each(binding.attrs, $.proxy(function (attr, modelPropertyName) {
					var attrType, setter;

					if (modelPropertyName === name) {
						attrType = config.attributes[attr];
						setter = config.attributeTypes[attrType];
						setter(el, attr, value);
					}
				}, this));
			}
		},

		unbind: function () {
			this.$el.find("[data-bind],[name],[id]").unbind(".modelbinder");
			this.model.unbind("change", this._modelToViewProxy);
			this.$el.data("modelbound", false);
		},
		
		off: function () {
			this.unbind();
		}
	};

	window.ModelBinder = ModelBinder;
	ModelBinder.config = config;



}(jQuery));


// jch!!! - make this a dataBinder that determines if to use a modelBinder or a collectionBinder
context.module("bbext").shim("modelBinder", ["$", "_", function ($, _) {

	return {
		render: function (el, model) {
			var binder,
				listeners = this._listeners || (this._listeners = {}); // Backbone
			
			binder = new ModelBinder(model, el);
			listeners[_.uniqueId("modelBinder")] = binder;
		}
	};
}]);