/*
 * Description:
 *     Creates an AjaxRequest with deferred execution.
 *     Handlers can contain success and clientError properties thant handle generic success and 400 errors accordingly.
 *
 * Response handler:
 *     handler: {
 *         success: fn,
 *         clientError: fn,
 *         401: fn,
 *         405: fn
 *         // any status code...
 *     }
 */
(function ($) {

	var AjaxRequest = function (options, handler) {
		/// <summary>
		/// Creates an AjaxRequest with deferred execution.
		/// The handler can have success and clientError properties called as expected.
		/// </summary>
		if (this instanceof AjaxRequest === false) {
			return new AjaxRequest(options);
		}

		this.options = options;
		this.handler = $.extend({}, AjaxRequest.defaultHandler, handler || {});
		return this;
	};

	AjaxRequest.prototype = {
		handle: function (handler) {
			/// <summary>Extends the existing handler.</summary>
			$.extend(this.handler, handler);
		},

		execute: function (data, handler) {
			/// <summary>
			/// Executes the requests with the specified data and calls the callback for
			/// success or clientError in the handler.
			/// Other signatures: execute(handler) or execute().
			/// </summary>
			/// <returns type="Deferred">Returns a deferred (fail is called during a 400 result).</returns>
			var o = this.options,
				deferred,
				dfdHandler;

			if (arguments.length === 1) {
				handler = arguments[0];
				data = null;
			}

			handler = $.extend(this.handler, handler);
			if (data) {
				o.data = data;
			}
			deferred = $.ajax(o);
			return AjaxRequest.handle(deferred, dfdHandler);
		}
	};
	
	AjaxRequest.handle = function (deferred, handler, proxy) {
		/// <summary>A static version to handle deferreds.</summary>
		var dfdHandler;;
		handler = $.extend({ }, AjaxRequest.defaultHandler, handler);
		dfdHandler = getDeferredHandler(handler, proxy);
		deferred.then(dfdHandler.success);
		deferred.fail(dfdHandler.error);
		return deferred.promise();
	};

	var callHandlerCallbackFromError = function (callback) {
		/// <summary>Curry for an xhr response, callback(response, xhr) - the response is the JSON parsed response.</summary>
		return function (xhr) {
			var response;
			try {
				response = JSON.parse(xhr.responseText);
			} catch (e) {
				response = xhr && xhr.statusText;
			}
			callback.call(this, response, xhr);
		};
	};

	AjaxRequest.defaultHandler = {
		401: function (response) {
			alert("Unauthorized. " + response);
		},
				
		404: function (response) {
			alert("Resource not found. " + response);
		},
		
		success: function (response) {
			// noop
		},
				
		error: function (response) {
			alert("Internal server error. " + response);
		},

		extend: function (handler) {
			$.extend(AjaxRequest.defaultHandler, handler);
		}
	};
	
	var getDeferredHandler = function (responseHandler, proxy) {
		/// <summary>Translates success and error callbacks to a responseHandler.</summary>
		proxy = proxy || this;
		
		return {
			success: function (response, status, xhr) {
				(responseHandler[xhr.status] || responseHandler.success).apply(proxy, arguments);
			},
			error: function (xhr) {
				var status = parseInt(xhr.status);
				if (status === 400 && responseHandler.clientError) {
					responseHandler["400"] = responseHandler.clientError;
				}
				callHandlerCallbackFromError(responseHandler[xhr.status] || responseHandler.error).apply(proxy, arguments);
			}
		};
	};

	/* Default ajax handling */
	$.ajaxSetup({ dataType: "json" });

	window.AjaxRequest = AjaxRequest;
} (jQuery));