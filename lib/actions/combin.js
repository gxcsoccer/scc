var path = require("path"),
	fsExt = require("../utils/fs_ext");

exports.execute = function(option) {
	var source = option.source,
		target = option.target,
		output = path.join(target, option.output);

	(option.input || []).forEach(function(dir) {
		dir = path.join(source, dir);
		console.log(('combining "' + dir + '" to "' + output + '"').verbose);
		fsExt.appendFileSync(output, fsExt.readFileSync(dir))
	});
};