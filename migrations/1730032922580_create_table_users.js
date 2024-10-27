module.exports = {
	up:
		'CREATE TABLE IF NOT EXISTS `Users` (\n' +
		'  `id` int(11) NOT NULL AUTO_INCREMENT,\n' +
		'  `cognitoId` varchar(64) COLLATE utf8_unicode_ci DEFAULT NULL,\n' +
		'  `username` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,\n' +
		'  `profilePictureUrl` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,\n' +
		'  `createdAt` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,' +
		'  `updatedAt` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,' +
		'  `deletedAt` TIMESTAMP NULL DEFAULT NULL,' +
		'  `teamId` int(11) NOT NULL,\n' +
		'  PRIMARY KEY (`id`),\n' +
		'  KEY `teamId` (`teamId`),\n' +
		'  CONSTRAINT `userTeam_ibfk_1` FOREIGN KEY (`teamId`) REFERENCES `Teams` (`Id`)\n' +
		');',
	down: 'DROP TABLE IF EXISTS `Users`;',
};
