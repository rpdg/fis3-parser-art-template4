fis.match("**.html", {
	parser: fis.plugin("art-template4", {
		imports: {
			'timestamp': function (str) {
				return str + '-' + (new Date()).getTime()
			}
		},
		rules: [
			{
				test: /\${([\w\W]*?)}/,
				use: function(match, code) {
					return {
						code: code,
						output: 'raw'
					}
				}
			},
			{
				test: /{{raw}}([\w\W]*?){{\/raw}}/ ,
				use: function(match, code) {
					return {
						code: JSON.stringify(code),
						output: 'raw'
					}
				}
			}
		],
		art : true,
		native: true, //默认为false，即简单语法模式
		define: {
			"projectName": "OPG Video Cloud",
			"lists": [1, 2, 3],
			"object2" : {
				"id" : 1 ,
				"name" : 'objectName'
			} ,
			"title": "title -define in fis-conf",
			"1.html": {
				"title": "1.html title-11"
			},
			"page/": {
				"obj_page2" : {
					a : 1
				},
				"title": "title2 -define in fis-conf -> page",
				"2.html": {
					"lists": ["d01", "d02"],
					"title": "d- title-02",
					"obj_page2" : {
						bb : 12
					}
				},
				"admin/" :{
					"obj_page2" : {
						a : 222
					},
					"3.html" : {
						"obj_page2" : {
							cc : 333
						}
					}
				}
			}
		}
	})
});
