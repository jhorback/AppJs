/* 
 *
 */
var Region = function (el) {
	/// <summary>el can be a dom selector or node.</summary>
	this.el = el;
	this.view = null;
};


Region.prototype = {
	getEl: function () {
		if (this.$el && this.$el.length > 0) {
			return this.$el;
		}

		this.$el = $(this.el);
		if (this.$el.length === 0) {
			this.$el = null;
			console.warn("Region not found: " + this.el);
		}
		return this.$el;
	},

	render: function (view) {
		/// <summary>Calls render on the view then calls show.</summary>
		view.render();
		this.show(view);
	},

	show: function (view) {
		/// <summary>Calls open on the view, ensures the region el and sets the html to the view.el.</summary>
		this.open(view);
		this.getEl().html(view.el);
	},
	
	showEl: function () {
		this.getEl().show();
	},
	
	hideEl: function () {
		this.getEl().hide();
	},

	open: function (view) {
		/// <summary>Closes any open view and sets the view property.</summary>
		this.close();
		this.view = view;
	},

	close: function () {
		/// <summary>Attempts to dispose the view and sets it to null.</summary>
		var view = this.view;

		if (!view) {
			return;
		}

		if (view.dispose) {
			view.dispose();
		} else {
			view.trigger && view.trigger("dispose");
			view.unbind && view.unbind();
			view.stopListening && view.stopListening();
			view.destroy && view.destroy();
			view.onClose && view.onClose();
			//view.remove && view.remove();
			//this.getEl().remove();
		}
		
		delete this.view;
	},

	destroy: function () {
		/// <summary>Alias for close.</summary>
		this.close();
	}
};

/*
	For each of the regions in the region property, they will be replaced with instances of regions.
	The region value can be a selector or a function which returns a selector.
*/
Region.createRegions = function (instance) {
	/// <summary>Creates regions for all selectors defined in a regions property on the instance.</summary>
	_.each(instance.regions, function (selector, name) {
		selector = _.isFunction(selector) ? selector() : selector;
		instance.regions[name] = new Region(selector);
	});
};