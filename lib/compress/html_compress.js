var minifier = require("html-minifier").minify,
	fsExt = require("../utils/fs_ext");

module.exports = function(file, callback) {
	var data = fsExt.readFileSync(file),
		out = minifier(data.toString(), {
			removeComments: true,
			removeCommentsFromCDATA: true,
			removeCDATASectionsFromCDATA: true,
			collapseWhitespace: true,
			collapseBooleanAttributes: true,
			removeAttributeQuotes: false,
			removeRedundantAttributes: true,
			useShortDoctype: true,
			removeEmptyAttributes: true,
			removeEmptyElements: false,
			removeOptionalTags: true,
			removeScriptTypeAttributes: true,
			removeStyleLinkTypeAttributes: true,
		});

	callback(out);
};