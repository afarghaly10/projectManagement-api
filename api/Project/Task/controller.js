'use strict';

const service = require('./service');
const validator = require('./validation');
const httpStatus = require('http-status');

const controller = {
	list: async (req, res, next) => {
		try {
			const {projectId} = req.params;
			await validator.doaId(projectId);

			// call service
			const response = await service.list(projectId);
			res.json(response);
		} catch (e) {
			next(e);
		}
	},
	get: async (req, res, next) => {
		try {
			const {projectId, id} = req.params;
			await Promise.all([
				validator.doaId(projectId),
				validator.doaId(id),
			]);

			// call service
			const response = await service.get(projectId, id);
			res.json(response);
		} catch (e) {
			next(e);
		}
	},
	create: async (req, res, next) => {
		try {
			const body = {...req.body, projectId: req.params.projectId};
			if (!body.status) body.status = 'To Do';
			if (!body.priority) body.priority = 'Backlog';

			// validation
			await validator.doaCreateTask(body);

			// call service
			const id = await service.create(body);
			const response = await service.get(body.projectId, id);

			res.json(response);
		} catch (e) {
			next(e);
		}
	},
	patch: async (req, res, next) => {
		try {
			const body = {...req.body, projectId: req.params.projectId};
			// validation
			await validator.doaPatchTask(body);
			// call service
			await service.patch(body);
			const response = await service.get(body.projectId, body.id);
			res.json(response);
		} catch (e) {
			next(e);
		}
	},
	delete: async (req, res, next) => {
		try {
			const {projectId, id} = req.params;
			// validation
			await Promise.all([
				validator.doaId(projectId),
				validator.doaId(id),
			]);
			// call service
			await service.delete(projectId, id);
			res.sendStatus(httpStatus.NO_CONTENT);
		} catch (e) {
			next(e);
		}
	},
};

module.exports = controller;
