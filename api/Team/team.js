'use strict';

const {db} = require('../../utility/common/common');

const TABLE ='Teams';

const model = {
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
		const [[team], users, projects] = await Promise.all([
			db.run(
				db
					.select()
					.fields('*')
					.from(TABLE)
					.where({id, deletedAt: null})
			),
			db.run(
				db
					.select()
					.fields('*')
					.from('Users')
					.where({teamId: id, deletedAt: null})
			),
			db.run(
				db
					.select()
					.fields('P.*')
					.from('Projects', 'P')
					.join('ProjectTeam', 'PT')
					.on('P.id = PT.projectId')
					.where({'PT.teamId': id, 'P.deletedAt': null})
			),
		]);
		const teamFullDetails = {
			...team,
			totalMembers: users?.length,
			members: users?.map((user) => ({
				id: user.id,
				username: user.username,
				profilePictureUrl: user.profilePictureUrl,
			})),
			projects: projects?.map((project) => ({
				id: project.id,
				name: project.name,
				description: project.description,
				startDate: project.startDate,
				dueDate: project.dueDate,
				status: project.status,
			})),
		};
		return teamFullDetails;
	},
	create: async (data) => {
		// Code...
	},
	update: async (id, data) => {
		// Code...
	},
	remove: async (id) => {
		// Code...
	},
	addUser: async (teamId, userId) => {
		// Code...
	},
	removeUser: async (teamId, userId) => {
		// Code...
	},
};
module.exports = model;
