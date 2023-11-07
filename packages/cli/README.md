

When you use `ddk start`, it will start an Apollo server on port 4000 (default),
and it will watch the file system.
When you change a file, it will:

/generated directory - on a loop - does not apply the below to any
these files show a warning not to change as they will be overwritten.
if a user wants to override, they can move the file out of generated
* From @Handler Command decorators: Generate Command Handlers)
* From @TypeGQL Command decorators: Generate CommandControllers (mutation resolvers) based on the annotations in the command classes
* From @Authorize Command decorators: Translate command decorators into TypeGraphQL mutation resolver decorators

/customizable
* Generate an AggregateRoot: user types name of aggregate root, if it doesn't exist, they will prompted to created with "c", and it will be created and imported into the command. Also, a method will be created in the aggregate root that matches the command + params. Also it will create the apply with comments for the resulting event.  

* Create a method in the Aggregate that matches the command + params if it doesn't exist - prompt

* Parameter add/modify/remove on the commands always trigger an update to the matching method on the aggregate

* Modify the method in the Aggregate to match the command + params if it doesn't exist
* Restart the server



* From Query decorators: Generate stubs with comments – maybe AI does a first stab


`ddk eject`




