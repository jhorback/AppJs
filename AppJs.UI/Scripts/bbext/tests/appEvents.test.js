/// <reference path="../qunit.js" />
/// <reference path="../../../Harbor.UI/Scripts/underscore.js" />
/// <reference path="../../../Harbor.UI/Scripts/backbone.js" />
/// <reference path="../../../Harbor.UI/Scripts/app/context.js" />
/// <reference path="../../../Harbor.UI/Scripts/app/app.js" />
/// <reference path="../../../Harbor.UI/Scripts/app/appjs/globalCache.js" />
/// <reference path="../../../Harbor.UI/Scripts/bbext/bbext.js" />
/// <reference path="../../../Harbor.UI/Scripts/bbext/app/appEvents.js" />


module("appEvents.js");

window.debug = true;

test("Triggering an event calls the callback.", function () {

	var testApp = app("testApp");
	
	testApp.use("bbext");

	testApp.appEvents("appEvents", function () {
		
	}, {
		events: {
			"foo": "bar"
		},
		bar: function () {
			ok(true, "The event handler was called");
		}
	});

	testApp.start(function (appEvents, events) {
		appEvents.listen();
		events.trigger("foo");
		appEvents.stopListening();
	});
	
	testApp.start();
});

test("After a stopListening call, events are no longer triggered.", function () {
	expect(2);
	
	var testApp = app("testApp2");
	
	testApp.use("bbext");

	testApp.appEvents("appEvents", function () {
		
	}, {
		events: {
			"foo": "bar"
		},
		bar: function () {
			ok(true, "The event handler was called");
		}
	});

	testApp.start(function (appEvents, events) {
		appEvents.listen();
		events.trigger("foo");
		appEvents.listen();
		events.trigger("foo");
		appEvents.stopListening();
		events.trigger("foo");		
	});
	
	testApp.start();
});