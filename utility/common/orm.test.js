const orm = require('./orm');
describe('orm', () => {
	test('should work', () => {
		expect(orm.hasValidProperties({a: 1}, ['a'])).toBeTruthy();
		expect(orm.hasValidProperties({a: 1}, ['b'])).toBeFalsy();
	});
});
