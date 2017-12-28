# filter.js
A simple to use, filtering JS module that enables simple text searches over an array of javascript objects (all local manipulation).
This project was initially started with the intent to work with the jQuery mobile library's filterable plugin, its single searchbar and its [custom filter](https://api.jquerymobile.com/filterable/#custom-filter-example).
To this end, it supports both a very loose form of searching (like plaintext) and increasing complexity with more specific results (field comparisons and logical connectors).
As well, it strives to be very customizable.

## Getting Started

To add the code to a project, all that is required is the filter.js file. Including it in an html file can be done with just a simple script tag
```
<script type="text/javascript" src="js/filter.js"></script>
```
, which will set up the module as 'filter', or 
```
<script type="text/javascript" src="js/filter.js" data-binding="testName"></script>
```
, which will set up the module as 'testName' in the window scope.

### Prerequisites

Testing is done through the [QUnit system](https://api.qunitjs.com/) and this is the only requirement for development, though the html testbench auto-includes this dependancy.

## Features

### Public functions:
* ```filter(query, object)``` -  takes a query string and either a single object or an array of objects and returns either a boolean or an array of booleans
* ```compile(query)``` - takes a query and returns a structural form, to be passed into ```filterCompiled```
* ```filterCompiled(compQuery, object)``` - takes the structural form from ```compile``` and an object and returns a boolean
* ```set(input)``` - Allows for a settings array to be passed in, as detailed in the **Settings** section

### Public classes:
* ```FilterClass``` - simple class allowing for creating a new query of a string and then being able to filter on it
	- ```new FilterClass(query)``` returns a new immutable object with the given query
	- ```FilterClass.filter(object)``` returns a boolean of whether it matches the constructor's query string
* ```InvalidQueryException``` - query was invalid, perhaps because of unmattched quotation marks?
	- ```InvalidQueryException.toString()```  returns string representation of error
* ```SettingException``` - settings passed were invalid in some way
	- ```SettingException.toString()```  returns string representation of error

### Public variables:
* ```defaults``` - contains the default settings that are passed into the system originally

### Settings
* plaintext (boolean): allows for users to search all the objects by just looking for the keywords somewhere within the fields (tokenized along spaces).
* keys (array): the list of keys that are able to be searched (used in conjunction with the strict keys param)
* aliases (associative array): compiles other names of fields to the proper one
* compares (associative array): functions operating on fields and comparison values, like "equals" and ">"
* unions (associative array): functions that combine multiple comparisons
* failure callback (function): provides a way for errors to be passed through a custom mechanism instead of crashing some system.
* compile aliases (boolean): allows for similar names to compile to their respective fields, e.g. "fname" compiling to the field "first_name" (presumably is slightly faster)
* strict keys (boolean): refuses to accept keys that are not pre-loaded in the 'keys' set, if plaintext is off, otherwise compiles to plaintext
* memoize (boolean): stores previously compiled queries to imrpove speed at cost of memory
* regex (boolean): (not currently implemented) allows for regex matches

## Running the tests

The 'run-test.bat' file is provided for testing convenience. It will automatically run QUnit with the required configuration and clear the console. The same command will no doubt apply to other OSs. In addition, the file new_test.html will provide the visual QUnit interface.

The tests will break down into two modules: compile-test (tests the compilation feature) and run-test (tests the running of a compiled set).

### compile-test

#### out of box

Attempts to test whether the default settings are configured as intended.

#### negation

Simply tests whether the notequals and basic parsing works as intended.

(May be removed in later versions)

#### plaintext

Tests whether plaintext queries compile correctly.

#### compileAliases

Tests whether aliases correctly compile to their respective fields.

#### strictKeys

Tests whether using invalid keys

#### failureCallback

## Built With

* [QUnit](https://api.qunitjs.com/) - Testing suite

## Authors

* **John Meyer** - *Initial work* - [JohnAMeyer](https://github.com/johnameyer)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Thanks to the team at GAIC - Interns POC
