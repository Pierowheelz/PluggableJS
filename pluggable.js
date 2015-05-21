/*
 * The pluggable class is here to replace the poor implementation of event handling in IOS builds of cordova.
 * 	The basic syntax is: variable = plug.apply_filters( 'hook_name', variable, {'extra':'variables'} );
 * 		the above calls all of the functions linked to the hook and returns the parsed variable value resulting from the functions.
 *  To add a modifier/plugin simply call: plug.add_filter( 'hook_name', function_to_call, 10, 2 );
 * 		This will call the function 'function_to_call' when the apply_filters funciton with the same hook is called.
 * 
 * 	For more inforation on how this works see the wordpress implementation of hooks (this is essentially just a javascript port of that)
 * 
 * 	Author: Peter Wells - 2013
 */
function pluggable(){
	var self = this;
	self.filters = {};
	self.merged_filters = {};
	self.current_filter = [];
	self.logging = false;
	
	/* Just like Wordpress */
	/**
	 * calls all of the functions linked to the hook and returns the parsed variable value resulting from the functions.
	 * 
	 * @param string tag The name of the hook
	 * @param string|function function_to_add The function to call
	 * @param number priority Optional. The priority of the call (lower means function is called sooner)
	 * @param number accepted_args Optional. The number of arguments the function to call accepts
	 * @return bool success - error message in console on fail
	 */
	self.add_filter = function( tag, function_to_add, priority, accepted_args ){
		if( typeof priority == 'undefined' ){
			var priority = 10;
		}
		if( typeof accepted_args == 'undefined' ){
			var accepted_args = 1;
		}
		//console.log(typeof function_to_add);
		if( typeof function_to_add == 'string' || typeof function_to_add == 'function' ){
			if( self.logging ) console.log('ADDING FILTER `'+String(function_to_add).substring(0,40)+'` to hook `'+tag+'`');
			var idx = self.build_unique_id(tag, function_to_add, priority);
			if( typeof self.filters[tag] == 'undefined' )
				self.filters[tag] = {};
			if( typeof self.filters[tag][priority] == 'undefined' )
				self.filters[tag][priority] = {};
			self.filters[tag][priority][idx] = {'function': function_to_add, 'accepted_args': accepted_args};
			delete self.merged_filters[ tag ];
			return true;
		} else {
			if( self.logging ) console.warn('problem with filter on '+tag+', function (parameter 2) must be passed as a string!');
			return false;
		}
	};
	
	/**
	 * Add a modifier / plugin to a hook
	 * 
	 * @param string tag The name of the hook
	 * @param string|function value The original value to be parsed
	 * @param array|object extra Optional. 
	 * @return Output of the functions that were hooked into the filter tag - usually modified versions of the 'value' input
	 */
	self.apply_filters = function( tag, value, extra ){
		//global self.filters, self.merged_filters, self.current_filter;

		var args = [];
		if( typeof extra == 'array' ){
			args = args.concat(extra);
		} else if( typeof extra == 'object' ){
			args = extra;
		}
	
		// Do 'all' actions first
		if ( typeof self.filters['all'] != 'undefined' ) {
			self.current_filter.push(tag);
			self.call_all_hook(args);
		}
	
		if ( typeof self.filters[tag] == 'undefined' ) {
			if ( typeof self.filters['all'] != 'undefined' )
				self.current_filter.pop();
			return value;
		}
	
		if ( self.filters['all'] == 'undefined' )
			self.current_filter.push(tag);
	
		// Sort by priority
		if ( self.merged_filters[tag] == 'undefined' ) {
			self.ksort(self.filters[tag]);
			self.merged_filters[ tag ] = true;
		}
		//console.log(self.filters[ tag ]);
		$.each( self.filters[ tag ], function(i, val){
			$.each( val, function( j, the_ ){
				var temp_value = null;
				if ( typeof the_['function'] != 'undefined' ){
					if( self.logging ) console.log('CALLING FUNCTION `'+String(the_['function']).substring(0,40)+'` to hook `'+tag+'`');
					if( typeof the_['function'] == 'function' ){
						//console.log(the_['function']);
						temp_value = the_['function']( value, args ); //execute function
					} else {
						if( the_['function'] ){
							//console.log(the_['function']);
							if( /\./g.test(the_['function']) ){
								var splits = the_['function'].split(".");
								if( splits.length == 2 ){
									temp_value = window[ splits[0] ][ splits[1] ]( value, args ); //execute function
								} else {
									if( self.logging ) console.warn('WARNING: filter function `'+ the_['function'] +'` can only be at most 2 levels! ( eg: user.login NOT user.actions.login )');
								}
							} else {
								if( typeof window[ the_['function'] ] === "function" ){
									//var tmpFunc = new Function( the_['function'] ); //turn string into function
									temp_value = window[ the_['function'] ]( value, args ); //execute function
									//value = call_user_func_array(the_['function'], array_slice(args, 1, (int) the_['accepted_args']));
								} else {
									if( self.logging ) console.warn('WARNING: filter function `'+ the_['function'] +'` does not exist!');
								}
							}
						}
					}
				}
				if( temp_value != null ){
					value = temp_value;
				}
			} );
		});
		
		self.current_filter.pop();
	
		return value;
	};
	
	/*
	 * does nothing at the moment
	 */
	self.call_all_hook = function(args) {
		//global self.filters;
	
		/*self.filters['all'];
		$.each( self.filters['all'], function( i, the ){
			
		} );
		do {
			foreach( (array) current($wp_filter['all']) as $the_ )
				if ( !is_null($the_['function']) )
					call_user_func_array($the_['function'], $args);
	
		} while ( next($wp_filter['all']) !== false );*/ //FIXLATER
	};
	
	/*
	 * builds a unique id
	 */
	self.build_unique_id = function( tag, function_to_add, priority ){
		/*if( typeof function_to_add == 'object' ){
			return function_to_add.objectId;
		} else if( typeof function_to_add == 'string' ) {
			return self.hash_string( function_to_add );
		}*/
		var randLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
		return uniqid = randLetter + Date.now();
	};
	
	/*
	 * hashes a string
	 */
	self.hash_string = function( string ){
		var hash = 0, i, chr, len;
		if (string.length == 0) return hash;
		for (i = 0, len = string.length; i < len; i++) {
			chr   = string.charCodeAt(i);
			hash  = ((hash << 5) - hash) + chr;
			hash |= 0; // Convert to 32bit integer
		}
  		return hash;
	};
	
	/*
	 * sorts an array numerically from lowest to highest
	 */
	self.ksort = function(w){
		var sArr = [];
		var tArr = [];
		var n = 0;
		for (i in w){
			tArr[n++] = i;
		}
		//tri du plus petit au plus grand
		tArr = tArr.sort();
		n = tArr.length;
		for (var i=0; i<n; i++) {
			sArr[tArr[i]] = w[tArr[i]];
		}
		return sArr;
	};
}

/*
 * self initialising class
 */
window.plug = new pluggable(); //start up the pluggable class