module.exports = {
	up:
		'INSERT INTO Comments (text, taskId, userId) VALUES ' +
		'("We need to update this design to include new specifications.", 1, 2), ' +
		'("Can we meet to discuss the navigation algorithm updates?", 2, 4), ' +
		'("This energy solution looks promising, but needs more research.", 3, 6), ' +
		`("Let's revise the software development workflow to include agile methodologies.", 4, 8), ` +
		'("We should consider newer AI models for better accuracy.", 5, 10), ' +
		'("Product testing needs to be more rigorous.", 6, 12), ' +
		'("The AI golf swing analysis is not accurate enough.", 7, 14), ' +
		'("The hotel database is missing some critical information.", 8, 16), ' +
		'("Infrastructure upgrades must be done during low traffic hours.", 9, 18), ' +
		'("Security measures need to be enhanced to prevent data breaches.", 10, 20), ' +
		'("Consider using more robust training datasets for AI.", 11, 1), ' +
		'("Server security update meeting scheduled for next week.", 12, 2), ' +
		'("UX redesign has been well received in initial user tests.", 13, 3), ' +
		'("Data analytics implementation needs to account for real-time processing delays.", 14, 4), ' +
		'("Encryption project needs to align with international security standards.", 15, 5), ' +
		'("Review cloud storage optimization strategies in Q3 meeting.", 16, 6), ' +
		'("Hardware compatibility tests to include newer device models.", 17, 7), ' +
		'("Visualization tools to support both 2D and 3D data representations.", 18, 8), ' +
    '("IoT device prototypes to undergo extensive field testing.", 19, 9), ' +
    '("Legacy system upgrade to start with backend databases.", 20, 10), ' +
    '("Network security framework should prioritize threat detection improvements.", 21, 1), ' +
    '("Application deployment strategies to include Docker integration.", 22, 2), ' +
    '("Market analysis should cover competitive product landscapes.", 23, 3), ' +
    '("Feedback mechanisms to utilize adaptive questioning techniques.", 24, 4), ' +
		'("API integration must ensure data privacy compliance.", 25, 5);',
	down: '',
};
