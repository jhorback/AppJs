/// <reference path="../../qunit.js" />
/// <reference path="../../jquery-2.0.3.js" />
/// <reference path="../../underscore.js" />
/// <reference path="../../app/app.combined.js" />
/// <reference path="../moduleRegistrar.js" />
/// <reference path="../../app/appui.combined.js" />


QUnit.module("browser.js", {
	setup: function () {
		context.module("jQuery").register("$", jQuery);
		context.module("Underscore").register("_", _);
	}
});

window.debug = true;


var counter = 0,
    unique = function () {
    	return "test" + counter++;
    };


test("That console has all expected methods.", function () {
	expect(3);
	
	var testApp = context.app(unique()).use("appui");
	testApp.start(function (console) {
		ok(console.log instanceof Function);
		ok(console.warn instanceof Function);
		ok(console.error instanceof Function);
	});
	testApp.start();
});


test("A call to console.log logs a message.", function () {
	
	var expectedMsg = "Testing console.log";
	var loggedMsg = null;
	var testApp = context.app(unique()).use("appui");
	
	testApp.register("window", function () {
		return {
			console: {
				log: function (msg) {
					loggedMsg = msg;
				}
			}
		};
	});
	
	testApp.start(function (console) {
		console.log(expectedMsg);
	});
	testApp.start();
	
	equal(loggedMsg, expectedMsg);
});

