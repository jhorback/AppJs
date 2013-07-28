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