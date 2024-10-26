module.exports = {
	'testEnvironment': 'node',
	'moduleNameMapper': {
		'^axios$': '<rootDir>/node_modules/axios/dist/node/axios.cjs',
		'^uuid$': '<rootDir>/node_modules/uuid/dist',
	},
	'testPathIgnorePatterns': [
		'/*\\.skip\\.test\\.js',
	],
	'logHeapUsage': true,
	'maxWorkers': 2,
	'workerIdleMemoryLimit': 1024,
	'collectCoverageFrom': [
		'api/**/*.js',
		'utility/**/*.js',
		'!api/**/*.test-skip.js',
	],
	'coveragePathIgnorePatterns': [
		'<rootDir>/utility/middleware/auth.js',
		'<rootDir>/api/Commitment', // disabled module
		'<rootDir>/api/Interest', // disabled module
		'utility/migration-scripts',
		'testSetupHelper.js',
		'testSetups.js',
		'testSetup.js',
		'questionTestSetup.js',
		'studyTestSetup.js',
	],
	'moduleFileExtensions': [
		'js',
	],
	'coverageReporters': [
		'json',
		'lcov',
		'text',
		'clover',
		'cobertura',
	],
	'coverageThreshold': {
		'global': {
			'branches': 35.00,
			'functions': 47.50,
			'lines': 50.00,
			'statements': 50.00,
		},
	},
	'setupFiles': ['<rootDir>/test-env-setup.js'],
	'setupFilesAfterEnv': ['<rootDir>/test-setup.js'],
};
