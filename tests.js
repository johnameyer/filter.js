const {test} = QUnit;

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

QUnit.module("compile-test",{
	beforeEach: function() {
		filter.set(filter.defaults);
	}
});//before test, reset filter

test("out of box", function(assert){
	assert.expect(5);

	assert.throws(function(){
		filter.compile("jack");
	},filter.InvalidQuery,"Plaintext mode is off");
	assert.deepEqual(filter.compile("firstname like jack"),[false,"firstname",[false,"like"],"jack"],"Does not recognize firstname, but cannot be plaintext");
	assert.deepEqual(filter.compile("lastname equals test"),[false,"lastname",[false,"equals"],"test"],"Same structure, different query");
	assert.throws(function(){
		filter.compile("lastname not equals test");
	},filter.InvalidQuery,"Plaintext mode is off, should suggest 'notequals'?");
	assert.throws(function(){
		filter.compile("lorenzo the magnificent");
	},filter.InvalidQuery,"Unrecognized comparison, cannot be plaintext");
});

test("negation",function(assert){	//test negation - eg. notlike
	assert.expect(3);

	assert.deepEqual(filter.compile("lastname notequals test"), [false,"lastname",[true,"equals"],"test"],"Negation test");//TODO handle equals vs equal?
	assert.throws(function(){
		filter.compile("lorenzo notthe magnificent");
	},filter.InvalidQuery,"Unrecognized comparison, cannot be plaintext");

	filter.set({"plaintext": true});
	assert.deepEqual(filter.compile("lastname notequal test"), [true,[false,"lastname"],"and",[false,"notequal"],"and",[false,"test"]],"Unrecognized comparison");
});

test("plaintext", function(assert){
	assert.expect(6);

	filter.set({"plaintext": true});
	assert.deepEqual(filter.compile("jack"), [false,"jack"],"Single string");
	assert.deepEqual(filter.compile("jack meyer"), [true,[false,"jack"],"and",[false,"meyer"]],"Two strings");
	assert.deepEqual(filter.compile("lorenzo the magnificent"), [true,[false,"lorenzo"],"and",[false,"the"],"and",[false,"magnificent"]],"Three strings");
	assert.deepEqual(filter.compile("\"lorenzo the\" magnificent"),[true,[false,"lorenzo the"],"and",[false,"magnificent"]],"Using quotes");
	assert.deepEqual(filter.compile("lorenzo and magnificent"),[true,[false,"lorenzo"],"and",[false,"magnificent"]],"And is still and");
	assert.deepEqual(filter.compile("lorenzo \"and\" magnificent"),[true,[false,"lorenzo"],"and",[false,"and"],"and",[false,"magnificent"]],"And is still and");
});

test("compileAliases", function(assert){//uses alias map to precompile
	assert.expect(4);

	assert.throws(function(){
		filter.set({"compileAliases": true});
		//filter.compile("fname like jack");
	},filter.SettingException,"No aliases to compile/check against");
	assert.deepEqual(filter.compile("fname like jack"),[false,"fname",[false,"like"],"jack"], "Setting rolls back because invalid");

	filter.set({"compileAliases": true,"aliases":{"fname":"firstname"}});
	assert.deepEqual(filter.compile("fname like jack"),[false,"firstname",[false,"like"],"jack"],"fname -> firstname");
	assert.throws(function(){
		filter.compile("fname the magnificent");
	},filter.InvalidQuery,"Doesn't matter if alias compiles, still not valid comparison");

	filter.set({"plaintext": true});//how to handle plaintext vs keys? use or?

});

test("strictKeys", function(assert){//errors if refrenced key is not in passed keyset
	assert.expect(9);

	assert.throws(function(){
		filter.set({"strictKeys": true});
		//filter.compile("firstname like jack");
	},filter.SettingException,"No keys to compile/check against");//TODO check messages too?

	assert.deepEqual(filter.compile("firstname like jack"),[false,"firstname",[false,"like"],"jack"], "Setting rolls back because invalid");

	/*assert.throws(function(){
		filter.set({"strictkeys": true,"aliases":{"fname":"firstname"}});
		//filter.compile("fname like jack");
	},filter.SettingException,"Compile from alias but does not have keys to match against");*/

	filter.set({"strictKeys": true,"keys":["firstname"]});
	assert.deepEqual(filter.compile("firstname like jack"),[false,"firstname",[false,"like"],"jack"],"Key is in set");
	assert.throws(function(){
		filter.compile("lorenzo like magnificent");
	},filter.InvalidQuery,"Invalid key does not compile");

	//TODO check compileAliases off?

	filter.set({"compileAliases":true,"aliases":{"fname":"firstname"}});
	assert.deepEqual(filter.compile("fname like jack"),[false,"firstname",[false,"like"],"jack"],"Alias compiled and key is in set");
	assert.throws(function(){
		filter.compile("lastname like meyer");
	},filter.InvalidQuery,"Key is not in keys or aliases");

	assert.throws(function(){
		console.log(filter.set({aliases:{"fname":"firstname","lname":"lastname"}}));
	},filter.SettingException,"Some aliases map to unknown keys");

	/*assert.throws(function(){
		filter.compile("lname like meyer");
	},filter.CompilationException,"Alias compiles but key is not in set");*/

	filter.set({"plaintext":true});//if key is not found, defaults to plaintext
	assert.deepEqual(filter.compile("lorenzo the magnificent"), [true,[false,"lorenzo"],"and",[false,"the"],"and",[false,"magnificent"]],"Defaults to plaintext because no key or comparison");
	assert.deepEqual(filter.compile("lorenzo like magnificent"), [true,[false,"lorenzo"],"and",[false,"like"],"and",[false,"magnificent"]],"Defaults to plaintext because no key");
});

/*
test("compileFunctions", function(assert){
	assert.expect(1);
	filter.set({"compileFunctions":true});
	assert.equal(typeof filter.compile("lorenzo like magnificent")[2][1],"function","passes back function instead of function name");
	//compile functions too
});

test("lowercase", function(assert){
	assert.expect(0);
	//test lowercase
});
*/

test("failure callback", function(assert){
	assert.expect(3);

	assert.throws(function(){
		filter.set({"errorCallback":true});
	},filter.SettingException,"Must pass in function");
	var errorVar;
	filter.set({"errorCallback":function(error){errorVar = error;}});
	assert.equal(filter.compile("jack"),null,"Does not throw an error directly");
	assert.ok(errorVar instanceof filter.InvalidQueryException,"Error is defined and is InvalidQuery");
	//failure callback - no longer should throw, just nulls
});
/*filter.set({
	keys: ["firstname", "lastname", "emailaddress", "phone"],
	aliases: {
			"fname": "firstname",
			"lname": "lastname",
			"email": "emailaddress",
			"phonenumber": "phone"
	},
	plaintext: true
});*/

test("regex", function(assert){
	assert.expect(0);
});

//compile to one big function

QUnit.module("filter-test",{});

test("stringkeys", function(assert){
	assert.expect(0);

	filter.set({"stringkeys": {}});
	//only listed keys can be searched in plaintext mode
});

test("builtins", function(assert){
	assert.expect(0);
	//test builtins and functions
});

//settings change in between compilation and running - error

//todo ordering?

//todo suggestions mechanic