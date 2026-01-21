const mongoose = require("mongoose");

const Moviechema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 50,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, // in hours
      required: true,
    },
    poster: {
      type: String, // image URL
    },
    // just added
    venue: [{ type: mongoose.Schema.Types.ObjectId, ref: "venue" }],
    showTime: [{ type: mongoose.Schema.Types.ObjectId, ref: "showTime" }],
  },

  { timestamps: true }
);

module.exports = mongoose.model("Movie", Moviechema);
