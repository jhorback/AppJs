/*
 *	Creates a standard facade for common application components.
 *
 *	Usage:
 *		var MyApp = new Application({
 *			root: "path/to/app",
 *			
 *			routes: {
 *				"": "main",				
 *				"*defaultRoute": "main"
 *			},
 *	
 *			regions: {
 *				"default": "#some-container",				
 *			},
 *	
 *			start: function () {
 *				// fetch data, set up app, etc...
 *			},
 *	
 *			main: function () {						
 *				return {
 *					view: view,
 *					navigate: "/"
 *				};
 *			}
 *		});
 *
 *	Shared event aggregation (all new Application objects will share the same 'events' channel):
 *	MyApp.events.on("object:event", fn);
 *	MyApp.events.trigger("object:event", arg1, arg2);
 *	MyApp.events.off("object:event", fn);
 *
 *	Application views and models that use all view and model extensions:
 * 	    var MyView = Application.View.extend({ ... });
 *	    var MyModel = Application.Model.extend({ ... });
 *
 *	Note:
 *      There is no need of stop method since regions and self management perform cleanup as needed.
 *
 */
var Application = function (options) {
	var App, app;

	App = Controller.extend(options);
	app = new App();
	app.events = Application.events;
	return app;
};


Application.events = { };
_.extend(Application.events, Backbone.Events);


Application.url = function (url) {
	/// <summary>Adds the base url to the url (including the '/'). Session.url() will go home.</summary>
	return (window.baseUrl || "") + (url || "");
};