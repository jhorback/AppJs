/// <reference path="../qunit.js" />
/// <reference path="../../jQuery-2.0.3.min.js" />
/// <reference path="../../underscore.js" />
/// <reference path="../../backbone.js" />
/// <reference path="../../app/app.combined.js" />
/// <reference path="../../app/appui.combined.js" />
/// <reference path="../../app/bbext.combined.js" />

QUnit.module("appEvents.js");

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