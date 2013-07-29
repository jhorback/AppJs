/// <reference path="../../qunit.js" />
/// <reference path="../../app/app.combined.js" />
/// <reference path="../../app/appui.combined.js" />

QUnit.module("browser.js");

window.debug = true;

var counter = 0,
    unique = function () {
    	return "test" + counter++;
    };


test("That console has all expected methods.", function () {
	expect(3);
	
	var testApp = app(unique()).use("appui");
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
	var testApp = app(unique()).use("appui");
	
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

