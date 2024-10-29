'use strict';

const model = require('./task');
const {hashMapHelper} = require('../../../utility/common/common');
const attachmentModel = require('./Attachment/attachment');
const commentModel = require('./Comment/comment');
const userModel = require('../../User/user');

const service = {
	list: async (projectId) => {
		let hashedAttachments;
		let hashedComments;
		const allTasks = await model.list(projectId);

		if (!allTasks) return [];
		const taskIds = allTasks.map((task) => task.id);
		const [comments, attachments] = await Promise.all([
			commentModel.listByTaskIds(taskIds),
			attachmentModel.listByTaskIds(taskIds),
		]);

		attachments?.length ? hashedAttachments = hashMapHelper.hashObjectBy(attachments, 'taskId'): {};
		comments?.length ?(hashedComments = hashMapHelper.hashObjectBy(comments, 'taskId')) : {};
		let userIds = [];
		allTasks.forEach((task) => {
			userIds.push(task.authorUserId, task.assignedUserId);
		});
		userIds = [...new Set(userIds)];
		const allUsers = await userModel.getMultipleUsers(userIds);

		const tasks = allTasks.map((task) => {
			const taskCopy = {...task};
			taskCopy.author = allUsers.find((user) => user.id === task.authorUserId);
			taskCopy.assignee = allUsers.find((user) => user.id === task.assignedUserId);
			taskCopy.attachments = hashedAttachments[task.id] || [];
			taskCopy.comments = hashedComments[task.id] || [];
			delete taskCopy.authorUserId;
			delete taskCopy.assignedUserId;
			return taskCopy;
		});

		return tasks;
	},
	get: async (projectId, id) => {
		return await model.get(projectId, id);
	},
	create: async (createData) => {
		createData.tags = JSON.stringify(createData.tags);
		return await model.create(createData);
	},
	patch: async (body) => {
		const patchItem = {
			...(body.title ? {title: body.title} : {}),
			...(body.description ? {description: body.description} : {}),
			...(body.status ? {status: body.status} : {}),
			...(body.priority ? {priority: body.priority} : {}),
			...(body.tags ? {tags: JSON.stringify(body.tags)} : {}),
			...(body.startDate ? {startDate: body.startDate} : {}),
			...(body.dueDate ? {dueDate: body.dueDate} : {}),
			...(body.points ? {points: body.points} : {}),
			...(body.projectId ? {projectId: body.projectId} : {}),
			...(body.authorUserId ? {authorUserId: body.authorUserId} : {}),
			...(body.assignedUserId ? {assignedUserId: body.assignedUserId} : {}),
		};

		return await model.patch(patchItem);
	},

	delete: async (projectId, id) => {
		return await model.delete(projectId, id);
	},
};

module.exports = service;
