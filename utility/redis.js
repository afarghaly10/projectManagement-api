const errorHandler = require('./errorHandler');
const IORedis = require('ioredis').default;

if (process.env.REDIS_HOST && process.env.NODE_ENV !== 'test') {
	try {
		const redis = new IORedis({
			host: process.env.REDIS_HOST,
			...process.env.REDIS_PORT ? {port: Number(process.env.REDIS_PORT)} : {},
			lazyConnect: true,
			maxRetriesPerRequest: 0,
			connectTimeout: 100,
		});
		redis.on('error', async (err) => {
			let payload;
			console.log(`[Redis] - Error: ${err?.message || err}`);
			if (err instanceof Error) payload = err;
			if (!(err instanceof Error)) payload = new Error(err);
			errorHandler.logToSentry(payload);
		});

		redis.on('connect', () => console.log('[Redis] - Connected to redis instance'));
		redis.on('ready', () => console.log('[Redis] - Redis instance is ready (data loaded from disk)'));

		module.exports = redis;
	} catch (error) {
		module.exports = {
			get: async () => {},
			set: async () => {},
			del: async () => {},
		};
	}
} else {
	console.log('[Redis] - Host not found or test environment, redis client disabled.');
	module.exports = {
		get: async () => {},
		set: async () => {},
		del: async () => {},
	};
}
