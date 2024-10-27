module.exports = {
	up:
		'ALTER TABLE `Tasks` ' +
		'MODIFY `status` enum(\'To Do\',\'In Progress\',\'Ready For Review\',\'Completed\') DEFAULT \'To Do\', ' +
		'MODIFY `priority` enum(\'Urgent\',\'High\',\'Medium\',\'Low\',\'Backlog\') DEFAULT \'Backlog\'; ',
	down: '',
};
