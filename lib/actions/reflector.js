var fsExt = require("../utils/fs_ext"),
	Ast = require("../utils/ast"),
	dependences = require("../utils/dependences"),
	idMap, index;

exports.execute = function(options) {
	var target = options.target;
	idMap = {};
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
		argsAst[0][1] = idMap[argsAst[0][1]] + '';
		argsAst[1][1] = argsAst[1][1].map(function(dep) {
			return ["string", idMap[dep[1]] + ''];
		});

		return stat;
	});

	return Ast.gen_code(ast, {
		beautify: true
	});
}