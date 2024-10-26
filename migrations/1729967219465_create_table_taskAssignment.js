module.exports = {
	up:
		'CREATE TABLE IF NOT EXISTS `TaskAssignment` (\n' +
		'  `id` int(11) NOT NULL AUTO_INCREMENT,\n' +
		'  `userId` int(11) NOT NULL,\n' +
		'  `taskId` int(11) NOT NULL,\n' +
		'  `createdAt` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,' +
		'  `updatedAt` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,' +
		'  `deletedAt` TIMESTAMP NULL DEFAULT NULL,' +
		'  PRIMARY KEY (`id`),\n' +
		'  CONSTRAINT `TaskAssignmentTasks_ibfk_1` FOREIGN KEY (`taskId`) REFERENCES `Tasks` (`id`),\n' +
		'  CONSTRAINT `TaskAssignmentUsers_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`)\n' +
		');',
	down: 'DROP TABLE IF EXISTS `TaskAssignment`;',
};
