const request = require("supertest");
const app = require("../app");

// ⚠️ Update this path to your actual Movie model file
const Movie = require("../Models/Movie"); // or "../Models/Movie"

describe("GET /movie/getAllMovie", () => {
  it("should return 200 and movies array", async () => {
    // seed data in in-memory DB
    await Movie.create({
      title: "Test Movie",
      description: "desc",
      duration: 2.5,
      poster: "http://example.com/test.jpg",
    });

    const res = await request(app).get("/movie/getAllMovie");

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.movies)).toBe(true);
    expect(res.body.movies.length).toBeGreaterThan(0);
  });
});
