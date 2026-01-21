const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema(
  {
    seatNumber: {
      type: String,
      required: true,
    },
    // status: {
    //   type: String,
    //   enum: ["AVAILABLE", "LOCKED", "BOOKED"],
    //   default: "AVAILABLE",
    // },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isReserved: {
      type: Boolean,
      default: false,
    },
    isBooked: {
      type: Boolean,
      default: false,
    },
    price: {
      type: Number,
      required: true,
    },
    showTime: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShowTime",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Seat", seatSchema);
