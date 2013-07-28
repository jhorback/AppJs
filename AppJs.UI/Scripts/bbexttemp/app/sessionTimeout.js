/*
 * sessionTimeout.js
 *
 * sessionTimeout
 *      start(logoutUrl, timeout);
 *      extend();
 */
 appjs.module("bbext").service("sessionTimeout", ["keepAlive", function (keepAlive) {

	var timeoutId = null;
	
	return {
		start: function (logoutUrl, keepAliveUrl, timeout) {
			
			this.logoutUrl = logoutUrl || this.logoutUrl;
			this.timeout = Math.max(timeout || this.timeout || (20 * 60 * 1000), 60000);

			keepAlive.stop();
			keepAlive.start(keepAliveUrl, this.timeout / 2);
			queueRequest(this.logoutUrl, this.timeout);
		},
		
		extend: function () {
			clearTimeout(timeoutId);
			this.start();
		}
	};

	function queueRequest(logoutUrl, timeout) {
		timeoutId = setTimeout(function () {
			$.get(logoutUrl).always(function () {
				location.reload(true);
			});
		}, timeout);
	}
}]);