'use-strict';
const axios = require('axios');

/**
 * Gets user object based on current auth token and uuid.
 * @param token the bearer token.
 * @param uuid user.uuid parameter.
 * @returns Promise which fulfills with a {@user User} object.
 */
const getUser = async (token, uuid) => {
	if (uuid.indexOf('user') !== -1) {
		uuid = uuid.replace('user:', '');
	}
	const response = await axios.get(`${process.env.AUTH_URL}/public/users/${uuid}`, {
		headers: {
			'Authorization': `Bearer ${token}`,
			'x-application-key': process.env.APPLICATION_KEY || '',
			'x-application-secret': process.env.APPLICATION_SECRET || '',
		},
	});
	const user = response.data;
	if (user.firstName) {
		user.name = `${user.firstName} ${user.lastName}`;
	} else if (user.username) {
		user.name = user.username;
	} else {
		user.name = user.email.substring(0, user.email.indexOf('@'));
	}
	return user;
};

module.exports = {
	getUser,
};
