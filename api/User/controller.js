
'use strict';

const service = require('./service');
const validator = require('./validation');

const controller = {
	list: async (req, res, next) => {
		try {
			const response = await service.list();
			res.json(response);
		} catch (error) {
			next(error);
		}
	},
	get: async (req, res, next) => {
		try {
			await validator.doaId(Number(req.params.id));
			const response = await service.get(req.params.id);
			res.json(response);
		} catch (error) {
			next(error);
		}
	},
};
module.exports = controller;
