const ShowTime = require("../Models/ShowTime");
const mongoose = require("mongoose");
const Seat = require("../Models/Seat");
const Order = require("../Models/Order");

const { startSession } = mongoose;

// Function to generate and save seats if they don't already exist
// const generateAndSaveSeats = async (showTimeId) => {
//   const rows = ["A", "B", "C", "D", "E"];
//   const seatsPerRow = 10;
//   const seats = [];

//   rows.forEach((row) => {
//     for (let seatNumber = 1; seatNumber <= seatsPerRow; seatNumber++) {
//       const seat = {
//         seatNumber: `${row}${seatNumber}`,
//         isAvailable: true,
//         isReserved: false,
//         isBooked: false,
//         price: 250,
//         showTime: showTimeId, // Use the correct field name
//       };
//       seats.push(seat);
//     }
//   });
//   const createdSeats = await Seat.insertMany(seats);
//   const seatIds = createdSeats.map((s) => s._id);
//   await ShowTime.findByIdAndUpdate(showTimeId, { $set: { seats: seatIds } });
// };

const generateAndSaveSeats = async (showTimeId) => {
  // If seats already exist for this showtime, do nothing
  const existing = await Seat.countDocuments({ showTime: showTimeId });
  if (existing > 0) return;

  const rows = ["A", "B", "C", "D", "E"];
  const seatsPerRow = 10;
  const seats = [];

  rows.forEach((row) => {
    for (let seatNumber = 1; seatNumber <= seatsPerRow; seatNumber++) {
      seats.push({
        seatNumber: `${row}${seatNumber}`,
        isAvailable: true,
        isReserved: false,
        isBooked: false,
        price: 250,
        showTime: showTimeId,
        reservedUntil: null,
        reservedBy: null,
      });
    }
  });

  const createdSeats = await Seat.insertMany(seats);
  const seatIds = createdSeats.map((s) => s._id);

  await ShowTime.findByIdAndUpdate(showTimeId, { $set: { seats: seatIds } });
};

// Your main function
// exports.getSeatLayout = async (req, res) => {
//   try {
//     const showtimeID = req.params.id;
//     console.log(showtimeID);

//     // Generate and save seats if they don't exist
//     await generateAndSaveSeats(showtimeID);

//     // Fetch the showtime and preload the Seats associated with it
//     const showTime = await ShowTime.findById(showtimeID).populate("seats");

//     if (!showTime) {
//       return res.status(404).json({ error: "ShowTime not found" });
//     }

//     // Send back the flat seat data (the frontend can make a matrix)
//     console.log("Final showTime object:", showTime);

//     res.status(200).json({
//       showtime: showTime.timing,
//       movie: showTime.movie,
//       venue: showTime.venue,
//       seats: showTime.seats, // Just return the flat seat list
//     });
//   } catch (error) {
//     res.status(500).json({ error: "Failed to fetch Seat layout" });
//   }
// };

