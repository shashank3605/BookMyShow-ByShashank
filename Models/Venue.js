// Import the Mongoose library
const mongoose = require("mongoose");

// Define the venue schema using the Mongoose Schema constructor
const venueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    Movie: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Movie",
      },
    ],
    showTime: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "showTime",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("venue", venueSchema);
