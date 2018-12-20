///
import * as template from "art-template";
import * as fs from "fs";
import * as path from "path";
import * as jsonfile from "jsonfile";
import * as deepmerge from "deepmerge";

const artRule = require("art-template/lib/compile/adapter/rule.art");
const nativeRule = require("art-template/lib/compile/adapter/rule.native");

type FisFile = {
	fullname: string;
	id: string;
	isHtmlLike: boolean;
	realpathNoExt: string;
	subpath: string;
	cache: any;
	release: string | boolean;
};

type ArtOption = {
	define?: any;
	filename: string;
	extname: string;
	minimize: boolean;
	cache: boolean;
	compileDebug: boolean;
	escape: boolean;
	root: string;
	rules: any[];
	resolveFilename: any;
	imports: { [key: string]: Function };
	native: boolean;
	art: boolean;
};


type KeyValueObject = { [k: string]: any };



const LOCAL_MODULE = /^\.+\//;

function resolveFilename(filename: string, options: ArtOption) {
	//console.warn(filename , LOCAL_MODULE.test(filename) , options);
	//var path = require('path');
	let root = options.root;
	let extname = options.extname;

	if (filename && filename.charAt(0) === "/") {
		filename = path.join(template.defaults.root, filename);
	} else {
		if (LOCAL_MODULE.test(filename)) {
			let from = options.filename;
			let self = !from || filename === from;
			let base = self ? root : path.dirname(from);
			filename = path.resolve(base, filename);
		} else {
			filename = path.resolve(root, filename);
		}
	}

	if (!path.extname(filename)) {
		filename = filename + extname;
	}

	return filename;
}

let isInited: boolean = false;
let needClean: boolean = false;
const deletedFileName: string = "/.deleted";

/**
 * 插件载入时的初始化
 * @param options 在fis-conf.json 定义的模板配置
 */
function initEngine(options: ArtOption) {
	if (options.minimize === true) {
		template.defaults.minimize = options.minimize;
	}

	if (options.compileDebug === true) {
		template.defaults.compileDebug = options.compileDebug;
	}

	if (options.escape === false) {
		template.defaults.escape = options.escape;
	}

	if (options.cache === false) {
		template.defaults.cache = options.cache;
	}

	template.defaults.root = options.root ? options.root : fis.project.getProjectPath();

	//
	template.defaults.rules = [];
	if (options.rules && options.rules.length) {
		let l = options.rules.length;
		while (l--) {
			template.defaults.rules.push(options.rules[l]);
		}
	}
	if (options.native) {
		template.defaults.rules.push(nativeRule);
	}
	if (options.art) {
		template.defaults.rules.push(artRule);
	}
	if (!template.defaults.rules.length) {
		template.defaults.rules.push(artRule);
	}

	template.defaults.resolveFilename = resolveFilename;

	if (options.imports) {
		for (let key in options.imports) {
			if (typeof options.imports[key] === "function") {
				template.defaults.imports[key] = options.imports[key];
			}
		}
	}

	fis.on("release:end", function() {
		let opt = fis.config.data.options;
		let dest: string;

		if (needClean && (dest = opt.d || opt.dest)) {
			fis.log.info("clean files...");
			setTimeout(function() {
				fs.unlink(path.join(process.cwd(), dest + deletedFileName), function(err) {
					if (err) fis.log.warn(err);
					fis.log.info("clean success...");
				});
			}, 1000); //延时1秒清理
		}
		needClean = false;
	});
}

/**
 * 读取同名json配置
 * @param file 模板文件
 */
function readConfig(file: FisFile): any {
	const jsonFile: string = file.realpathNoExt + ".json";

	let data: any;

	if (fs.existsSync(jsonFile)) {
		data = jsonfile.readFileSync(jsonFile);
		file.cache.addDeps(jsonFile);
	} else {
		data = {};
		file.cache.addMissingDeps(jsonFile);
	}

	return data;
}

/**
 * 将全局data合并到单文件的data中
 * @param subpath 文件物理路径
 * @param localData 文件同名json的data
 * @param globalData 全局data
 */
