module.exports = {
	up:
		'CREATE TABLE IF NOT EXISTS `Tasks` (\n' +
		'  `id` int(11) NOT NULL AUTO_INCREMENT,\n' +
		'  `projectId` int(11) NOT NULL,\n' +
		'  `authorUserId` int(11) NOT NULL,\n' +
		'  `assignedUserId` int(11) DEFAULT NULL,\n' +
		'  `description` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,\n' +
		'  `status` varchar(15) COLLATE utf8_unicode_ci DEFAULT NULL,\n' +
		'  `priority` varchar(15) COLLATE utf8_unicode_ci DEFAULT NULL,\n' +
		'  `tags` varchar(512) COLLATE utf8_unicode_ci DEFAULT NULL,\n' +
		'  `startDate` DATETIME NULL DEFAULT NULL,' +
		'  `dueDate` DATETIME NULL DEFAULT NULL,' +
		'  `points` int(11) DEFAULT NULL,\n' +
		'  `createdAt` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,' +
		'  `updatedAt` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,' +
		'  `deletedAt` TIMESTAMP NULL DEFAULT NULL,' +
		'  PRIMARY KEY (`id`),\n' +
		'  KEY `assignedUserId` (`assignedUserId`),\n' +
		'  CONSTRAINT `TasksProjects_ibfk_1` FOREIGN KEY (`projectId`) REFERENCES `Projects` (`id`),\n' +
		'  CONSTRAINT `TasksUsers_ibfk_1` FOREIGN KEY (`authorUserId`) REFERENCES `Users` (`id`)\n' +
		');',
	down: 'DROP TABLE IF EXISTS `Tasks`;',
};
