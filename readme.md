# fis3-parser-art-template4


> artTemplate v4 的FIS编译插件。参考了 [https://github.com/lwdgit/fis-parser-art-template](https://github.com/lwdgit/fis-parser-art-template)

## 安装
```bash
> npm install -g fis3-parser-art-template4
```

## 配置
```javascript
fis.match('**/*.html', {
   parser: fis.plugin('art-template4', {
      native: true,
      //root: 'some-other-path',
      //inimize: true,  
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
> 从上至下优先级依次递减

> noParse: false表示不解析该文件，原样输出；

> release: false表示不输入该文件



## 全局data分配原则

以上面`define`字段中配置说明：

各级目录的配置一般会对应到每个文件。如果只指定了文件夹的数据，则该文件夹下的所有模板配有相同的数据。
路径识别原则：以`/`结尾的识别为文件夹，key值带`.`的识别为文件。所以在自定义变量中请不要使用带`.`及以`/`结尾的变量
变量继承与覆盖原则：与js类似。数组会逐级延长。object类型则进行浅inherit



