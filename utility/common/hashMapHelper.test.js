
const hashMapHelper = require('./hashMapHelpers');

describe('Hash Map Helper', () => {
	const mockArray = [
		{
			name: 'apple',
			id: 1,
			owner: {
				name: 'bruce',
			},
		},
		{
			name: 'banana',
			id: 2,
			owner: {
				name: 'bruce',
			},
		},
		{
			name: 'apple',
			id: 3,
			owner: {
				name: 'wayne',
			},
		},
	];
	const mockObject = {
		'apple': [{
			name: 'apple',
			id: 1,
		},
		{
			name: 'apple',
			id: 3,
		}],
		'banana': {
			name: 'banana',
			id: 2,
		},
	};


	test('Hash the array', () => {
		const hashedObj = hashMapHelper.hashObjectBy(mockArray, 'name', true);
		expect(hashedObj['apple'].length).toEqual(2);
	});
	test('Hash the array no lower case', () => {
		const hashedObj = hashMapHelper.hashObjectBy(mockArray, 'name', false);
		expect(hashedObj['apple'].length).toEqual(2);
	});
	test('Hash the array by subkey', () => {
		const hashedObj = hashMapHelper.hashObjectBySubKey(mockArray, 'owner', 'name', false);
		expect(hashedObj).toBeDefined();
	});
	test('Hash the array by subkey and lower case', () => {
		const hashedObj = hashMapHelper.hashObjectBySubKey(mockArray, 'owner', 'name', true);
		expect(hashedObj).toBeDefined();
	});
	test('Hash to array', () => {
		const array = hashMapHelper.hashToArray(mockObject);
		expect(array.length).toEqual(3);
	});
	test('Change Hash Key', () => {
		const newHash = hashMapHelper.changeHashKey(mockObject, 'id', false);
		expect(newHash).toBeDefined();
	});
});
