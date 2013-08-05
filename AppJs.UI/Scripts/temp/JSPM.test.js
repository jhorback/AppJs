/// <reference path="../../qunit.js" />
/// <reference path="../../jquery-2.0.3.js" />
/// <reference path="../../underscore.js" />
/// <reference path="../../app/app.combined.js" />
/// <reference path="../moduleRegistrar.js" />
/// <reference path="../../app/appui.combined.js" />


QUnit.module("JSMP.js");

window.debug = true;

test("Installing a package returns a deferred which is executed.", function () {
	QUnit.expect(0);

	JSPM.install("Foo").then(function () {
		QUnit.ok(true, "Then callback ws called.");
	});
});


test("Installing a package executes the callback argument with proxy.", function () {
	expect(0);
	
	this.foo = true;
	
	JSPM.install("Foo", function () {
		ok(this.foo === true, "Then callback was called with the correct proxy.");		
	}, this);
});



test("Installing a package executes the callback argument with no proxy.", function () {
	expect(0);
	
	this.foo = true;
	
	JSPM.install("Foo", function () {
		ok(this.foo !== true, "Then callback was called with the correct proxy.");
		ok(this === JSPM, "'this' is JSPM.");
	});
});