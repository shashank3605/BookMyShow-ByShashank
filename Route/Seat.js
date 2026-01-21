const express = require("express");
const router = express.Router();

const {
  getSeatLayout,
  reserveSeats,
  bookSeats,
} = require("../Controllers/Seat");
const { Auth } = require("../Middleware/Auth");

router.get("/showtime/:id", getSeatLayout); // its working

router.post("/showtime/reserve", Auth, reserveSeats); // its working

router.post("/showtime/book", Auth, bookSeats); //  its working

module.exports = router;
