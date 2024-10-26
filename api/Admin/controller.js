'use strict';

const controller = {
	get: async (req, res, next) => {
		try {
			const response = `Hello World!`;

			res.json(response);
		} catch (e) {
			next(e);
		}
	},
};

module.exports = controller;
