const globals = require('globals');
const pluginJs = require('@eslint/js');
const configGoogle = require('eslint-config-google');
const pluginJest = require('eslint-plugin-jest');


module.exports = [
	{
		files: ['**/*.js', 'test/**'],
		languageOptions: {
			sourceType: 'commonjs',
			ecmaVersion: 'latest',
			globals: {
				...globals.browser,
				...globals.node,
				...pluginJest.environments.globals.globals,
			},
		},
	},
	pluginJs.configs.recommended,
	configGoogle,
	{
		files: ['test/**'],
		...pluginJest.configs['flat/recommended'],
		rules: {
			...pluginJest.configs['flat/recommended'].rules,
			'jest/prefer-expect-assertions': 'off',
		},
	},
	{
		rules: {
			'no-console': 0,
			'indent': [2, 'tab'],
			'no-tabs': 0,
			'max-len': [2, {
				'code': 120,
			}],
			'no-unused-vars': 'off',
			'valid-jsdoc': 'off',
			'require-jsdoc': 'off',
			'new-cap': 0,
			'no-invalid-this': 0,
			'comma-dangle': ['error', {
				'functions': 'ignore',
				'objects': 'always-multiline',
				'arrays': 'always-multiline',
			}],
			'no-prototype-builtins': 'warn',
			'no-useless-catch': 'warn',
			'eqeqeq': ['warn', 'smart'],
		},
		ignores: [
			'/coverage',
			'/node_modules',
			'/.devops',
		],
	},
];
