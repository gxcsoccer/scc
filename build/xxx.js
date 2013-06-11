define("xxx", [ "./template/tpl.html" ], function(require) {
    var tpl = require("./template/tpl.html");
    console.log(tpl);
});define('template/tpl.html', [], function() {
	return '<ul>\n\t<li></li>\n\t<li></li>\n\t<li></li>\n\t<li></li>\n\t<li></li>\n</ul>';
});