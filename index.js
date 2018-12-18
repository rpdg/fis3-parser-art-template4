"use strict";
var template = require("art-template");
var fs = require("fs");
var path = require("path");
var jsonfile = require("jsonfile");
var artRule = require("art-template/lib/compile/adapter/rule.art");
var nativeRule = require("art-template/lib/compile/adapter/rule.native");
var runtime = require("art-template/lib/runtime");
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
function extend(oldObj, newObj, override, combine) {
    if (typeof oldObj === "object" && typeof newObj === "object") {
        for (var o in newObj) {
            if (typeof oldObj[o] !== "undefined") {
                if (combine && oldObj[o] instanceof Array) {
                    oldObj[o] = newObj[o].concat(oldObj[o]);
                }
                if (override === true) {
                    oldObj[o] = newObj[o];
                }
            }
            else {
                if (combine && oldObj[o] instanceof Array) {
                    oldObj[o] = newObj[o].concat(oldObj[o]);
                }
                else {
                    oldObj[o] = newObj[o];
                }
            }
        }
    }
    else {
        return oldObj || newObj || {};
    }
    return oldObj;
}
var isInited = false;
var needClean = false;
var deletedFileName = "/.deleted";
// 插件载入时的初始化
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
    template.defaults.rules = [options.native ? nativeRule : artRule];
    template.defaults.resolveFilename = resolveFilename;
    if (options.imports) {
        for (var key in options.imports) {
            if (options.imports.hasOwnProperty(key) && typeof options.imports[key] === "function") {
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
//使用全局变量是为了防止Obj也被递归
var Obj = {};
//将对象降维
function listObj(key, obj) {
    //console.log(key);
    if ((key && !/\/$/.test(key)) || key.indexOf(".") > -1 || /_defaults$/.test(key)) {
        return obj;
    }
    key = key ? key : "";
    for (var i in obj) {
        if (!/_defaults$/.test(i) && Object.prototype.toString.call(obj[i]) !== "[object Object]") {
            if (key) {
                Obj[key + "_defaults"] = Obj[key + "_defaults"] || {};
                Obj[key + "_defaults"][i] = obj[i];
            }
            else {
                Obj["_defaults"] = Obj["_defaults"] || {};
                Obj["_defaults"][i] = obj[i];
            }
            //console.log(i);
        }
        else {
            var value = listObj(key + i, obj[i]);
            if (value !== undefined) {
                if (typeof value !== "object") {
                    Obj[key + i] = value;
                }
                else {
                    Obj[key + i] = extend(Obj[key + i], value, true, true);
                }
            }
        }
    }
    return undefined;
}
function recursiveExtend(path, data) {
    if (path === "") {
        return extend(data, gData["_defaults"], false, true);
    }
    data = extend(data, gData[path + "/_defaults"], false, true);
    path = path.substr(0, path.lastIndexOf("/"));
    return recursiveExtend(path, data);
}
var gData = {};
// 读取全局配置 config.json
function readGlobalData(file) {
    var gCfgJsonFile = fis.project.getProjectPath() + "/config.json";
    var gCfgData;
    if (fs.existsSync(gCfgJsonFile)) {
        gCfgData = jsonfile.readFileSync(gCfgJsonFile);
        Obj = {};
        listObj('', gCfgData);
        gCfgData = Obj;
        extend(gData, gCfgData, false, true);
        file.cache.addDeps(gCfgJsonFile); //移除全局配置编译依赖
    }
    else {
        //throw new Error(gJsonFile + ' not exists!');
        gCfgData = {};
    }
    extend(gData, gCfgData, false, true);
}
//读取同名json配置
function readConfig(file) {
    var jsonFile = file.realpathNoExt + ".json";
    var data;
    if (fs.existsSync(jsonFile)) {
        data = jsonfile.readFileSync(jsonFile);
        file.cache.addDeps(jsonFile);
    }
    else {
        data = {};
    }
    //extend(true , data, gData);
    data = recursiveExtend(file.id, extend(data, gData[file.id], false, false));
    return data;
}
function render(file, data) {
    data = data || {};
    template.dependencies = []; //增加dependencies,用于记录文件依赖
    data['$file'] = file;
    var content = template(file.fullname, data);
    if (template.dependencies.length) { //如果有include,将被include的文件加入deps
        template.dependencies.forEach(function (cp) {
            file.cache.addDeps(cp);
        });
    }
    if (content.indexOf('{Template Error}') === -1) {
        return content.replace(/([\n\r])(\s*)\1/g, '$1$1');
    }
    else {
        console.log(file + ' render Error!');
        return '<!doctype html>\r\n<html>\r\n\t<head>\r\n\t\t<title>Template Error</title>\r\n\t</head>\r\n\t<body>' + content + '\r\n\t</body>\r\n</html>';
    }
}
module.exports = function (content, file, options) {
    if (!file.isHtmlLike)
        return content;
    if (!isInited) {
        gData = options.define || {};
        delete options.define;
        initEngine(options);
        readGlobalData(file);
        isInited = true;
    }
    var data = readConfig(file);
    if (data["$release"] === false) {
        //如果不release,将文件丢到.deleted,并添加clean标记,在release:end后清除
        needClean = true;
        file.release = deletedFileName;
    }
    if (data["$noParse"] === true) {
        return content;
    }
    if (!content || content.trim() === "") {
        return "";
    }
    return render(file, data);
};