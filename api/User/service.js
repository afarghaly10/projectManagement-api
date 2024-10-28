'use strict';

const {get} = require('lodash');
const model = require('./user');

const service = {
	list: async () => {
		return await model.list();
	},
	get: async (id) => {
		return await model.get(id);
	},
};
module.exports = service;
