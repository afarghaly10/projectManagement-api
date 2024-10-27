'use strict';
const {db} = require('../../utility/common/common');

const TABLE = 'Projects';
const project = {
	list: async () => {
		return await db.run(
			db
				.select()
				.fields('*')
				.from(TABLE)
				.where({deletedAt: null})
		);
	},
	get: async (id) => {
		return await db.run(
			db
				.select()
				.fields('*')
				.from(TABLE)
				.where({id, deletedAt: null})
		);
	},
	create: async (createData) => {
		return (await db.run(db.select().insert().into(TABLE).values(createData))).insertId;
	},

};

module.exports = project;
