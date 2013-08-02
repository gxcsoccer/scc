var path = require("path"),
	fsExt = require("../utils/fs_ext");

exports.execute = function(option) {
	var source = option.source,
		target = option.target;

	(option.input || []).forEach(function(dir) {
		var src = path.resolve(source, dir),
			tar = path.resolve(target, path.basename(dir));

		console.log(('copying "' + src + '" to "' + tar + '"').debug);
		if (fsExt.isFile(src)) {
			fsExt.copyFileSync(src, tar, "");
		} else if (fsExt.isDirectory(src)) {
			fsExt.copydirSync(src, tar);
		}
	});

	(option.exclude || []).forEach(function(dir) {
		fsExt.rmSync(path.join(target, dir));
	});
}
