const express = require("express");
const router = express.Router();

const {
  getAllMovie,
  createMovie,
  getMovieById,
  getVenuesByMovieID,
  addVenuesToMovie,
} = require("../Controllers/Movie");
const { isAdmin, Auth } = require("../Middleware/Auth");

router.get("/getAllMovie", getAllMovie); // working

router.post("/createMovie", Auth, isAdmin, createMovie); // working

router.post("/:movieId/addVenues", Auth, isAdmin, addVenuesToMovie); // working

router.get("/venue/:id", getVenuesByMovieID); // working

router.get("/:id", getMovieById); // working

module.exports = router;
