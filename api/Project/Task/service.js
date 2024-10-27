'use strict';

const model = require('./task');

const service = {
	list: async (projectId) => {
		return await model.list(projectId);
	},
	get: async (projectId, id) => {
		return await model.get(projectId, id);
	},
	create: async (createData) => {
		createData.tags = JSON.stringify(createData.tags);
		return await model.create(createData);
	},
	patch: async (body) => {
		const patchItem = {
			...(body.title ? {title: body.title} : {}),
			...(body.description ? {description: body.description} : {}),
			...(body.status ? {status: body.status} : {}),
			...(body.priority ? {priority: body.priority} : {}),
			...(body.tags ? {tags: JSON.stringify(body.tags)} : {}),
			...(body.startDate ? {startDate: body.startDate} : {}),
			...(body.dueDate ? {dueDate: body.dueDate} : {}),
			...(body.points ? {points: body.points} : {}),
			...(body.projectId ? {projectId: body.projectId} : {}),
			...(body.authorUserId ? {authorUserId: body.authorUserId} : {}),
			...(body.assignedUserId ? {assignedUserId: body.assignedUserId} : {}),
		};

		return await model.patch(patchItem);
	},

	delete: async (projectId, id) => {
		return await model.delete(projectId, id);
	},
};

module.exports = service;
