/*
 * appEvents.js
 *
 * Description:
 *     Creates a structure for dealing with application events.
 */
appjs.module("bbext").construct("appEvents", ["events", function (events) {

	return function (construct) {

		_.extend(construct.prototype, {
			
			listen: function () {
				var eventName, method;

				this.stopListening(); // unbind any currently bound events.
				
				for (eventName in this.events) {
					method = events[eventName];
					if (typeof method !== 'function') {
						method = this[this.events[eventName]];
					}
					if (!method) {
						continue;
					}

					events.on(eventName, method, this);
				}
			},
			
			stopListening: function () {
				events.off(null, null, this);
			}
			 			
		});
		 
		return construct;
	};
}]);

var bbext = appjs.module("bbext").use("appjsext");


bbext.service("events", ["globalCache", function (globalCache) {

	var events = globalCache.get("bbextEvents");
	if (!events) {
		events = _.extend({}, Backbone.Events);
		globalCache.set("bbextEvents", events);
	}
	return events;

}]);