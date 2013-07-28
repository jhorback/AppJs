
# bbext module
The bbext module exposes Backbone and a series of Backbone extensions that help reduce boilerplate code.

## Objects

### jQuery
jQuery is registered with the $ symbol.

### Underscore
Underscore is registered with the _ symbol.

## Services

### events
Exposes a global Backbone event object shared between applications.
See Backbone documentation for methods.
```js
myApp.start(function (events) {
	events.on("user:update", function () {
		// handle application event.
	});
});
```

### keepAlive
The keepAlive can be used to continually request a noop
function on an interval to keep a web session alive.

#### start
`start(url, timeout)`

* url - Required url to request.
* timeout - The interval between requests. The default is 10 minutes.

#### stop
`stop()`
Stops the requests.


### sessionTimeout
Like keepAlive, sessionTimeout provides a strategy for dealing with a web session.
This will call logout after a certain amount of user inactivity.
The logoutUrl is requested via an ajax get and the screen is realoded so the browser can redirect
to the appropriate screen.

#### start
`start(logoutUrl, keepAliveUrl, timeout)`

* logoutUrl - The url to request to logout.
* keepAliveUrl - A url to call to keep the session alive.
* timeout - The session timeout in milliseconds.

#### stop
`extend()`
Extends the session by the timeout value set in the start method.




### modelFactory
Use to create instances of models.

#### create
`create(modelName, options);`
```js
app.model("someModel", function () {}, { /*...*/ });
app.view("someView", function () {}, { /*...*/ });
app.start(function (modelFactory, viewFactory) {
	var someModel = modelFactory.create("someModel", { /*...*/ });
	var someView = viewFactory.create("someView", {
		model: someModel
	});
});
```

### viewFactory
Use to create instances of Backbone views.

#### create
`create(viewName, options);`


### collectionFactory
Use to create instances of Backbone collections.

#### create
`create(collectionName, options);`


### model
This is an empty Backbone model to facilitate creating simple models.
```js
myApp.start(function (modelFactory) {
	var simpleModel = modelFactory.create("model", {
		name: "Joe",
		age: 4,
		hairColor: "purple"
	});
});
```


## Constructs

### view Construct
The view construct allows the creation of Backbone views with a series of Backbone view extensions.
See the Backbone documentation on Backbone views. This documentation is focused on the added extensions.

```js
someApp.view("viewName", function () {
	// injected constructor
}, {
	events: {
		//...
	}
	// ...
});
```

#### template
<code>this.template(template, el);</code>

Returns the compiled template function and caches it.
The <code>template</code> argument is the id of the script block containing the template.
The <code>el</code> argument is an optional which will add the result of the template to the dom node
when the template function is invoked.
</p>

```js
render: function () {
	this.template("TemplateName", this.el)(this.model);
	// same as
	this.el.html(this.template("TemplateName")(this.model));
}
```

#### renderTemplate
<code>this.renderTemplate(teplate);</code>

Same as the template method but passes <code>this.el</code> to it.

```js
render: function () {
	this.renderTemplate("TemplateName")(this.model);
}
```

#### bindModelToView
<code>bindModelToView(model, view);</code>

Creeates a ModelBinder (see the ModelBinder module) using the specified model and view.
If the model is not specified, <code>this.model</code> or <code>this.collection</code>
will be used.
If the view is not specified, <code>this.el</code> will be used.

#### bindTemplate
<code>bindTemplate(template, el, model);</code>

Uses the model and view to render the template then creates a ModelBinder using
<code>bindModelToView</code>.
If the view is not passed <code>this.el</code> will be used.
If the model is not passed <code>this.model</code> will be used.

#### isModelValid (displayErrors)
<code>isModelValid(model);</code>

Returns true if the model is valid, otherwise updates the view with the errors 
using the FormErrorHandler module.
If the model is not passed <code>this.model</code> will be used.

#### close
<code>close();</code>

Calls the <code>onClose</code> method if exists.
Calls <code>undelegateEvents()</code>, <code>off()</code>, and <code>stopListening()</code>.

This is an option other than remove that does not
remove the view el and calls an optional 'onClose' method when called.

#### onClose
<code>onClose();</code>

Define this method to perform any neccessary cleanup with the views <code>close</code> method is called.

#### regions
<code>view.regions</code>

Uses the Regions object the same way an Application does to allow defining of regionso on a view.

```js
var SomeView = Application.View.extend({
	regions: {
		"main": "#main"
	}
});
var sv = new SomeView();
// inside a method on SomeView (such as render):
this.regions.main.show(someChildView);
```


### model Construct
The model construct allows the creation of Backbone models with a series of Backbone model extensions.
See the Backbone documentation on Backbone models. This documentation is focused on the added extensions.

The get, set, bind, and validate methods can be defined for each model property.

```js
someApp.model("modelName", function () {
	// injected constructor
}, {
	defaults: {
		firstName: null,
		lastName: null,
		fullName: null
	},
	fullName: {
		get: function (currentValue) {
			return this.get("firstName") + " " + this.get("lastName");
		},
		set: function (value) {
			var parts = value.split(" ");
			this.set("firstName", parts[0]);
			this.set("lastName", parts[1]);
		},
		bind: ["firstName", "lastName"],
		validate: { required: true }
	}  
});
```

#### property:get
Define this function to provide a getter for the property. The function is passed the current property value.

#### property:set
Define this function to provide a setter for the property. This function is passed the value to set.

#### property:bind
Define the bind property as a string (or array) of property names the property is dependent on.
This will trigger a change on the property if any of the 'bind' properties change

#### property:validate
Set the validate property to an object describing any number of validators (from the validation module).

```js
someField: {
	validate: {
 	    required: true,
 	    min: 0,
 	    max: 10,
 	    email: true,
 	    custom: function (value) {
 	   	    if (value === 1) {
 	   		    return "Value cannot be 1.";
 	   	    }
 	    }
    }
}
```

#### refresh
<code>someModel.refresh();</code>

Forces a change on the calculated values.		

#### getErrors
Retuns an object containing errors by property (or null if there are no errors).

```js
var errors = sm.getErrors();
if (errors) {
     // handle the errors
}
// errors =>
{
	"propertyName": ["error messages"]
}
```

#### store
<code>sm.store();</code>

Saves the current model state which can be restored using the <code>restore</code> method.

#### restore
<code>sm.restore();</code>

Restores the model property values back to the last time <code>store</code> was called.


### collection Construct
The collection construct allows the creation of a Backbone collection.
The _model_ property of the collection should be the name of the model to retrieve.
```js
myApp.collection("someModelCollection", function () {
	// injected constructor
}, {
	model: "someModel",
	// rest of prototype...
});
```
_Since Backbone will create the model, the model will not be injected._
If this is ever needed, the *_prepareModel* method can be overridden in this construct.



### appEvents Construct
The appEvents construct creates a structure for dealing with global application events.

```js
myApp.appEvents("myAppEvents", function () {
	// injected constructor
}, {
	events: {
		"update:user": "updateUser",
		"delete:user": function () {
			// delete a user
		}
	},
	updateUser: function () {
		// handle event.
	}
});

myApp.start(function (myAppEvents) {
	myAppEvents.listen();
});
```

#### listen
`listen()`

Binds the events object on the prototype to their corresponding methods.

#### stopListening
`stopListening()`

Unbinds the events bound with listen.