exports.getSeatLayout = async (req, res) => {
  try {
    const showtimeID = req.params.id;
    await generateAndSaveSeats(showtimeID);

    const showTime = await ShowTime.findById(showtimeID).populate("seats");
    if (!showTime) return res.status(404).json({ error: "ShowTime not found" });

    const now = new Date();

    const seats = showTime.seats.map((s) => {
      const seat = s.toObject(); // always plain object

      if (
        seat.isReserved &&
        !seat.isBooked &&
        seat.reservedUntil &&
        seat.reservedUntil <= now
      ) {
        seat.isAvailable = true;
        seat.isReserved = false;
        seat.reservedUntil = null;
        seat.reservedBy = null;
      }

      return seat;
    });

    res.status(200).json({
      showtime: showTime.timing,
      movie: showTime.movie,
      venue: showTime.venue,
      seats,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch Seat layout" });
  }
};

// exports.reserveSeats = async (req, res) => {
//   const { showTime, SeatIDs } = req.body;
//   console.log(showTime, SeatIDs);

//   const session = await startSession();
//   session.startTransaction();

//   try {
//     // Fetch the Seats with a lock
//     const Seats = await Seat.find({
//       _id: { $in: SeatIDs },
//       showTime: showTime,
//     })
//       .session(session)
//       .exec();

//     // Check if all Seats are available and not already reserved or booked
//     for (const Seat of Seats) {
//       if (!Seat.isAvailable || Seat.isReserved || Seat.isBooked) {
//         throw new Error("One or more Seats are not available for reservation.");
//       }
//     }

//     // Reserve the Seats
//     for (const Seat of Seats) {
//       Seat.isReserved = true;
//       Seat.isAvailable = false;
//       await Seat.save({ session });
//     }

//     // Commit the transaction
//     await session.commitTransaction();
//     session.endSession();

//     res.status(200).json({ message: "Seats reserved successfully!" });
//   } catch (error) {
//     // Rollback the transaction if any error occurs
//     await session.abortTransaction();
//     session.endSession();

//     res.status(400).json({ error: error.message });
//   }
// };

exports.reserveSeats = async (req, res) => {
  const { showTime, SeatIDs } = req.body;
  // const userId = req.user.id;
  const userId = req.user?.id || req.user?._id;

  const now = new Date();
  const reservedUntil = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes lock

  try {
    const result = await Seat.updateMany(
      {
        _id: { $in: SeatIDs },
        showTime,
        isAvailable: true,
        isReserved: false,
        isBooked: false,
      },
      {
        $set: {
          isAvailable: false,
          isReserved: true,
          reservedUntil,
          reservedBy: userId,
        },
      }
    );

    // If any seat failed to reserve → someone else took it
    if (result.modifiedCount !== SeatIDs.length) {
      await Seat.updateMany(
        { _id: { $in: SeatIDs }, reservedBy: userId, reservedUntil },
        {
          $set: { isAvailable: true, isReserved: false },
          $unset: { reservedUntil: "", reservedBy: "" },
        }
      );
      return res.status(409).json({
        message: "One or more seats were already reserved",
      });
    }

    res.status(200).json({
      message: "Seats reserved successfully",
      reservedUntil,
    });
  } catch (err) {
    res.status(500).json({ error: "Seat reservation failed" });
  }
};

// exports.bookSeats = async (req, res) => {
//   const { showTime, SeatIDs } = req.body;
//   // const userId = req.body?.userId

//   //req.user must exist
//   const userId = req.user?.id || req.user?._id;
//   if (!userId) {
//     return res
//       .status(401)
//       .json({ error: "Unauthorized: token missing/invalid" });
//   }

//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const seats = await Seat.find({
//       _id: { $in: SeatIDs },
//       showTime: showTime,
//     }).session(session);
//     console.log(seats);

//     //prevent false success
//     if (seats.length !== SeatIDs.length) {
//       throw new Error("Some seats not found for this showTime.");
//     }

//     // must be reserved first
//     for (const seat of seats) {
//       if (!seat.isReserved || seat.isBooked) {
//         throw new Error("One or more seats are not available for booking.");
//       }
//     }

//     // update docs correctly
//     for (const seat of seats) {
//       seat.isBooked = true;
//       seat.isReserved = false;
//       seat.isAvailable = false;
//       await seat.save({ session }); // seat.save
//     }

//     const totalPrice = seats.reduce((sum, seat) => sum + (seat.price || 0), 0);

//     // Order field names should match your Order schema
//     const order = await Order.create(
//       [
//         {
//           user: userId,
//           showTime: showTime,
//           seats: SeatIDs,
//           totalPrice,
//           paymentStatus: "SUCCESS",
//         },
//       ],
//       { session }
//     );

//     await session.commitTransaction();
//     session.endSession();

//     return res.status(200).json({
//       message: "Seats booked successfully!",
//       orderId: order[0]._id,
//       totalPrice,
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     return res.status(400).json({ error: error.message });
//   }
// };

// ✅ Fully corrected: BOOK seats only if (1) user owns the reservation, (2) reservation not expired,
// and (3) seats are reserved (not booked). Also books seats + creates order atomically.

exports.bookSeats = async (req, res) => {
  const { showTime, SeatIDs } = req.body;

  const userId = req.user?.id || req.user?._id;
  if (!userId) {
    return res
      .status(401)
      .json({ success: false, error: "Unauthorized: token missing/invalid" });
  }

  // Basic validation
  if (!showTime || !Array.isArray(SeatIDs) || SeatIDs.length === 0) {
    return res.status(400).json({
      success: false,
      error: "showTime and SeatIDs (non-empty array) are required",
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const now = new Date();

    // Fetch seats inside txn
    const seats = await Seat.find({
      _id: { $in: SeatIDs },
      showTime: showTime,
    }).session(session);

    if (seats.length !== SeatIDs.length) {
      throw new Error("Some seats not found for this showTime.");
    }

    for (const seat of seats) {
      // Already booked?
      if (seat.isBooked) {
        throw new Error(`Seat ${seat.seatNumber} is already booked.`);
      }

      if (!seat.isReserved) {
        throw new Error(`Seat ${seat.seatNumber} is not reserved.`);
      }

      if (!seat.reservedUntil || !seat.reservedBy) {
        throw new Error(`Seat ${seat.seatNumber} reservation is invalid.`);
      }

      if (String(seat.reservedBy) !== String(userId)) {
        throw new Error(`Seat ${seat.seatNumber} is reserved by another user.`);
      }

      if (seat.reservedUntil <= now) {
        throw new Error(`Seat ${seat.seatNumber} reservation expired.`);
      }
    }

    const bookResult = await Seat.updateMany(
      {
        _id: { $in: SeatIDs },
        showTime: showTime,
        isReserved: true,
        isBooked: false,
        reservedBy: userId,
        reservedUntil: { $gt: now },
      },
      {
        $set: {
          isBooked: true,
          isAvailable: false,
          isReserved: false,
        },
        $unset: {
          reservedUntil: "",
          reservedBy: "",
        },
      },
      { session }
    );

    // If modifiedCount != SeatIDs.length => some seat changed after we fetched (race/expiry)
    if (bookResult.modifiedCount !== SeatIDs.length) {
      throw new Error(
        "Booking failed: seats expired or changed. Please reselect seats."
      );
    }

    const totalPrice = seats.reduce((sum, seat) => sum + (seat.price || 0), 0);

    const [order] = await Order.create(
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
      success: true,
      message: "Seats booked successfully!",
      orderId: order._id,
      totalPrice,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};
