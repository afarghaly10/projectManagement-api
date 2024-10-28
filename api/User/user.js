'use strict';
const {get} = require('lodash');
const {db} = require('../../utility/common/common');
const {join} = require('path');
const TABLE = 'Users';

const model = {
	list: async () => {
		return await db.run(
			db
				.select()
				.fields('U.*', 'T.teamName')
				.from(TABLE, 'U')
				.join('Teams', 'T')
				.on('U.teamId = T.id')
				.where({'U.deletedAt': null, 'T.deletedAt': null})
		);
	},
	listWithTeams: async () => {
		const [users, teams] = await Promise.all([
			db.run(
				db
					.select()
					.fields('*')
					.from(TABLE)
					.where({deletedAt: null})
			),
			db.run(
				db
					.select()
					.fields('*')
					.from('Teams')
					.where({deletedAt: null})
			),
		]);
		return await db.run(
			db
				.select()
				.fields('*')
				.from(TABLE)
				.where({deletedAt: null})
		);
	},
	get: async (id) => {
		const [user] = await db.run(
			db
				.select()
				.fields('*')
				.from(TABLE)
				.where({id, deletedAt: null})
		);
		return user;
	},
};
module.exports = model;
