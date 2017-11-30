console.log(JSON.stringify(fis))

fis.match('**/*.html', {
	parser: fis.plugin('art-template4', {
		native: true,
		//root: 'e:/www/',
		minimize: true,
		define: {
			pageTitle: ['ITB','ddd'],
		}
	})
});