module.exports = {
	up:
		'CREATE TABLE IF NOT EXISTS `ProjectTeam` (\n' +
		'  `id` int(11) NOT NULL AUTO_INCREMENT,\n' +
		'  `teamId` int(11) NOT NULL,\n' +
		'  `projectId` int(11) DEFAULT NULL,\n' +
		'  `isActive` BOOLEAN NULL DEFAULT NULL,' +
		'  `createdAt` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,' +
		'  `updatedAt` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,' +
		'  `deletedAt` TIMESTAMP NULL DEFAULT NULL,' +
		' PRIMARY KEY (`id`),' +
		' CONSTRAINT `ProjectTeamTeam_ibfk_1`' +
		'   FOREIGN KEY (`teamId`) REFERENCES `Teams` (`id`),' +
		' CONSTRAINT `ProjectTeamProject_ibfk_1`' +
		'   FOREIGN KEY (`projectId`) REFERENCES `Projects` (`id`));',
	down: 'DROP TABLE IF EXISTS `ProjectTeam`;',
};
