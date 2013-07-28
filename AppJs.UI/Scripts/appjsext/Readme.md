
# appjs Module

## Objects

### window
A reference to the browser's window object.
While window is globally available in JavaScript, it causes testability problems, because it is a global variable.



## Services


### console
A reference to a console object that can be used to log to messages to the browser console.

#### log
`console.log(args);`

Logs information to the console.

#### warn
`console.warn(args);`

Logs a warning to the console.

#### error
`console.error(args);`

Logs an error to the console.


### globalCache
A nice wrapper to the `globals` object exposed by app.js.
All variables are stored in a globalCache variable on globals for added safety.
`globals.globalCache[name]`.

#### get
`globalCache.get(name);`
Gets a global variable from the global cache.

#### set
`globalCache.set(name, value);`
Sets a global variable in the global cache.

