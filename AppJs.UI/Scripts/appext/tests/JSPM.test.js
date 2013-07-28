/// <reference path="../../qunit.js" />
/// <reference path="../../../../harbor.ui/scripts/underscore.js" />
/// <reference path="../../../../harbor.ui/scripts/jquery-1.9.1.min.js" />
/// <reference path="../../../../harbor.ui/scripts/app/appjs/JSPM.js" />


module("JSMP.js");

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