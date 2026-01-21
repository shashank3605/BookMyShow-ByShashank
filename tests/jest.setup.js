const { connect, clearDatabase, closeDatabase } = require("./setupTestDB");

beforeAll(async () => {
  await connect();
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await closeDatabase();
});
