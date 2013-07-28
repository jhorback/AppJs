/*!
 * Menu.js
 */
/*
 * Description:
 *     Wraps an element in a menu with a few options for configuration.
 * 
 * Requires:
 *     jQuery
 *
 * Options:
 *     transition - "none", "fade", "slide"
 *
 */
(function ($) {
	var Menu, win, doc;

	win = $(window);
	doc = $(document);

	Menu = function (el, options) {
		if (this instanceof Menu === false) {
			return new Menu(el, options);
		}

		this.element = $(el);
		this.menuEl = null;
		this.options = $.extend({}, Menu.defaultOptions, options);
		this.events = [];
		this.init();
		return this;
	};

	Menu.prototype = {
		init: function () {
			var self = this;

			win.bind("resize.menu", function () {
				self.position();
			});

			doc.bind("keydown.menu", function (event) {
				// 27 - escape key
				if (event.which == 27) { //ignore jslint - event.which requires coersion
					self.close();
				}
			});

			setTimeout(function () {
				doc.bind("click.menu", function (event) {
					var target = $(event.target);
					if (target.closest(".menu").length === 0) {
						self.close();
					}
				});
			}, 0);

			this.render().show();
		},

		render: function () {
			var self = this, frag;

			frag = $.parseHTML(Menu.template);
			this.menuEl = $(frag);
			this.menuEl.find(".menu-content").append(this.element.show());
			doc.find("body").append(this.menuEl.hide());
			this.position();
			return this;
		},

		position: function () {
			var menu = this.menuEl,
			    el = this.element,
				o = this.options;

			// make sure the top and left positions are within the viewport
			// tried to use collision for this but could not get it to work
			setTimeout(function () {
				var dcCss = {};
				var dcPos = menu.position();

				if (dcPos.top < 0) {
					dcCss["top"] = 0;
				} if (dcPos.left < 0) {
					dcCss["left"] = 0;
				}

				// only reset the position if necessary to reduce a reflow
				if (dcCss.top !== undefined || dcCss.left !== undefined) {
					menu.css(dcCss);
				}
				
				// ensure the elements width for ie 9+
				el.width(el.children().eq(0).width());
			}, 0);
		},

		show: function () {
			this._transition(this.menuEl, true);
		},

		_transition: function (el, show, callback) {
			var methods = {
				"fade": function () {
					show ? el.fadeIn(callback) : el.fadeOut(callback);
				},
				"slide": function () {
					show ? el.slideDown("fast", callback) : el.slideUp("fast", callback);
				},
				"none": function () {
					show ? el.show() : el.hide();
					callback && callback.call();
				}
			};
			if (!el) {
				return;
			}
			methods[this.options.transition.toLowerCase()].call();
		},

		close: function (callback) {
			var self = this,
				destroyProxy = function () {
					_.isFunction(callback) && callback();
					$.proxy(self.destroy, self)();
				};
			this.element.trigger("close");
			this._transition(this.menuEl, false, destroyProxy);
		},

		destroy: function () {
			if (this._removed) {
				return;
			}
			this._removed = true;

			win.unbind(".menu");
			doc.unbind(".menu");

			this.element.remove();
			this.menuEl.remove();
		}
	};

	Menu.defaultOptions = {
		transition: "none"
	};

	Menu.template = '' +
		'<div class="menu">' +
		'	<div class="menu-content"><!--menu element is placed here--></div>' +
		'</div>';

	window.Menu = Menu;


} (jQuery));