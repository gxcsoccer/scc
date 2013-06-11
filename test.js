var fsExt = require('./lib/utils/fs_ext'),
	text = fsExt.readFileSync('./test/template', 'tpl.html');

console.log(escape(text));
