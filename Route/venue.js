const express = require("express");
const router = express.Router();
const {
  getAllVenues,
  createVenue,
  addMovieInVenue,
  getVenueById,
  addShowTimings,
} = require("../Controllers/Venue");
const { isAdmin, Auth } = require("../Middleware/Auth");

router.get("/getAllVenue", getAllVenues); // working

router.post("/createVenue", Auth, isAdmin, createVenue); // working

router.get("/:id", getVenueById); // working

router.post("/:id/timing/add", Auth, isAdmin, addShowTimings); // working
module.exports = router;