function mergeGlobalData(subpath: string, localData: any, globalData: any): any {
	let mergeData = [];
	let props: string[] = [];
	let subs = subpath.split("/");
	for (let i = 0, l = subs.length; i < l; i++) {
		let p = (i ? props[i - 1] : "") + subs[i] + (i > l - 2 ? "" : "/");
		props.push(p);
	}

	for (let i = 0, l = props.length; i < l; i++) {
		let obj = globalData[props[i]];
		if (obj !== undefined) {
			mergeData.push(obj);
		}
	}

	mergeData.push(localData);

	let data = deepmerge.all(mergeData);

	return data;
}
/**
 * 渲染模板最终数据
 * @param file 模板文件
 * @param data 渲染数据
 * @returns 渲染结果
 */
function render(file: FisFile, data: any = {}): string {
	//template.dependencies = []; //增加dependencies,用于记录文件依赖

	let content = template(file.fullname, data);

	/*if (template.dependencies.length) { //如果有include,将被include的文件加入deps

		template.dependencies.forEach(function (cp : any) {
			file.cache.addDeps(cp);
		});

	}*/

	if (content.indexOf("{Template Error}") === -1) {
		return content;
		//return content.replace(/([\n\r])(\s*)\1/g, "$1$1");
	} else {
		console.log(file + " render Error!");
		return (
			"<!doctype html>\r\n<html>\r\n\t<head>\r\n\t\t<title>Template Error</title>\r\n\t</head>\r\n\t<body>" +
			content +
			"\r\n\t</body>\r\n</html>"
		);
	}
}

let globalConfigFile: string = fis.project.getProjectPath() + "/config.json";
let globalConfigFileExisted: boolean = fs.existsSync(globalConfigFile);

//使用全局变量是为了防止Obj也被递归
let Obj: KeyValueObject = {};

/**
 * 读取全局配置 config.json
 * @param definedData 在fis-conf.json 里定义的data
 */
function readGlobalData(definedData: any = {} , file:FisFile) {
	let data: any;
	if (globalConfigFileExisted) {
		file.cache.addDeps(globalConfigFile); //添加编译依赖
		let gCfgData = jsonfile.readFileSync(globalConfigFile);
		data = deepmerge(definedData, gCfgData);
	} 
	else {
		file.cache.addMissingDeps(globalConfigFile);
		data = definedData;
	}

	reduceObject("", Obj, data);

	return data;
}

/**
 * 将数据降维展开
 * @param jsonPath 
 * @param targetObject 
 * @param srcObject 
 */
function reduceObject(jsonPath: string, targetObject: any, srcObject: any): any {
	const targetDefaultPath = jsonPath.replace(/\/$/, "") + "/";
	if (targetObject[targetDefaultPath] === undefined) {
		targetObject[targetDefaultPath] = {};
	}

	for (let key in srcObject) {
		if (/\/$/.test(key)) {
			reduceObject(targetDefaultPath + key, targetObject, srcObject[key]);
		} else if (key.indexOf(".") > -1) {
			targetObject[targetDefaultPath + key] = srcObject[key];
		} else {
			targetObject[targetDefaultPath][key] = srcObject[key];
		}
	}
}

//export fis3 plugin
export = function(content: string, file: FisFile, options: ArtOption): string {
	if (!content || content.trim() === "") return "";

	if (!file.isHtmlLike) return content;

	if (!isInited) {
		readGlobalData(options.define , file);
		delete options.define;

		initEngine(options);
		isInited = true;
	}

	let data = readConfig(file);

	if (data["$release"] === false) {
		//如果不release,将文件丢到.deleted,并添加clean标记,在release:end后清除
		needClean = true;
		file.release = deletedFileName;
		return "";
	}

	if (data["$noParse"] === true) {
		return content;
	}

	data = mergeGlobalData(file.subpath, data, Obj);

	// 加入内置的file变量
	data["$file"] = file;

	return render(file, data);
};
