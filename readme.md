# fis3-parser-art-template4 

[![NPM Version](https://img.shields.io/npm/v/fis3-parser-art-template4.svg)](https://npmjs.org/package/fis3-parser-art-template4)
[![NPM Downloads](http://img.shields.io/npm/dm/fis3-parser-art-template4.svg)](https://npmjs.org/package/fis3-parser-art-template4)
[![Node.js Version](https://img.shields.io/node/v/fis3-parser-art-template4.svg)](http://nodejs.org/download/)

> FIS3编译artTemplate v4 的插件，支持模板继承，支持自定义语法，并增强了内置变量，直接生成HTML页面。

## 安装
```bash
> npm install -g fis3-parser-art-template4
```

## 配置
```javascript
fis.match('*.html', {
   parser: fis.plugin('art-template4', {
      art : true, //内置的简单语法开关，默认唯一打开的规则
      native: true, //内置的原生语法开关
      //**添加自定义语法，具体请参考art-template4官方文档**
      rules: [ 
        {
           // 增加类似es6的模板语法${...}
           test: /\${([\w\W]*?)}/, 
           use: function(match, code) {
                   return { 
                       code: code,
                       output: 'raw'
                    }
                }
         },
         {
             // 增加在内部原文输出的语法{{raw}}...{{/raw}}
             test: /{{raw}}([\w\W]*?){{\/raw}}/ , 
             use: function(match, code) {
                 return {
                     code: JSON.stringify(code),
                     output: 'raw'
                 }
             }
          }
      ],
      //**注册过滤器**
      imports: {
          timestamp: function (str) {
              return str +  '-'  + (new Date()).getTime();
          }
      },
      // 自定义数据
      define: {
         pageTitle: 'ITB',
         'sub/': {
              pageTitle: 'Sub Pages',
              'p2.html': {
                   pageTitle: 'Page P2'
              }
          }
      }
  })
});
```

## 关于data处理

为了让模版文件和数据分离，本插件对art-template的数据收集进行了三种形式的存放。

 * 同目录下同名的json文件，即test.json对应为test.html的数据（优先级最高）；
 * 工程目录下的config.json，该数据为全局配置；
 * fis-config中插件的`define`字段 （优先级最低）。
 

## Art-template内置变量增强 ##
* **$file**: FIS3的file变量，在页面文件中，可以使用类似$file.filename 来取得文件名，或者其他file信息(如 $file.dirname, $file.ext)，详见[http://fis.baidu.com/fis3/api/fis.file-File.html](http://fis.baidu.com/fis3/api/fis.file-File.html "FIS3文档")。
当项目需要按照文件路径的某些规则，编译对应数据变量进页面的时候非常有用；也可用于自动include某些资源，如文件同名的js等。



## 全局data分配原则

以上面`define`字段中配置说明：

各级目录的配置一般会对应到每个文件。如果只指定了文件夹的数据，则该文件夹下的所有模板配有相同的数据。
路径识别原则：**以`/`结尾的识别为文件夹**，**key值带`.`的识别为文件**。所以在自定义变量中请不要使用带`.`及以`/`结尾的变量
变量继承与覆盖原则：与js类似，数组会逐级延长，object则进行浅inherit

#### 附加配置：
* **$noParse**: true 表示不解析该文件，原样输出；
* **$release**: false 表示不输出该文件


## 针对ArtTemplate的hack

 * 针对fis增加了绝对路径的支持，即所有模板都可以以工程目录为根目录进行include。


## 鸣谢 ##
插件开发参考了 [https://github.com/lwdgit/fis-parser-art-template](https://github.com/lwdgit/fis-parser-art-template)
