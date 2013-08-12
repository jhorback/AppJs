/*
 * viewAndModelConstruct
 * 
 * Description:
 *    Used by the view and model constructs. Similar to the factories,
 *    this code has been extracted to keep things dry.

 */
context.module("bbext").service("bbext.viewAndModelConstruct", function () {

	return {
		create: function (BackboneViewOrModel, bbextViewOrModel) {
			return function (construct, name) {
				var protoProps = construct.prototype;

				protoProps.name = name;

				protoProps.constructor = construct;
				if (protoProps.constructor) {
					protoProps._ctor = protoProps.constructor;
				}

				protoProps.constructor = function () {
					var context = arguments[arguments.length - 1];

					if (this.$inject && this.$inject[0] !== "options") {
						console.warn("First argument is not options of : " + name);
					}

					// inject the constructor
					if (this._ctor) {
						context.call(this._ctor, arguments, this);
					}

					BackboneViewOrModel.apply(this, arguments);
					return this;
				};

				return bbextViewOrModel.extend(protoProps, construct);
			};
		}
	};
});
