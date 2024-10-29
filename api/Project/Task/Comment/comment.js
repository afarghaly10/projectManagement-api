'use strict';
const {db} = require('../../../../utility/common/common');

const TABLE = 'Comments';

const comment = {
	list: async () => {
		// code...
	},
	listByTaskIds: async (taskIds) => {
		return await db.run(
			db
				.select()
				.fields('*')
				.from(TABLE)
				.where({
					taskId: {$in: taskIds},
					deletedAt: null,
				})
		);
		// code...
	},
	get: async (id) => {
		// code...
	},
};
module.exports = comment;
