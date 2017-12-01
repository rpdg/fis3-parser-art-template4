# fis3-parser-art-template4 ![NPM version](https://badge.fury.io/js/fis3-parser-art-template4.png)

[![NPM Download](https://nodei.co/npm-dl/fis3-parser-art-template4.png?months=1)](https://www.npmjs.org/package/fis3-parser-art-template4)

> artTemplate v4 的FIS编译插件，支持模板继承，并增强了内置变量。

## 安装
```bash
> npm install -g fis3-parser-art-template4
```

## 配置
```javascript
fis.match('**/*.html', {
   parser: fis.plugin('art-template4', {
      native: true,//默认为false，即简单语法模式
      //minimize: true,  
      define: {
         pageTitle: 'ITB'
      }
  }),
  rExt: 'aspx' 
});
```

## 关于data处理

为了让模版文件和数据分离，本插件对art-template的数据收集进行了三种形式的存放。

 * 和模版同名的json文件，即test.json对应为test.tpl的数据
 * 工程目录下的config.json，该数据为全局配置，可以对应多个模版文件
 * fis-config中插件的`define`字段
 

## Art-template内置变量增强 ##
* **$file**: FIS3的file变量，在页面文件中，可以使用类似$file.filename 来取得文件名，或者其他file信息(如 $file.dirname, $file.ext)，详见[http://fis.baidu.com/fis3/api/fis.file-File.html](http://fis.baidu.com/fis3/api/fis.file-File.html "FIS3文档")；
* **$noParse**: true 表示不解析该文件，原样输出；
* **$release**: false 表示不输出该文件



## 全局data分配原则

以上面`define`字段中配置说明：

各级目录的配置一般会对应到每个文件。如果只指定了文件夹的数据，则该文件夹下的所有模板配有相同的数据。
路径识别原则：**以`/`结尾的识别为文件夹**，**key值带`.`的识别为文件**。所以在自定义变量中请不要使用带`.`及以`/`结尾的变量
变量继承与覆盖原则：与js类似。数组会逐级延长。object类型则进行浅inherit


## 鸣谢 ##
插件开发参考了 [https://github.com/lwdgit/fis-parser-art-template](https://github.com/lwdgit/fis-parser-art-template)
