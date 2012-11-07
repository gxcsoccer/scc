var path = require("path"),
	colors = require("colors"),
	_ = require("underscore"),
	fsExt = require("./utils/fs_ext"),
	opts = require("./utils/opts");

colors.setTheme({
	silly: 'rainbow',
	input: 'grey',
	verbose: 'cyan',
	prompt: 'grey',
	info: 'green',
	data: 'grey',
	help: 'cyan',
	warn: 'yellow',
	debug: 'blue',
	error: 'red'
});

process.on('uncaughtException', function(err) {
	console.log(("Caught exception: " + err).error);
	console.log(err.stack.error);
});

console.segm = function() {
	console.info('------------------------------------------------------------------------');
};

console.empty = function() {
	console.info('');
};

var opt = opts.get();
opt.add("config", "The config file of the tool");
opt.defaultValue("config", path.resolve(path.dirname(module.filename), "../config.json"));
var argv = opt.argv;

var globalConfig = {};

function readConfig() {
	if (!fsExt.isFile(argv.config)) {
		throw "config.json missed!";
	}

	var content = eval("(" + fsExt.readFileSync(argv.config).toString() + ")"),
		actions = content["actions"] || {};

	globalConfig["source"] = content["source"];
	globalConfig["target"] = content["target"];
	if (fsExt.existsSync(content["target"])) {
		fsExt.rmSync(content["target"]);
	}

	Object.keys(actions).forEach(function(key) {
		var action = getAction(key);
		action.execute(_.extend({}, globalConfig, actions[key]));
		console.segm();
		console.empty();
	});
};

function getAction(actionName) {
	var actionDir = path.join(path.dirname(module.filename), "./actions"),
		action = require(path.join(actionDir, actionName));
	return action;
};

readConfig();