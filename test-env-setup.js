const dotenv = require('dotenv');
const variables = {
	PRICING_API: 'http://localhost:3000/dev/lookup',
	QUALITY_LOG_MAX_POTENTIAL_THREAT: 50,
	QUALITY_LOG_MAX_IP_COUNT: 100,
	LUCID_KILL_SWITCH: 'true',
};
console.log(`============ env-setup Loading ===========`);
dotenv.config();
console.log('default variables to be set if not in .env:');
console.table(variables);
console.log('\n');
Object.keys(variables).forEach((key) => {
	if (process.env[key]) return;
	console.log(`[JEST - ENV-SETUP] set ${key} -> ${variables[key]}`);
	process.env[key] = variables[key];
});
console.log(`============ env-setup Loaded  ===========`);
