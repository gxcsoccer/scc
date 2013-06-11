var path = require("path"),
	cfgLoader = require("../utils/loader_config"),
	fsExt = require("../utils/fs_ext"),
	dependences = require("../utils/dependences"),
	Ast = require("../utils/ast"),
	_ = require("underscore"),
	tpl = _.template(fsExt.readFileSync(__dirname, 'tpl.txt'));

var cache, output, config, root;

exports.execute = function(option) {
	cache = {};
	root = option.source;
	output = path.join(option.target, option.output);
	config = cfgLoader.parseConfig(path.join(option.source, option.config_file)) || {};

	config.base = config.base ? id2Uri("./" + config.base + "/") : option.source;

	if (fsExt.existsSync(output)) {
		fsExt.rmSync(output);
	}

	(option.entries || []).forEach(function(entry) {
		entry = path.join(option.source, entry);
		if (fsExt.isFile(entry)) {
			combine(entry);
		} else if (fsExt.isDirectory(entry)) {
			fsExt.listFiles(entry, /^.*\.(js)$/i).forEach(function(filePath) {
				combine(filePath);
			});
		}
	});
};

function combine(filePath) {
	console.log(('Processing "' + filePath + '" ...').info);
	var filename = path.basename(filePath),
		extname = path.extname(filePath),
		dir = path.dirname(filePath),
		code = fsExt.readFileSync(filePath),
		deps = extname == ".js" ? dependences.parse(code) : [],
		id = path.relative(config.base, filePath).replace(/\\/g, "/");
	id = id.substring(0, id.lastIndexOf(".js"));
	fsExt.appendFileSync(output, extname == ".js" ? normalizeFile(code, id, deps) : definePlainText(code, id));

	deps.filter(function(dep) {
		return !/^.css|.json$/.test(path.extname(dep));
	}).forEach(function(dep) {
		dep = id2Uri(dep, filePath);

		if (dep in cache) {
			return;
		}
		cache[dep] = true;
		if(dep[dep.length - 1] == "#") {
			dep = dep.substring(0, dep.length - 1);
		} else if (!fsExt.existsSync(dep)) {
			dep = dep + ".js"
		}
		combine(dep);
	});
};

function definePlainText(code, id) {
	return tpl({
		id: id,
		text: code.replace(/\n/g, "\\n").replace(/\t/g, "\\t").replace("'", "\'")
	});
}

function normalizeFile(code, id, deps) {
	var ast = dependences.getAst(code);

	Ast.walk(ast, 'call', function(stat) {
		if (stat.toString().indexOf('call,name,require,') !== 0) {
			return stat;
		}

		// stat:
		//   [ 'call', [ 'name', 'require' ], [ [ 'string', 'a' ] ] ]
		var argsAst = stat[2];

		argsAst.forEach(function(item) {
			if (item[0] === 'string') {
				// TODO:
				path.extname(item[1]).toLowerCase() == '.html' && (item[1] += '#');
			}
		});

		return stat;
	});

	Ast.walk(ast, 'stat', function(stat) {
		if (stat.toString().indexOf('stat,call,name,define,') !== 0) {
			return stat;
		}

		// stat[1]:
		//     [ 'call',
		//       [ 'name', 'define' ],
		//       [ [Object], [Object], [Object ] ] ]
		var argsAst = stat[1][2];

		if (argsAst.length === 1) {
			argsAst.unshift(["array", deps.map(function(dep) {
				return ["string", dep];
			})]);
			argsAst.unshift(["string", id]);
		} else if (argsAst.length === 2) {
			argsAst[0][0] === "array" ? argsAst.unshift(["string", id]) : argsAst.splice(1, 0, ["array", deps.map(function(dep) {
				return ["string", dep];
			})]);
		}

		return stat;
	});

	return Ast.gen_code(ast, {
		beautify: true
	});
}

function id2Uri(id, refUri) {
	if (!id) {
		return "";
	}
	id = parseAlias(id);
	var ret;

	if (isAbsolute(id)) {
		ret = id;
	} else if (isRelative(id)) {
		if (id.indexOf("./") === 0) {
			id = id.substring(2);
		}
		ret = path.join(refUri ? path.dirname(refUri) : root, id);
	} else {
		ret = config.base + "/" + id;
	}
	return path.normalize(ret);
}

function parseAlias(id) {
	if (id.charAt(0) === "#") {
		return id.substring(1);
	}
	var alias = config.alias;
	if (alias && isTopLevel(id)) {
		var parts = id.split('/')
		var first = parts[0]

		if (alias.hasOwnProperty(first)) {
			parts[0] = alias[first]
			id = parts.join('/')
		}
	}

	return id;
}

function isAbsolute(id) {
	return id.indexOf('://') > 0 || id.indexOf('//') === 0
}


function isRelative(id) {
	return id.indexOf('./') === 0 || id.indexOf('../') === 0
}

function isTopLevel(id) {
	var c = id.charAt(0)
	return id.indexOf('://') === -1 && c !== '.' && c !== '/'
}