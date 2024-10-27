'use strict';

const model = require('./project');

const service = {
	list: async () => {
		return await model.list();
	},
	create: async (createData) => {
		const insertId = await model.create(createData);
		return await model.get(insertId);
	},
};

module.exports = service;
