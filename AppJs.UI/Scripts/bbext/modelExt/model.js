/*
 * service: bbext.Model
 *     An extension of the Backbone.Model with all of the model extensions.
 * 
 * construct: model
 *     Allows for the creation of a bbext.Model which is injected.
 */
(function () {
	"use strict";
	
	var bbext = context.module("bbext");

	bbext.service("bbext.Model", [
		"Backbone", "bbext.backupModelExt", "bbext.getSetModelExt", "bbext.validationModelExt",
	function (Backbone, closeViewExt, renderViewExt) {

		var Model = Backbone.Model.extend({});
		backupModelExt.extend(Model.prototype);
		getSetModelExt.extend(Model.prototype);
		validationModelExt.extend(Model.prototype);

		return Model;
	}]);


	bbext.construct("model",
		["Backbone", "bbext.Model", "bbext.viewAndModelConstruct",
	function (Backbone, Model, viewAndModelConstruct) {

		return viewAndModelConstruct.create(Backbone.Model, Model);
		
	}]);

}());

