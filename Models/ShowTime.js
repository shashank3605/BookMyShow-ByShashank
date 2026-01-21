const mongoose = require("mongoose");
const showTimeSchema = new mongoose.Schema(
  {
    timing: {
      type: String,
      required: true,
    },
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "venue",  // have make changes here, Venue is earier
      required: true,
    },
    seats: [{ type: mongoose.Schema.Types.ObjectId, ref: "Seat" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("showTime", showTimeSchema);
