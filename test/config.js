seajs.config({
	"base": "./",
	"alias": {

	}
});

define(function(require) {
	var a = require("./a");
	var b = require("/module/b");
})