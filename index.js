"use strict";
var template = require("art-template");
var fs = require("fs");
var path = require("path");
var deepmerge = require("deepmerge");
var artRule = require("art-template/lib/compile/adapter/rule.art");
var nativeRule = require("art-template/lib/compile/adapter/rule.native");
var LOCAL_MODULE = /^\.+\//;
function resolveFilename(filename, options) {
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
function initEngine(options) {
    template.defaults.root = options.root ? options.root : fis.project.getProjectPath();
    template.defaults.resolveFilename = resolveFilename;
    if (typeof options.escape === 'boolean') {
        template.defaults.escape = options.escape;
    }
    template.defaults.rules.length = 0;
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
    if (template.defaults.rules.length === 0) {
        template.defaults.rules.push(artRule);
    }
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
            }, 1000);
        }
        needClean = false;
    });
}
function readConfig(file) {
    var jsonFile = file.realpathNoExt + ".json";
    var data;
    if (fs.existsSync(jsonFile)) {
        data = fis.util.readJSON(jsonFile);
        file.cache.addDeps(jsonFile);
    }
    else {
        data = {};
        file.cache.addMissingDeps(jsonFile);
    }
    return data;
}
function mergeGlobalData(subpath, localData, globalData) {
    var mergeData = [];
    var subs = subpath.split("/");
    var propPath = '';
    for (var i = 0, l = subs.length; i < l; i++) {
        propPath = propPath + subs[i] + (i > l - 2 ? "" : "/");
        var obj = globalData[propPath];
        if (obj !== undefined) {
            mergeData.push(obj);
        }
    }
    mergeData.push(localData);
    var data = deepmerge.all(mergeData);
    return data;
}
function render(src, file, data) {
    if (data === void 0) { data = {}; }
    var content = template(file.fullname, data);
    return content;
}
var globalConfigFile = fis.project.getProjectPath() + "/config.json";
var globalConfigFileExisted = fs.existsSync(globalConfigFile);
var Obj = {};
function readGlobalData(definedData, file) {
    if (definedData === void 0) { definedData = {}; }
    var data;
    if (globalConfigFileExisted) {
        file.cache.addDeps(globalConfigFile);
        var gCfgData = fis.util.readJSON(globalConfigFile);
        data = deepmerge(definedData, gCfgData);
    }
    else {
        file.cache.addMissingDeps(globalConfigFile);
        data = definedData;
    }
    reduceObject("", Obj, data);
    return data;
}
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
        needClean = true;
        file.release = deletedFileName;
        return "";
    }
    if (data["$noParse"] === true) {
        return content;
    }
    data = mergeGlobalData(file.subpath, data, Obj);
    data["$file"] = file;
    data['$media'] = fis.project.currentMedia();
    return render(content, file, data);
};
//# sourceMappingURL=index.js.map