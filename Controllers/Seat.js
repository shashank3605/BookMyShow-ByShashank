const ShowTime = require("../Models/ShowTime");
const mongoose = require("mongoose");
const Seat = require("../Models/Seat");
const Order = require("../Models/Order");

const { startSession } = mongoose;

// Function to generate and save seats if they don't already exist
const generateAndSaveSeats = async (showTimeId) => {
  const rows = ["A", "B", "C", "D", "E"];
  const seatsPerRow = 10;
  const seats = [];

  rows.forEach((row) => {
    for (let seatNumber = 1; seatNumber <= seatsPerRow; seatNumber++) {
      const seat = {
        seatNumber: `${row}${seatNumber}`,
        isAvailable: true,
        isReserved: false,
        isBooked: false,
        price: 250,
        showTime: showTimeId, // Use the correct field name
      };
      seats.push(seat);
    }
  });
  const createdSeats = await Seat.insertMany(seats);
  const seatIds = createdSeats.map((s) => s._id);
  await ShowTime.findByIdAndUpdate(showTimeId, { $set: { seats: seatIds } });
};

// Your main function
exports.getSeatLayout = async (req, res) => {
  try {
    const showtimeID = req.params.id;
    console.log(showtimeID);

    // Generate and save seats if they don't exist
    await generateAndSaveSeats(showtimeID);

    // Fetch the showtime and preload the Seats associated with it
    const showTime = await ShowTime.findById(showtimeID).populate("seats");

    if (!showTime) {
      return res.status(404).json({ error: "ShowTime not found" });
    }

    // Send back the flat seat data (the frontend can make a matrix)
    console.log("Final showTime object:", showTime);

    res.status(200).json({
      showtime: showTime.timing,
      movie: showTime.movie,
      venue: showTime.venue,
      seats: showTime.seats, // Just return the flat seat list
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch Seat layout" });
  }
};

exports.reserveSeats = async (req, res) => {
  const { showTime, SeatIDs } = req.body;
  console.log(showTime, SeatIDs);

  const session = await startSession();
  session.startTransaction();

  try {
    // Fetch the Seats with a lock
    const Seats = await Seat.find({
      _id: { $in: SeatIDs },
      showTime: showTime,
    })
      .session(session)
      .exec();

    // Check if all Seats are available and not already reserved or booked
    for (const Seat of Seats) {
      if (!Seat.isAvailable || Seat.isReserved || Seat.isBooked) {
        throw new Error("One or more Seats are not available for reservation.");
      }
    }

    // Reserve the Seats
    for (const Seat of Seats) {
      Seat.isReserved = true;
      Seat.isAvailable = false;
      await Seat.save({ session });
    }

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: "Seats reserved successfully!" });
  } catch (error) {
    // Rollback the transaction if any error occurs
    await session.abortTransaction();
    session.endSession();

    res.status(400).json({ error: error.message });
  }
};

exports.bookSeats = async (req, res) => {
  const { showTime, SeatIDs } = req.body;
  // const userId = req.body?.userId

  //req.user must exist
  const userId = req.user?.id || req.user?._id;
  if (!userId) {
    return res
      .status(401)
      .json({ error: "Unauthorized: token missing/invalid" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const seats = await Seat.find({
      _id: { $in: SeatIDs },
      showTime: showTime,
    }).session(session);
    console.log(seats);

    //prevent false success
    if (seats.length !== SeatIDs.length) {
      throw new Error("Some seats not found for this showTime.");
    }

    // must be reserved first
    for (const seat of seats) {
      if (!seat.isReserved || seat.isBooked) {
        throw new Error("One or more seats are not available for booking.");
      }
    }

    // update docs correctly
    for (const seat of seats) {
      seat.isBooked = true;
      seat.isReserved = false;
      seat.isAvailable = false;
      await seat.save({ session }); // seat.save
    }

    const totalPrice = seats.reduce((sum, seat) => sum + (seat.price || 0), 0);

    // Order field names should match your Order schema
    const order = await Order.create(
      [
        {
          user: userId,
          showTime: showTime,
          seats: SeatIDs,
          totalPrice,
          paymentStatus: "SUCCESS",
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: "Seats booked successfully!",
      orderId: order[0]._id,
      totalPrice,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(400).json({ error: error.message });
  }
};
