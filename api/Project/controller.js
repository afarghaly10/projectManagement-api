'use strict';

const service = require('./service');

const controller = {
	list: async (req, res, next) => {
		try {
			// validation

			// call service
			const response = await service.list();
			res.json(response);
		} catch (e) {
			next(e);
		}
	},
	create: async (req, res, next) => {
		try {
			const body = req.body;
			// validation

			// call service
			const response = await service.create(body);
			res.json(response);
		} catch (e) {
			next(e);
		}
	},
};

module.exports = controller;
