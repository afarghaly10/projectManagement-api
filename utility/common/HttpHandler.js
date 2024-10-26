// const mysql = require('mysql2');
const db = require('./database');

const AccessKey = require('../api/AccessKey/model');

module.exports = {
	response: (res, err, rows) => {
		if (err) {
			if (err.htmlErrorCode) {
				res.status(err.htmlErrorCode);
			}
			res.json(err);
		} else {
			res.json(rows); // 200
		}
	},
	log: async (req) => {
		try {
			let userId = '';
			if (req.headers.authorization) {
				const token = req.headers.authorization.replace('Bearer ', '');
				const validJwt = await AccessKey.revalidateJwt(token);
				const jwt = await AccessKey.decodeJwt(validJwt.minifiedKey);
				userId = jwt.user && jwt.user.uuid ? jwt.user.uuid : '';
			}

			const endpoint = req.originalUrl;

			const method = req.method;

			const request = {};
			await Object.assign(request, req.body);

			if (request) {
				if (request.password) delete request.password;
				if (request.email) delete request.email;
				if (request.confirmPassword) delete request.confirmPassword;
			}

			const ip =
				(req.headers['x-forwarded-for'] || '').split(',').pop() ||
				req.connection.remoteAddress ||
				req.socket.remoteAddress ||
				req.connection.socket.remoteAddress ||
				'';

			await db.run(
				db
					.insert()
					.into('EndpointLog')
					.values({
						requestBody: JSON.stringify(request),
						endpoint,
						ipAddress: ip,
						method,
						userId,
					})
			);
		} catch (e) {
			// console.error('ENDPOINTLOG_ERROR', e);
		}
	},
	formatError: (message, status, htmlErrorCode) => {
		return {
			message,
			status,
			htmlErrorCode,
		};
	},
};
