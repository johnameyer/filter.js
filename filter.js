//https://stackoverflow.com/questions/8532960/how-do-you-run-javascript-script-through-the-terminal
//var f = new Function("return true")
{
	const reduce = Function.bind.call(Function.call, Array.prototype.reduce);
	const isEnumerable = Function.bind.call(Function.call, Object.prototype.propertyIsEnumerable);
	const concat = Function.bind.call(Function.call, Array.prototype.concat);
	const keys = Reflect.ownKeys;

	if (!Object.values) {
		Object.values = function values(O) {
			return reduce(keys(O), (v, k) => concat(v, typeof k === 'string' && isEnumerable(O, k) ? [O[k]] : []), []);
		};
	}
}
(function(exports){
	exports.defaults = {
		"plaintext": false,
		"compileAliases": false,
		"strictKeys": false,
		"projection": {},
		"unions": {
			"and":	function(x,y){return x && y},
			"nand":	function(x,y){return !(x && y)},
			"or":	function(x,y){return x || y},
			"nor":	function(x,y){return !(x || y)},
			"xor":	function(x,y){return !x != !y},
			"xnor":	function(x,y){return !x == !y},
			"|":	function(x,y){return x || y},
			"||":	function(x,y){return x || y},
			"&":	function(x,y){return x && y},
			"&&":	function(x,y){return x && y}
		},
		"compares": {
			"like":function(val,ref){return val.match(toRegex(ref)) != null},
			"equals":function(val,ref){return val==ref},
			"=":function(val,ref){return val == ref},
			"==":function(val,ref){return val == ref},
			"~":function(val,ref){return val.match(toRegex(ref)) != null},
			"":function(val,ref){return val.match(toRegex(ref)) != null},
			"after":function(val,ref){return new Date(val.replace(/(\d{2})(?:\/)(\d{4})/,"$2-$1")) > new Date(ref.replace(/(\d{2})(?:\/)(\d{4})/,"$2-$1"))},
			"before":function(val,ref){return new Date(val.replace(/(\d{2})(?:\/)(\d{4})/,"$2-$1")) < new Date(ref.replace(/(\d{2})(?:\/)(\d{4})/,"$2-$1"))},
			">":function(val,ref){return Number.parseFloat(val) > Number.parseFloat(ref)},
			"<":function(val,ref){return Number.parseFloat(val) < Number.parseFloat(ref)}
		},
		"keys": [],
		"aliases": {}
	};
	var set = JSON.parse(JSON.stringify(exports.defaults));//TODO bad practice?
	exports.set = function(input){
		try{
			function ifElse(name){return (input[name]==undefined?set[name]:input[name])};
			if(!input) input = new Object();
			if(input.errorCallback && typeof (input.errorCallback) != "function") throw new exports.SettingException("Not a function");
			if(Object.keys(ifElse("aliases")).length==0&&ifElse("compileAliases")) throw new exports.SettingException("No aliases");
			if(ifElse("keys").length==0&&ifElse("strictKeys")) throw new exports.SettingException("No keys");
			if(ifElse("strictKeys") && ifElse("aliases")){
				var arr = Object.values(ifElse("aliases"));//TODO messy?
				for(index in arr){
					if(ifElse("keys").indexOf(arr[index]) < 0) throw new exports.SettingException("Alias maps to invalid key");//TODO consider nature of ifelses - especially with objects/arrays
				}
			}
			set = Object.assign(set,input);
			set.unions = Object.assign(exports.defaults.unions,input.unions);
			set.compares = Object.assign(exports.defaults.compares,input.compares);
			//TODO should unions and compares be cumulative?
		}catch(e){
			if(set.errorCallback){
				set.errorCallback(e);
				return set;
			}else throw e;
		}
	}
	
	//support for non traditional names? Enumerate object types?
	
	exports.compile = function(query) {
		try{
			query = query.replace(/(\s)\s+/g, "$1").replace("%",".*?").trim();
			//^[a-zA-Z0-9 \"\(\)\-]*$ -- valid chars
			var s,t;
			if((typeof(t = query.match(/\(/gi)) != typeof(s = query.match(/\)/gi))) || (s instanceof Array && s.length!=t.length)) throw "Parentheses opened but not closed";
			if((s = query.match(/\"/gi)) && s.length%2 == 1) throw "Quotes opened but not closed";
		    query = query.replace(/(\s)\s+/g, "$1").replace("%",".*?").trim(); //clean spaces and replace wildcard character
		    return compile_union(query);
		}catch(e){
			if(set.errorCallback){
				set.errorCallback(e);
				return null;
			} else throw e;
		}
	}
	
	function compile_union(query) {
        var split = query.replace(/^\s?\(\s?(.*?)\s?\)\s?$/i,"$1").split(/\s(n?and|x?n?or|&+|\|+)(?=[^\(\)]*(?:[^\(\)]*\([^\(\)]*\))*$)\s/gi); //check quotes & trim whitespace ~ (?:(\s)\s) replace $1
        if (split.length == 0) {
            throw "Empty query";
        } else if (split.length == 1) {
            return compile_comparison(split[0]);
        } else if (split.length % 2 == 0) {
            throw "Missing statement between connectors";
        } else {
            var arr = [true, compile_union(split[0])]; //union vs comparison with remove parentheses
            for (var i = 1; i < split.length; i += 2) {
                arr.push(split[i]);
                arr.push(compile_union(split[i + 1]));
            }
            return arr;
        }
    }

    function compile_comparison(query) {
        var split = query.split(/\s(?=(?:(?:[^\"]*\"){2})*(?![^\"]*\"))/gi);
        if(split.length >= 2){
        	if(set.strictKeys && !(set.keys.indexOf(split[0])>=0 || Object.keys(set.aliases).indexOf(split[0]) >=0))
        		if(!set.plaintext)//TODO consider plaintext?
        			throw new exports.InvalidQuery("Invalid key");
        		else
        			return compile_union(split.join(" and "));
        }
        if (split.length == 0) {
            throw "Empty query";
        } else if (split.length == 1) {
            //plain text search
            if(!set.plaintext) throw new exports.InvalidQuery("Plaintext not enabled");
            return [false, strip_q(split[0])]; //first index indicates whether this contains arrays
        } else if (split.length == 2) {
        	if(set.compileAliases && Object.keys(set.aliases).indexOf(split[0]) >= 0){
        		return [false, set.aliases[split[0]], [false,set.compileFunctions?set.compares[""]:""], strip_q(split[1])];
    		}
        	if(set.keys.indexOf(split[0]) >= 0){
        		return [false, split[0], [false,set.compileFunctions?set.compares[""]:""], strip_q(split[1])];
        	}
        } else if (split.length == 3) {
        	if(set.compileAliases && Object.keys(set.aliases).indexOf(split[0]) >= 0){
        		split[0] = set.aliases[split[0]];
        	}

        	var x;
        	if(Object.keys(set.compares).indexOf(split[1]) >= 0){
        		//TODO should factor in keys check / compilealiases here?
        		if(set.compileFunctions) split[1] = set.compares[split[1]];
                return [false, split[0], [false,split[1]], strip_q(split[2])];
        	} else if((x = split[1].match("^(?:not|!)(.+)$")) && Object.keys(set.compares).indexOf(x[1])>=0){//TODO fix
        		if(set.compileFunctions) x[1] = set.compares[x[1]];
                return [false, split[0], [true, x[1]], strip_q(split[2])];
        	}
        }
        if(!set.plaintext) throw new exports.InvalidQuery("Plaintext not enabled");
        return compile_union(split.join(" and "));
    }
    
    function strip_q(q){
    	return q.replace(/\s?\"\s?/g,"");
    }
	
	exports.filter = function(compQuery, data) {
		try{
		    if (compQuery[0]) { //first index indicates whether this contains arrays
		        return union(compQuery, data, Object.values(data).toString());
		    } else {
		        return comparison(compQuery, data, Object.values(data).toString());
		    }
		    //invalid query handling?
	    }catch(e){
			if(set.errorCallback){
				set.errorCallback(e);
				return true;
			}else throw e;
		}
	}
	
	function union(compQuery, data, str_rep) {
        //assert comQuery[0] == true
        var last = (compQuery[1][0] ? union : comparison)(compQuery[1], data, str_rep); //union vs comparison with remove parentheses
        for (var i = 2; i < compQuery.length; i += 2) {
            last = set.unions[compQuery[i].toLowerCase()](last, (compQuery[i + 1][0] ? union : comparison)(compQuery[i + 1], data, str_rep)); // handle undefined function
        }
        return last;
    }

    function comparison(compQuery, data, str_rep) {
        //assert compQuery[0] == false
        if (compQuery.length == 2) {
            return str_rep.match(toRegex(compQuery[1])) != null;
        } else if (compQuery.length == 4) {
        	if(data[compQuery[1]] == undefined){
        		throw "Unknown alias " + compQuery[1];
        	}
            return compQuery[2][0] ^ set.compares[compQuery[2][1]](data[compQuery[1]].toLowerCase(), compQuery[3]);
        }
        throw "Invalid Query"; //TODO implement actual exceptions
    }
	
	function toRegex(str) {
	    if (str instanceof RegExp) {
	        return str;
	    } else if (str[0] == "/") {
	        //TODO return new RegExp()
	    } else {
	        return new RegExp(str, "gi");
	    }
	}
	exports.InvalidQuery = function(message) {
    	this.message = message;
  	}
  	exports.InvalidQuery.prototype.toString = function(){
    	return this.message;
  	};
  	exports.SettingException = function(message) {
    	this.message = message;
  	}
  	exports.SettingException.prototype.toString = function(){
    	return this.message;
  	};
})(("undefined" != typeof window?window:global)[("undefined" != typeof document?document.currentScript.getAttribute("data-binding"):null)||"filter"] = new Object());
/*filter.init({
	keys: ["firstname", "lastname", "registrationnumber", "emailaddress",
		"status", "major", "school", "desiredemploymenttype", "schoolyear",
		"gpa", "graduationdate", "emailsent", "updateddate", "phone"],
	aliases: {
			"fname": "firstname",
			"lname": "lastname",
			"first": "firstname",
			"last": "lastname",
			"email": "emailaddress",
			"updated": "updated",
			"desiredemployment": "desiredemploymenttype",
			"graduation": "graduationdate",
			"graddate": "graduationdate",
			"phonenumber": "phone"
	},
	strict: false,
	plaintext: true
});*/