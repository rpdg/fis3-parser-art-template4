"use strict";
///
var template = require("art-template");
var fs = require("fs");
var path = require("path");
var jsonfile = require("jsonfile");
var deepmerge = require("deepmerge");
var artRule = require("art-template/lib/compile/adapter/rule.art");
var nativeRule = require("art-template/lib/compile/adapter/rule.native");
var LOCAL_MODULE = /^\.+\//;
function resolveFilename(filename, options) {
    //console.warn(filename , LOCAL_MODULE.test(filename) , options);
    //var path = require('path');
    var root = options.root;
    var extname = options.extname;
    if (filename && filename.charAt(0) === "/") {
        filename = path.join(template.defaults.root, filename);
    }
    else {
        if (LOCAL_MODULE.test(filename)) {
            var from = options.filename;
            var self_1 = !from || filename === from;
            var base = self_1 ? root : path.dirname(from);
            filename = path.resolve(base, filename);
        }
        else {
            filename = path.resolve(root, filename);
        }
    }
    if (!path.extname(filename)) {
        filename = filename + extname;
    }
    return filename;
}
var isInited = false;
var needClean = false;
var deletedFileName = "/.deleted";
/**
 * 插件载入时的初始化
 * @param options 在fis-conf.json 定义的模板配置
 */
function initEngine(options) {
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
        var l = options.rules.length;
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
        for (var key in options.imports) {
            if (typeof options.imports[key] === "function") {
                template.defaults.imports[key] = options.imports[key];
            }
        }
    }
    fis.on("release:end", function () {
        var opt = fis.config.data.options;
        var dest;
        if (needClean && (dest = opt.d || opt.dest)) {
            fis.log.info("clean files...");
            setTimeout(function () {
                fs.unlink(path.join(process.cwd(), dest + deletedFileName), function (err) {
                    if (err)
                        fis.log.warn(err);
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
function readConfig(file) {
    var jsonFile = file.realpathNoExt + ".json";
    var data;
    if (fs.existsSync(jsonFile)) {
        data = jsonfile.readFileSync(jsonFile);
        file.cache.addDeps(jsonFile);
    }
    else {
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
function mergeGlobalData(subpath, localData, globalData) {
    var mergeData = [];
    var props = [];
    var subs = subpath.split("/");
    for (var i = 0, l = subs.length; i < l; i++) {
        var p = (i ? props[i - 1] : "") + subs[i] + (i > l - 2 ? "" : "/");
        props.push(p);
    }
    for (var i = 0, l = props.length; i < l; i++) {
        var obj = globalData[props[i]];
        if (obj !== undefined) {
            mergeData.push(obj);
        }
    }
    mergeData.push(localData);
    var data = deepmerge.all(mergeData);
    return data;
}
/**
 * 渲染模板最终数据
 * @param file 模板文件
 * @param data 渲染数据
 * @returns 渲染结果
 */
function render(file, data) {
    //template.dependencies = []; //增加dependencies,用于记录文件依赖
    if (data === void 0) { data = {}; }
    var content = template(file.fullname, data);
    /*if (template.dependencies.length) { //如果有include,将被include的文件加入deps

        template.dependencies.forEach(function (cp : any) {
            file.cache.addDeps(cp);
        });

    }*/
    if (content.indexOf("{Template Error}") === -1) {
        return content;
        //return content.replace(/([\n\r])(\s*)\1/g, "$1$1");
    }
    else {
        console.log(file + " render Error!");
        return ("<!doctype html>\r\n<html>\r\n\t<head>\r\n\t\t<title>Template Error</title>\r\n\t</head>\r\n\t<body>" +
            content +
            "\r\n\t</body>\r\n</html>");
    }
}
var globalConfigFile = fis.project.getProjectPath() + "/config.json";
var globalConfigFileExisted = fs.existsSync(globalConfigFile);
//使用全局变量是为了防止Obj也被递归
var Obj = {};
/**
 * 读取全局配置 config.json
 * @param definedData 在fis-conf.json 里定义的data
 */
function readGlobalData(definedData, file) {
    if (definedData === void 0) { definedData = {}; }
    var data;
    if (globalConfigFileExisted) {
        file.cache.addDeps(globalConfigFile); //添加编译依赖
        var gCfgData = jsonfile.readFileSync(globalConfigFile);
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
function reduceObject(jsonPath, targetObject, srcObject) {
    var targetDefaultPath = jsonPath.replace(/\/$/, "") + "/";
    if (targetObject[targetDefaultPath] === undefined) {
        targetObject[targetDefaultPath] = {};
    }
    for (var key in srcObject) {
        if (/\/$/.test(key)) {
            reduceObject(targetDefaultPath + key, targetObject, srcObject[key]);
        }
        else if (key.indexOf(".") > -1) {
            targetObject[targetDefaultPath + key] = srcObject[key];
        }
        else {
            targetObject[targetDefaultPath][key] = srcObject[key];
        }
    }
}
module.exports = function (content, file, options) {
    if (!content || content.trim() === "")
        return "";
    if (!file.isHtmlLike)
        return content;
    if (!isInited) {
        readGlobalData(options.define, file);
        delete options.define;
        initEngine(options);
        isInited = true;
    }
    var data = readConfig(file);
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
//# sourceMappingURL=index.js.map