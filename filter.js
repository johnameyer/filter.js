(function(exports){
	var unions = {
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
	}
	var unionsRegex = /(n?and|x?n?or|&+|\|+)/gi;
	var compares = {
			"like":function(val,ref){return val.match(toRegex(ref)) != null},
			"not like":function(val,ref){return val.match(toRegex(ref)) == null},
			"equals":function(val,ref){return val==ref},
			"not equals":function(val,ref){return val!=ref},
			"=":function(val,ref){return val == ref},
			"==":function(val,ref){return val == ref},
			"!=":function(val,ref){return val != ref},
			"~":function(val,ref){return val.match(toRegex(ref)) != null},
			"!~":function(val,ref){return val.match(toRegex(ref)) == null},
			"":function(val,ref){return val.match(toRegex(ref)) != null},
			"after":function(val,ref){return new Date(val.replace(/(\d{2})(?:\/)(\d{4})/,"$2-$1")) > new Date(ref.replace(/(\d{2})(?:\/)(\d{4})/,"$2-$1"))},
			"before":function(val,ref){return new Date(val.replace(/(\d{2})(?:\/)(\d{4})/,"$2-$1")) < new Date(ref.replace(/(\d{2})(?:\/)(\d{4})/,"$2-$1"))},
			">":function(val,ref){return Number.parseFloat(val) > Number.parseFloat(ref)},
			"<":function(val,ref){return Number.parseFloat(val) < Number.parseFloat(ref)}
	}
	
	exports.keys = ["firstname", "lastname", "registrationnumber", "emailaddress",
		"status", "major", "school", "desiredemploymenttype", "schoolyear",
		"gpa", "graduationdate", "emailsent", "updateddate", "phone"];
	
	var aliases = {
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
	}
	
	//support for non traditional names? Enumerate object types?
	
	exports.compile = function(query) {
		query = query.replace(/(\s)\s+/g, "$1").replace("%",".*?").trim();
		//^[a-zA-Z0-9 \"\(\)\-]*$ -- valid chars
		var s,t;
		if((typeof(t = query.match(/\(/gi)) != typeof(s = query.match(/\)/gi))) || (s instanceof Array && s.length!=t.length)) throw "Parentheses opened but not closed";
		if((s = query.match(/\"/gi)) && s.length%2 == 1) throw "Quotes opened but not closed";
	    query = query.replace(/(\s)\s+/g, "$1").replace("%",".*?").trim(); //clean spaces and replace wildcard character
	    return compile_union(query);
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
        if (split.length == 0) {
            throw "Empty query";
        } else if (split.length == 1) {
            //plain text search
            return [false, strip_q(split[0])]; //first index indicates whether this contains arrays
        } else if (split.length == 2) {
        	if(exports.keys.indexOf(split[0]) >= 0){
        		return [false, split[0], "", strip_q(split[1])];
        	}
        	if(Object.keys(aliases).indexOf(split[0]) >= 0){
        		return [false, aliases[split[0]], "", strip_q(split[1])];
    		}
        } else if (split.length == 3) {
        	if(Object.keys(compares).indexOf(split[1]) >= 0){
        		if(Object.keys(aliases).indexOf(split[0]) >= 0){
        			split[0] = aliases[split[0]];
        		}
                return [false, split[0], split[1], strip_q(split[2])];
        	}
        } else if (split.length == 4) {
        	if(Object.keys(compares).indexOf(split[1] + " " + split[2]) >= 0){
        		if(Object.keys(aliases).indexOf(split[0]) >= 0){
        			split[0] = aliases[split[0]];
        		}
        		return [false, split[0], split[1] + " " + split[2], strip_q(split[3])];
        	}
        }
        return compile_union(split.join(" AND "));
    }
    
    function strip_q(q){
    	return q.replace(/\s?\"\s?/g,"");
    }
	
	exports.filter = function(compQuery, data) {
	
	    if (compQuery[0]) { //first index indicates whether this contains arrays
	        return union(compQuery, data, Object.values(data).toString());
	    } else {
	        return comparison(compQuery, data, Object.values(data).toString());
	    }
	    //invalid query handling?
	}
	
	function union(compQuery, data, str_rep) {
        //assert comQuery[0] == true
        var last = (compQuery[1][0] ? union : comparison)(compQuery[1], data, str_rep); //union vs comparison with remove parentheses
        for (var i = 2; i < compQuery.length; i += 2) {
            last = unions[compQuery[i].toLowerCase()](last, (compQuery[i + 1][0] ? union : comparison)(compQuery[i + 1], data, str_rep)); // handle undefined function
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
            return compares[compQuery[2]](data[compQuery[1]].toLowerCase(), compQuery[3]);
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
})(window.filter = new Object());