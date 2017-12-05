fis.match('**/*.html', {
	parser: fis.plugin('art-template4', {
		native: false,
		//root: 'some-other-path',
		minimize: true,
		filter: {
			timestamp: function (str) {
				return str + '-' + (new Date()).getTime()
			}
		},
		define: {
			pageTitle: 'ITB'
		}
	}),
	rExt: 'aspx'
});