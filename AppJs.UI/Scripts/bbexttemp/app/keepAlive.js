/*
 * keepAlive.js
 * 
 * keepAlive
 *     start(url, timeout);
 *     stop();
 */
module("bbext").service("keepAlive", ["$", function ($) {

	var timeoutId = null;
	
	return {
		start: function (url, timeout) {
			
			timeout = timeout || (10 * 60 * 1000);
			queueRequest();
			
			function queueRequest() {
				timeoutId = setTimeout(function () {
					$.get(url);
					queueRequest();
				}, timeout);
			}
		},
		
		stop: function () {
			clearTimeout(timeoutId);
		}
	};
}]);