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
		const [dbItem] = await db.run(
			db
				.select()
				.fields('*')
				.from(TABLE)
				.where({id, deletedAt: null})
		);
		return dbItem;
	},
	create: async (createData) => {
		return (await db.run(db.insert().into(TABLE).values(createData))).insertId;
	},

};

module.exports = project;
