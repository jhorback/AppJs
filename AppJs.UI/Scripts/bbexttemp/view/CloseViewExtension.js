/*globals */
/*
*/
(function (_) {

	var extension;

	extension = {
		close: function () {
			/// <summary>An option other than remove that does not
			/// remove the view el and calls an optional 'onClose'
			/// method when called.
			/// </summary>
			this.onClose && this.onClose();
			this.undelegateEvents();
			this.off();
			this.stopListening();
			return this;
		}
	};

	window.CloseViewExtension = {
		extend: function (proto) {
			_.extend(proto, extension);
		}
	};

} (_));