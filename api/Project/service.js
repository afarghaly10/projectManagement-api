'use strict';

const model = require('./project');

const service = {
	list: async () => {
		return await model.list();
	},
	get: async (id) => {
		return await model.get(id);
	},
	create: async (createData) => {
		return await model.create(createData);
	},
};

module.exports = service;
