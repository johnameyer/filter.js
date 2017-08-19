# filter.js
A simple to use, filtering JS module that enables simple text searches for users

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

Testing is done through the [QUnit system](https://api.qunitjs.com/) and this is the only requirement for development.

## Running the tests

The 'run-test.bat' file is provided for testing convenience. It will automatically run QUnit with the required configuration and clear the console. The same command will no doubt apply to other OSs.

## Built With

* [QUnit](https://api.qunitjs.com/) - Testing suite

## Authors

* **John Meyer** - *Initial work* - [JohnAMeyer](https://github.com/johnameyer)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Thanks to the team at GAIC - Interns POC
