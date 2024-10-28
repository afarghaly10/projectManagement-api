
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
	create: async (req, res, next) => {
		try {
			// code ..
		} catch (error) {
			next(error);
		}
	},
	patch: async (req, res, next) => {
		try {
			// code ..
		} catch (error) {
			next(error);
		}
	},
	delete: async (req, res, next) => {
		try {
			// code ..
		} catch (error) {
			next(error);
		}
	},
	addUser: async (req, res, next) => {
		try {
			await validator.doaId(Number(req.params.id));
			await validator.doaId(Number(req.body.userId));
			const response = await service.addUser(req.params.id, req.body.userId);
			res.json(response);
		} catch (error) {
			next(error);
		}
	},
	removeUser: async (req, res, next) => {
		try {
			await validator.doaId(Number(req.params.id));
			await validator.doaId(Number(req.params.userId));
			const response = await service.removeUser(req.params.id, req.params.userId);
			res.json(response);
		} catch (error) {
			next(error);
		}
	},
};
module.exports = controller;
