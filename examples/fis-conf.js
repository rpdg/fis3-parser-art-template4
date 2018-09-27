fis.match('*.html', {
	parser: fis.plugin('art-template4', {
		native: false, //default is false
		filter: {
			'timestamp': function (str) {
				return str + '-' + (new Date()).getTime()
			}
		},
		define: {
			pageTitle: 'ITB',
			someDataObject: [1,2],
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
