fis.match('*.html', {
	parser: fis.plugin('art-template4', {
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
		imports: {
			'timestamp': function (str) {
				return str + '-' + (new Date()).getTime()
			}
		},
		define: {
			pageTitle: 'ITB',
			someDataObject: [1,2,3],
			currentLanguage: "cn",
			'sub/': {
				pageTitle: 'Sub Pages',
				'p2.html': {
					pageTitle: 'Page P2'
				}
			}
		}
	})
});


fis.match('{/comm/*.*,*.json}', {
	release: false
});
