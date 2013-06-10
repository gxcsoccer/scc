seajs.config({
	alias: {}
}), define("main", ["./a", "/module/b"], function(require) {
	var e = require("./a"),
		t = require("/module/b")
}), define("a", function(require, e, t) {
	e.a = function() {
		alert("this is a")
	}
}), define("module/b", function(require, e, t) {
	e.b = function() {
		alert("this is b")
	}
});