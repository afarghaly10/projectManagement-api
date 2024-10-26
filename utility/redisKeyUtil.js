module.exports = {
	getPricePointKey: (accountId) => {
		return `byoPricePoint:accountId:${accountId}`;
	},
	getByoPricePointLimitKey: (accountId) => {
		return `byoPricePointLimit:accountId:${accountId}`;
	},
	chargifyExpire: process.env.CHARGIFY_REDIS_EXPIRE_TIME && Number(process.env.CHARGIFY_REDIS_EXPIRE_TIME) || 60,
};
