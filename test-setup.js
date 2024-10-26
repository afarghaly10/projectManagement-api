jest.setTimeout(60000);

afterAll(() => {
	global.gc && global.gc();
});
