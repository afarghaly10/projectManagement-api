'use strict';

const service = require('./service');
const validator = require('./validation');

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
	get: async (req, res, next) => {
		try {
			const {id} = req.params;
			await validator.doaId(id);

			// call service
			const response = await service.get(id);
			res.json(response);
		} catch (e) {
			next(e);
		}
	},
	create: async (req, res, next) => {
		try {
			const body = req.body;
			// validation
			await validator.createProject(body);
			// call service
			const id = await service.create(body);
			const response = await service.get(id);
			res.json(response);
		} catch (e) {
			next(e);
		}
	},
};

module.exports = controller;
