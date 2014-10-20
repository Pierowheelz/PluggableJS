PluggableJS
===========

A plugins system for javascript, based on the Wordpress action &amp; filter system


The basic syntax is: 

```
variable = plug.apply_filters( 'hook_name', variable, {'extra':'variables'} );
```

The above calls all of the functions linked to the hook and returns the parsed variable value resulting from the functions.


To add a modifier/plugin simply call: 

```
plug.add_filter( 'hook_name', function_to_call, 10, 2 );
```

This will call the function 'function_to_call' when the apply_filters funciton with the same hook is called.

For more inforation on how this works see the wordpress implementation of hooks (this is essentially just a javascript port of that)