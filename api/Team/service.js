'use strict';

const model = require('./team');

const service = {
	list: async () => {
		return await model.list();
	},
	get: async (id) => {
		return await model.get(id);
	},
	create: async (data) => {
		// return await model.create(data);
	},
	patch: async (id, data) => {
		// return await model.update(id, data);
	},
	delete: async (id) => {
		// return await model.remove(id);
	},
	addUser: async (teamId, userId) => {
		// return await model.addUser(teamId, userId);
	},
	removeUser: async (teamId, userId) => {
		// return await model.removeUser(teamId, userId);
	},
};
module.exports = service;
