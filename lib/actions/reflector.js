var fsExt = require("../utils/fs_ext"),
	Ast = require("../utils/ast"),
	cfgLoader = require("../utils/loader_config"),
	dependences = require("../utils/dependences"),
	path = require('path'),
	_ = require("underscore"),
	idMap, depMap, index, config, root;

exports.execute = function(option) {
	var target = option.target;
	root = option.source;
	config = cfgLoader.parseConfig(path.join(option.source, option.config_file)) || {};
	config.base = config.base ? id2Uri("./" + config.base + "/") : option.source;

	idMap = {};
	depMap = {};
	index = 0;
	walk(target)
}

function walk(dir) {
	fsExt.listFiles(dir, /^.*\.js$/i).forEach(function(filePath) {
		console.log(('reflecting "' + filePath + '"').input);

		var sourceCode = fsExt.readFileSync(filePath);
		fsExt.writeFileSync(filePath, reflector(sourceCode));
	});
}

function reflector(code) {
	var ast = dependences.getAst(code);

	Ast.walk(ast, 'stat', function(stat) {
		if (stat.toString().indexOf('stat,call,name,define,') !== 0) {
			return stat;
		}

		// stat[1]:
		//     [ 'call',
		//       [ 'name', 'define' ],
		//       [ [Object], [Object], [Object ] ] ]
		var argsAst = stat[1][2];
		idMap[argsAst[0][1]] = index++;
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
		var originalId = argsAst[0][1];
		argsAst[0][1] = idMap[argsAst[0][1]] + '';
		argsAst[1][1] = argsAst[1][1].map(function(dep) {
			var nDep = id2Uri(dep[1], originalId).replace(/\\/g, "/");
			nDep = (idMap[nDep] + '') || dep[1];
			depMap[dep[1]] = nDep;
			return ["string", nDep];
		});

		return stat;
	});

	Ast.walk(ast, 'call', function(stat) {
		if (stat.toString().indexOf('call,name,require,') !== 0) {
			return stat;
		}

		// stat:
		//   [ 'call', [ 'name', 'require' ], [ [ 'string', 'a' ] ] ]
		var argsAst = stat[2];

		argsAst.forEach(function(item) {
			if (item[0] === 'string') {
				//deps.push(item[1]);
				item[1] = depMap[item[1]] || item[1];
			}
		});
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
	id = parsePaths(id);
	var ret;

	if (isAbsolute(id)) {
		ret = id;
	} else if (isRelative(id)) {
		if (id.indexOf("./") === 0) {
			id = id.substring(2);
		}
		ret = path.join(refUri ? path.dirname(refUri) : root, id);
	} else {
		ret = id;
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

var PATHS_RE = /^([^/:]+)(\/.+)$/;

function parsePaths(id) {
	var paths = config.paths
	var m

	if (paths && (m = id.match(PATHS_RE)) && _.isString(paths[m[1]])) {
		id = paths[m[1]] + m[2]
	}

	return id
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