module.exports = {
	up:
		'INSERT INTO Teams (teamName, productOwnerUserId, projectManagerUserId) VALUES ' +
		'("Quantum Innovations", 11, 2), ' +
		'("Nebula Research", 13, 4), ' +
		'("Orion Solutions", 15, 6), ' +
		'("Krypton Developments", 17, 8), ' +
		'("Zenith Technologies", 19, 10);',
	down: '',
};
