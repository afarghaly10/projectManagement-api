const db = require('./database');

describe('Query Builder Tests', () => {
	describe('Select queries', () => {
		test('should generate simple select', () => {
			expect(
				db
					.select()
					.all()
					.from('Test')
					.toString()
			).toBe('SELECT * FROM `Test`');
		});

		test('should generate select with fields', () => {
			expect(
				db
					.select()
					.fields('a')
					.from('Test')
					.toString()
			).toBe('SELECT a FROM `Test`');

			expect(
				db
					.select()
					.fields('a', 'b')
					.from('Test')
					.toString()
			).toBe('SELECT a, b FROM `Test`');

			expect(
				db
					.select()
					.fields(['a', 'b'])
					.from('Test')
					.toString()
			).toBe('SELECT a AS `b` FROM `Test`');

			expect(
				db
					.select()
					.fields(['a', 'b'])
					.from('Test', 't')
					.toString()
			).toBe('SELECT a AS `b` FROM `Test` AS `t`');
		});

		test('should generate select from subquery', () => {
			expect(
				db
					.select()
					.fields('a')
					.fromSubquery(
						db
							.select()
							.all()
							.from('Sub'),
						't'
					)
					.toString()
			).toBe('SELECT a FROM (SELECT * FROM `Sub`) `t`');
		});

		test('should generate select with where', () => {
			expect(
				db
					.select()
					.all()
					.from('Test')
					.where({id: 2})
					.toString()
			).toBe('SELECT * FROM `Test` WHERE `id` = 2');

			expect(
				db
					.select()
					.all()
					.from('Test')
					.where({id: 2, test: 4})
					.toString()
			).toBe('SELECT * FROM `Test` WHERE (`id` = 2 AND `test` = 4)');
		});

		test('should generate select with where with custom condition items', () => {
			expect(
				db
					.select()
					.all()
					.from('Test')
					.where({$or: [{id: 2}, {test: 4}]})
					.toString()
			).toBe('SELECT * FROM `Test` WHERE (`id` = 2 OR `test` = 4)');
		});

		test('should generate select with where with custom condition values', () => {
			expect(
				db
					.select()
					.all()
					.from('Test')
					.where({$or: [{id: null}, {test: 4}]})
					.toString()
			).toBe('SELECT * FROM `Test` WHERE (`id` IS NULL OR `test` = 4)');

			expect(
				db
					.select()
					.all()
					.from('Test')
					.where({$or: [{id: null}, {test: {$not: null}}]})
					.toString()
			).toBe('SELECT * FROM `Test` WHERE (`id` IS NULL OR `test` IS NOT NULL)');

			expect(
				db
					.select()
					.all()
					.from('Test')
					.where({$or: [{id: null}, {test: {$gt: 0}}]})
					.toString()
			).toBe('SELECT * FROM `Test` WHERE (`id` IS NULL OR `test` > 0)');

			expect(
				db
					.select()
					.all()
					.from('Test')
					.where({$or: [{id: null}, {test: {$like: '%foo%'}}]})
					.toString()
			).toBe(
				'SELECT * FROM `Test` WHERE (`id` IS NULL OR `test` LIKE \'%foo%\')'
			);

			expect(
				db
					.select()
					.all()
					.from('Test')
					.where({id: {$in: [2, 3, 4]}})
					.toString()
			).toBe(
				'SELECT * FROM `Test` WHERE `id` IN (2, 3, 4)'
			);

			expect(
				db
					.select()
					.all()
					.from('Test')
					.where({id: {$not: {$in: [2, 3, 4]}}})
					.toString()
			).toBe(
				'SELECT * FROM `Test` WHERE `id` NOT IN (2, 3, 4)'
			);
		});

		test('should generate select with limit', () => {
			expect(
				db
					.select()
					.all()
					.from('Test')
					.where({$or: [{id: null}, {test: 4}]})
					.limit(1)
					.toString()
			).toBe('SELECT * FROM `Test` WHERE (`id` IS NULL OR `test` = 4) LIMIT 1');
		});

		test('should generate select with offset', () => {
			expect(
				db
					.select()
					.all()
					.from('Test')
					.where({$or: [{id: null}, {test: 4}]})
					.limit(1)
					.offset(10)
					.toString()
			).toBe(
				'SELECT * FROM `Test` WHERE (`id` IS NULL OR `test` = 4) LIMIT 1 OFFSET 10'
			);
		});

		test('should generate select with order by', () => {
			expect(
				db
					.select()
					.all()
					.from('Test')
					.where({$or: [{id: null}, {test: 4}]})
					.limit(1)
					.offset(10)
					.order('test')
					.toString()
			).toBe(
				'SELECT * FROM `Test` WHERE (`id` IS NULL OR `test` = 4) LIMIT 1 OFFSET 10 ORDER BY `test`'
			);

			expect(
				db
					.select()
					.all()
					.from('Test')
					.where({$or: [{id: null}, {test: 4}]})
					.limit(1)
					.offset(10)
					.order('test', ['test2', 'ASC'])
					.toString()
			).toBe(
				'SELECT * FROM `Test` WHERE (`id` IS NULL OR `test` = 4) LIMIT 1 OFFSET 10 ORDER BY `test`, `test2` ASC'
			);
		});

		test('should generate select with join(s)', () => {
			expect(
				db
					.select()
					.all()
					.from('Test')
					.join('Test2')
					.toString()
			).toBe('SELECT * FROM `Test` JOIN `Test2`');

			expect(
				db
					.select()
					.all()
					.from('Test')
					.join('Test2', 't')
					.toString()
			).toBe('SELECT * FROM `Test` JOIN `Test2` `t`');

			expect(
				db
					.select()
					.all()
					.from('Test', 'r')
					.join('Test2', 't')
					.on('r.test2id = t.id')
					.toString()
			).toBe('SELECT * FROM `Test` AS `r` JOIN `Test2` `t` ON r.test2id = t.id');
		});

		test('should generate unions', () => {
			expect(
				db.
					select()
					.all()
					.from('Table')
					.union(
						db.select().fields('id', 'name').from('Table')
					).toString()
			).toBe('SELECT * FROM `Table` UNION SELECT id, name FROM `Table`');
		});
	});
});
