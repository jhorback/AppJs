/*
 *  factory for Backbone objects: view, model, collection.
 *      get(name, options)
 *          - creates a new instance.
 *          - options being the Backbone options.
 *          - all other arguments required by the view will be injected.                       
 */
(function () {
	var bbext = context.module("bbext"),
		bbFactory = ["context", function (context) {
			return {
				create: function (name, options) {

					return context.instantiate(name, [options]);
				}
			};
		}];

	bbext.service("viewFactory", Array.prototype.slice.call(bbFactory, 0));
	bbext.service("modelFactory", Array.prototype.slice.call(bbFactory, 0));
	bbext.service("collectionFactory", Array.prototype.slice.call(bbFactory, 0));
}());
