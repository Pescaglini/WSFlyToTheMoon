module.exports = {
	extends: ['@commitlint/config-conventional'],
	helpUrl: '🐰\nIf you are reading this, your commit message was not formatted correctly.\nPlease read the following link to learn how to format your commit message:\nhttps://gitlab.com/killabunnies/killadocs/-/blob/master/COMMITS.md',
	rules: {
		'body-max-line-length': [0, 'always', Infinity],
		'footer-max-line-length': [0, 'always', Infinity],
	}
};

