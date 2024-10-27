module.exports = {
	up:
		'INSERT INTO Projects (name, description, startDate, dueDate) VALUES ' +
		'("Apollo", "A space exploration project.", "2024-05-01 00:00:00", "2024-12-31 00:00:00"), ' +
		'("Beacon", "Developing advanced navigation systems.", "2024-06-01 00:00:00", "2025-01-31 00:00:00"), ' +
		'("Catalyst", "A project to boost renewable energy use.", "2024-02-01 00:00:00", "2025-02-01 00:00:00"), ' +
		'("Dawn", "A project to improve healthcare services.", "2024-03-01 00:00:00", "2025-03-01 00:00:00"), ' +
		'("Echo", "Echo project focused on AI advancements.", "2024-04-01 00:00:00", "2024-11-01 00:00:00"), ' +
		'("Foxtrot", "Exploring cutting-edge biotechnology.", "2024-01-01 00:00:00", "2024-10-01 00:00:00"), ' +
		'("Golf", "Development of new golf equipment using AI.", "2024-08-01 00:00:00", "2025-01-01 00:00:00"), ' +
		'("Hotel", "A project to improve tourism infrastructure.", "2024-09-01 00:00:00", "2025-02-01 00:00:00"), ' +
		'("India", "Telecommunication infrastructure upgrade.", "2024-10-01 00:00:00", "2025-03-01 00:00:00"), ' +
		'("Juliet", "Initiative to enhance cyber-security measures.", "2024-07-01 00:00:00", "2025-02-01 00:00:00");',
	down: '',
};
