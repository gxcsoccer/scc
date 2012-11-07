var path = require("path"),
	compressJs = require("../compress/uglify"),
	compressCss = require("../compress/css_compress"),
	compressHtml = require("../compress/html_compress"),
	fsExt = require("../utils/fs_ext");


var map = {
	".js": compressJs,
	".css": compressCss,
	".html": compressHtml
}

exports.execute = function(option) {
	var target = option.target;
	walk(target);
}

function walk(dir) {
	fsExt.listFiles(dir, /^.*\.(js|css|html)$/i).forEach(function(filePath) {
		console.log(('compressing "' + filePath + '"').input);
		var ext = path.extname(filePath);

		map[ext](filePath, function(code) {
			fsExt.writeFileSync(filePath, code);
		});
	});
}