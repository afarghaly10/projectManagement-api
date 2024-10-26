const validation = require('./validation');

describe('Validation Tests', () => {
	describe('Simple Type Validation', () => {
		test('should work with numbers', () => {
			expect(
				validation()
					.number()
					.perform(2)
			).toBe(false);
			expect(
				validation()
					.number()
					.perform('')
			).toBe('should be a number');
		});

		test('should work with strings', () => {
			expect(
				validation()
					.string()
					.perform(2)
			).toBe('should be a string');
			expect(
				validation()
					.string()
					.perform('')
			).toBe(false);
		});
	});

	describe('Combination validation', () => {
		test('should work with and', () => {
			expect(
				validation()
					.and(validation().number(), validation().positive())
					.perform(2)
			).toBe(false);
			expect(
				validation()
					.and(validation().number(), validation().positive())
					.perform(-2)
			).toBe('should be positive');
		});

		test('should work with or', () => {
			expect(
				validation()
					.or(validation().number(), validation().string())
					.perform(2)
			).toBe(false);
			expect(
				validation()
					.or(validation().number(), validation().string())
					.perform('')
			).toBe(false);
		});
	});

	describe('Chaining', () => {
		test('should work', () => {
			expect(
				validation()
					.number()
					.positive()
					.perform(2)
			).toBe(false);
			expect(
				validation()
					.number()
					.positive()
					.perform(-2)
			).toBe('should be positive');
		});
	});

	describe('Schema', () => {
		test('basics', () => {
			expect(
				validation()
					.schema({a: validation().number()})
					.perform({a: 2})
			).toBe(false);
			expect(
				validation()
					.schema({
						a: validation().not(validation().number(), 'should not be a number'),
					})
					.perform({a: 2})
			).toBe('a: should not be a number');
		});

		test('optional values', () => {
			const schema = validation().schema({
				a: validation()
					.number()
					.positive(),
				b: validation()
					.number()
					.optional(),
			});

			expect(schema.perform({a: 2})).toBe(false);
			expect(schema.perform({a: 2, b: 3})).toBe(false);
			expect(schema.perform({b: 3})).toBe('a: should be a number');
		});

		test('optional values', () => {
			const schema = validation().schema({
				a: validation()
					.number()
					.positive(),
				b: validation()
					.number()
					.optional(),
			});

			expect(schema.perform({a: 2})).toBe(false);
			expect(schema.perform({a: 2, b: 3})).toBe(false);
			expect(schema.perform({b: 3})).toBe('a: should be a number');
		});

		test('can handle odd values', () => {
			let oddValuesAppeared = false;
			const schema = validation().schema(
				{
					a: validation()
						.number()
						.positive(),
					b: validation()
						.number()
						.optional(),
				},
				(values) => {
					oddValuesAppeared = values;
				}
			);

			expect(schema.perform({c: 4})).toBe('a: should be a number');
			expect(oddValuesAppeared.length).toBe(1);
			expect(oddValuesAppeared[0]).toBe('c');
		});

		test('can handle odd values #2', () => {
			class OddValuesError extends Error {}

			const schema = validation().schema(
				{
					a: validation()
						.number()
						.positive(),
					b: validation()
						.number()
						.optional(),
				},
				(values) => {
					throw new OddValuesError(values);
				}
			);

			let error = null;
			try {
				schema.perform({c: 4});
			} catch (e) {
				error = e;
			}

			expect(!!error).toBe(true);
			expect(error instanceof OddValuesError).toBe(true);
		});
	});

	describe('Extensions', () => {
		test('should work', () => {
			validation.extend('number2', () => (value, error) =>
				error || (value === 2 ? false : 'should be 2')
			);

			expect(
				validation()
					.number2()
					.perform(2)
			).toBe(false);
			expect(
				validation()
					.number2()
					.perform(3)
			).toBe('should be 2');
		});
	});
});
