/// <reference path="../../qunit.js" />
/// <reference path="../../../../Harbor.UI/Scripts/app/context.js" />
/// <reference path="../../../../Harbor.UI/Scripts/app/app.js" />
/// <reference path="../../../../Harbor.UI/Scripts/app/appjs/browser.js" />


module("browser.js");

window.debug = true;

var counter = 0,
    unique = function () {
    	return "test" + counter++;
    };


test("That console has all expected methods.", function () {
	expect(3);
	
	var testApp = app(unique()).use("appjs");
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
	var testApp = app(unique()).use("appjs");
	
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

