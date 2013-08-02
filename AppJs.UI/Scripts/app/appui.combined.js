/*!
* Dialog.js
*/
/*
* Description:
*     Wraps an element in a dialog with a few options for configuration.
* 
* Requires:
*     jquery.ui.position.js
*     jquery.ui.draggable.js (optional)
*
* Options:
*     title
*     transition - "none", "fade", "slide", "fadein"
*     modal - default is true
*     draggable - default is true (if jquery.ui.draggable exists)
*     position - jquery.ui.position options (the default is center of the window).
*     editorFor - An element that is being edited by the dialog (sets modal to true, draggable to false, and handles the positioning).
*     removeEl - removes the element when the dialog is closed. The default is true.
*         If false, the original element will be placed back into it's parent on close.
*     appendTo - An optional element to append to (other than the body).
*
* Dialog close attribute
*     Any element with a data-rel attribute set to back ([data-rel=back]) will
*     close the dialog when clicked.
*/
(function ($) {
	var Dialog, win, doc;

	win = $(window);
	doc = $(document);

	Dialog = function (el, options) {
		if (this instanceof Dialog === false) {
			return new Dialog(el, options);
		}

		this.element = $(el);
		this.dialogEl = null;
		this.overlay = null;
		this.options = $.extend({}, Dialog.defaultOptions, options);
		this.events = [];

		if (this.options.editorFor) {
			$.extend(this.options, {
				modal: true,
				// draggable: false, 
				position: {
					my: "center",
					at: "center",
					of: this.options.editorFor,
					offset: "0 0"
				}
			});
		}

		if (this.options.removeEl === false) {
			this.parentEl = this.element.parent();
		}

		this.init();
		return this;
	};

	Dialog.prototype = {
		init: function () {
			var self = this;

			win.bind("resize.dialog", function () {
				self.position();
			});

			doc.bind("keydown.dialog", function (event) {
				// 27 - escape key
				if (event.which == 27) { //ignore jslint - event.which requires coersion
					self.close();
				}
			});

			this.render()
				.bind(".dialog-close", "click", "close")
				.bind("[data-rel=back]", "click", "close");
			this.show();
		},

		render: function () {
			var self = this;

			this.dialogEl = $($.parseHTML(Dialog.template));
			this.dialogEl.find("h1").html(this.options.title);
			this.dialogEl.find(".dialog-content").append(this.element.show());
			doc.find(this.options.appendTo).append(this.dialogEl.hide());
			this.position();
			if (this.options.draggable && $.fn.draggable) {
				this.dialogEl.draggable({
					handle: ".dialog-header",
					axis: "y"
					//					,start: function (event, ui) {
					//						self.element.find("iframe").hide();
					//					},
					//					stop: function () {
					//						self.element.find("iframe").show();
					//					}
				}); //.find("h1").css("cursor", "move");
			}

			setTimeout(function () {
				self.element.find("[autofocus]").focus();
			}, 100);
			return this;
		},

		bind: function (selector, event, method) {
			var el = this.dialogEl.find(selector);

			method = $.proxy(this[method], this);
			this.events.push({ el: el, event: event, method: method });
			el.bind(event, method);
			return this;
		},

		position: function () {
			var dlg = this.dialogEl;

			dlg.position(this.options.position);

			// make sure the top and left positions are within the viewport
			// tried to use collision for this but could not get it to work
			setTimeout(function () {
				var dcCss = {};
				var dcPos = dlg.position();

				if (dcPos.top < 0) {
					dcCss["top"] = 0;
				}
				//				if (dcPos.left < 0) {
				//					dcCss["left"] = 0;
				//				}
				dcCss["left"] = 0;

				// only reset the position if necessary to reduce a reflow
				if (dcCss.top !== undefined || dcCss.left !== undefined) {
					dlg.css(dcCss);
				}
			}, 0);
		},

		show: function () {
			this._transition(this.dialogEl, true);
			if (this.options.modal && !this.overlay) {
				this.overlay = $(Dialog.overlayTemplate);
				doc.find(this.options.appendTo).append(this.overlay);
				this.overlay.css("opacity", .5); // for ie7-8				
				this._transition(this.overlay, true);
			}
		},

		_transition: function (el, show, callback) {
			var methods = {
				"fade": function () {
					show ? el.fadeIn(callback) : el.fadeOut(callback);
				},
				"fadein": function () {
					show ? el.fadeIn(callback) : el.hide(0, callback);
				},
				"slide": function () {
					show ? el.slideDown(callback) : el.slideUp(callback);
				},
				"none": function () {
					show ? el.show(0, callback) : el.hide(0, callback);
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
			this._transition(this.dialogEl, false, destroyProxy);
			this._transition(this.overlay, false);
		},

		destroy: function () {
			var i, boundEvent;

			if (this._removed) {
				return;
			}
			this._removed = true;

			win.unbind(".dialog");
			doc.unbind(".dialog");

			// unbind events bound with this.bind(...)
			i = this.events.length;
			while (i--) {
				boundEvent = this.events[i];
				boundEvent.el.unbind(boundEvent.event, boundEvent.method);
			}

			if (this.options.removeEl) {
				this.element.remove();
			} else {
				//this.element.trigger("detach", [this.element.detach()]);
				setTimeout(_.bind(function () {
					this.parentEl.append(this.element.detach().hide());
				}, this), 0);
			}
			this.dialogEl.remove();
			this.overlay && this.overlay.remove();
		}
	};

	Dialog.defaultOptions = {
		title: "",
		transition: "none",
		modal: true,
		draggable: true,
		position: {
			my: "left center",
			at: "left center",
			of: win,
			offset: "0 -100"
		},
		editorFor: null,
		removeEl: true,
		appendTo: "body"
	};

	Dialog.template = '' +
		'<div class="dialog-wrapper">' +
		'	<div class="dialog">' +
		'		<div class="dialog-header">' +
		'			<h1></h1>' +
		'			<span data-rel="back" title="close" class="dialog-close">&times;</span>' +
		'		</div>' +
		'		<div class="dialog-content"><!--dialog element is placed here--></div>' +
		'	</div>' +
		'</div>';

	Dialog.overlayTemplate = '<div class="overlay"/>';

	window.Dialog = Dialog;


}(jQuery));
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
/*globals window, document, jQuery*/

/*
things to do
----------------

If this remains a jquery widget, will want to rename the file back to Selectlist or something other than selectable.



Focus and keyboard support.
	Focus on outer container
	arrow keys used to move inner selection
	enter/spacebar to select




*/


/*!
 * ui.selectlist.js v1.0.1
 *     modified for jslint
 *     fixed a radio button click error
 */
/*
* Descripiton:
*     Adds behavior to list selection. Works with any kind of list (i.e. tr, li, etc.).
*     Works with checkboxes, radiobuttons, and hyperlinks.
* 
* Dependencies:
*     jQuery
*     jQuery.ui.widget
*
* Options:
*    rowSelector - selector for the row. Default is tr (could be li, or ul, or whatever markup is used as the row). 
*    hideInputs - makes any inputs inside the list hidden.
*
* Notes:
*     [data-role=checkall] - An element with a data-role attribute set to checkall will be used to select/unselect all rows.
*     .selected - Selected rows will have a "selected" class name applied to them.
*     [data-selectable=false] - Keeps the row from being selected. This attribute is automatically applied to the parent row of 'checkall' elements.
*         this does not keep the checkbox from being checked (disable the checkbox if that is needed).
*

(function ($) {

   return;
   var doc = $(document);

   $.widget("ui.selectlist", {
	   options: {
		   rowSelector: "li",
		   hideInputs: false
	   },
	   
	   _checkall: null,
	   
	   _create: function () {
		   var self = this,
			   o = this.options;

		   if (o.rowSelector === "li" && this.element[0].tagName.toLowerCase() === "table") {
			   o.rowSelector = "tr";
		   }

		   this.element.attr("tabindex", 0);

		   if (this.options.hideInputs) {
			   this.element.find(":input").hide();
		   }

		   this.element.bind("click.selectlist", $.proxy(this._clickList, this));

		   // select all checked items
		   this.element.find(":checked").each(function () {
			   var checkbox = $(this);
			   self.isRowSelectable(checkbox);
			   self.row(checkbox).addClass("selected");
		   });

		   doc.bind("keydown.selectlist", $.proxy(this._documentKeyDown, this));
		   doc.bind("keyup.selectlist", $.proxy(this._documentKeyUp, this));

		   // implement checkall
		   this._checkall = this.element.find("[data-role=checkall]");
		   this.row(this._checkall).attr("data-selectable", false);
		   this._checkall.bind("click.selectlist", function () {
			   var rows = self.element.find(self.options.rowSelector);
			   self._selectRange(rows.first(), rows.last(), self._checkall.prop("checked"));
		   });
	   },
	   
	   _clickList: function (event) {
		   var selectable,
			   self = this,
			   target = $(event.target),
			   row = this.row(target);

		   if (this.isRowSelectable(target) === false) {
			   return;
		   }

		   // if we are clicking directly on a link or an input element
		   if (target.closest("a,:input").length > 0) {
			   if (target.is(":input")) {
				   if (target.is(":radio")) {
					   self._clickRadio(event, target);
				   } else if (target.is(":checkbox")) {
					   if (target.prop("checked")) {
						   row.addClass("selected");
					   } else {
						   row.removeClass("selected");
					   }
				   }
			   } else {
				   window.location = target.attr("href");
			   }
			   
			   event.stopImmediatePropagation();
			   return;
		   }		

		   selectable = row.find("input,a").first();
		   if (selectable.is(":radio") === true) {
			   self._clickRadio(event, selectable);
		   } else if (selectable.is(":checkbox")) {
			   self._clickCheckbox(event, selectable);
		   } else if (selectable.is("a")) {				
			   selectable.trigger("click");
		   }
	   },
	   
	   _documentKeyDown: function (event) {
		   if (event.shiftKey) {
			   this.disableSelection();
		   }
	   },
	   
	   _documentKeyUp: function (event) {
		   if (!event.shiftKey) {
			   this.enableSelection();
		   }
	   },

	   row: function (el) {
		   /// <summary>Selects the row the element is contained in.</summary>
		   return el.closest(this.options.rowSelector);
	   },
	   
	   isRowSelectable: function (el) {
		   /// <summary>Returns true if the element is a row (or is in a row) that does not have data-selectable set to false.</summary>
		   return this.row(el).attr("data-selectable") !== "false";
	   },
	   
	   disableSelection: function () {
		   /// <summary>Disables text selection on the list.</summary>
		   this.element.attr('unselectable', 'on')
			   .css({
				   '-moz-user-select': 'none',
				   '-webkit-user-select': 'none',
				   'user-select': 'none'
			   });
		   this.element[0].onselectstart = function () { return false; };
	   },

	   enableSelection: function () {
		   /// <summary>Enables text selection on the list.</summary>
		   this.element.attr('unselectable', null)
			   .css({
				   '-moz-user-select': 'text',
				   '-webkit-user-select': 'text',
				   'user-select': 'text'
			   });
		   this.element[0].onselectstart = null;
	   },

	   _clickRadio: function (event, radio) {
		   var list = this.element;

		   list.find("input").prop("checked", false);
		   list.find(".selected").removeClass("selected");
		   radio.prop("checked", true);
		   this.row(radio).addClass("selected");
		   this._fireChange();
	   },
	   
	   _clickCheckbox: function (event, checkbox) {
		   var list = this.element,
			   row = this.row(checkbox),
			   lastCheckbox;
		   // targetListItem is the row

		   if (!event.ctrlKey && !event.shiftKey) {

			   list.find("input").prop("checked", false);
			   list.find(".selected").removeClass("selected");
			   checkbox.prop("checked", true);
			   row.addClass("selected");
			   list.data("selectlist.lastcheckbox", checkbox);
			   this._fireChange();
			   
		   } else if (event.ctrlKey) {

			   this._selectSingle(checkbox, !checkbox.prop("checked"));

		   } else if (event.shiftKey) {

			   lastCheckbox = list.data("selectlist.lastcheckbox");
			   if (lastCheckbox) {
				   this._selectRange(row, this.row(lastCheckbox));
			   } else {
				   this._selectSingle(checkbox);
			   }
		   }
	   },
	   
	   _selectSingle: function (checkbox, checked) {
		   var row = this.row(checkbox),
			   list = this.element;
		   
		   checked = (checked === false) ? false : true;
		   
		   checkbox.prop("checked", checked);
		   this._fireChange();
		   
		   if (checked === true) {
			   row.addClass("selected");
		   } else {
			   row.removeClass("selected");
		   }
		   list.data("selectlist.lastcheckbox", checkbox);
	   },
	   
	   _selectRange: function (row1, row2, checked) {
		   var len, currRow, index1, index2;

		   index1 = row1.index();
		   index2 = row2.index();
		   checked = (checked === false) ? false : true;

		   if (index1 < index2) {
			   currRow = row1;
		   } else {
			   currRow = row2;
		   }

		   // determine the loop length
		   len = index1 - index2;
		   len = (len < 0) ? (len * -1) + 1 : len + 1;

		   while (len--) { //ignore jslint
			   currRow.find("input").prop("checked", checked);
			   if (checked) {
				   currRow.addClass("selected");
			   } else {
				   currRow.removeClass("selected");
			   }
			   currRow = currRow.next();
		   }
		   this._fireChange();
	   },

	   _fireChange: function () {
		   this._trigger("change");
	   },

	   destroy: function () {
		   this._checkall.unbind(".selectlist");
		   $.Widget.prototype.destroy.call(this);
	   }
   });
}(jQuery));
*/
var appui = context.module("appui").use("_", "$");


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