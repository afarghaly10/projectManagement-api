'use strict';
const {update} = require('lodash');
const {db} = require('../../../utility/common/common');

const TABLE = 'Tasks';
const project = {
	list: async (projectId) => {
		return await db.run(
			db.select().fields('*').from(TABLE).where({deletedAt: null, projectId})
		);
	},
	get: async (projectId, id) => {
		const [[task], attachments, comments] = await Promise.all([
			db.run(
				db.select().fields('*').from(TABLE).where({id, deletedAt: null, projectId})
			),
			db.run(
				db.select().fields('*').from('Attachments').where({taskId: id, deletedAt: null})
			),
			db.run(
				db.select().fields('*').from('Comments').where({taskId: id, deletedAt: null})
			),
		]);

		const response ={...task, attachments: [...attachments], comments: [...comments]};
		return response;
	},
	create: async (createData) => {
		return (await db.run(db.insert().into(TABLE).values(createData))).insertId;
	},

	patch: async (patchItem) => {
		return await db.run(
			db
				.update()
				.table(TABLE)
				.set({...patchItem, updatedAt: db.expr.now()})
				.where({
					id: patchItem.id,
					projectId: patchItem.projectId,
					deletedAt: null,
				})
		);
	},

	delete: async (projectId, id) => {
		await Promise.all([
			db.run(
				db
					.update()
					.table('Attachments')
					.set({deletedAt: db.expr.now()})
					.where({taskId: id, deletedAt: null})
			),
			db.run(
				db
					.update()
					.table('Comments')
					.set({deletedAt: db.expr.now()})
					.where({taskId: id, deletedAt: null})
			),
		]);

		return await db.run(
			db
				.update()
				.table(TABLE)
				.set({deletedAt: db.expr.now()})
				.where({
					id,
					projectId,
					deletedAt: null,
				})
		);
	},
};

module.exports = project;
