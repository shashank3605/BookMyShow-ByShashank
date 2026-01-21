const cron = require("node-cron");
const Seat = require("../Models/Seat");

cron.schedule("*/1 * * * *", async () => {
  // every 1 minute
  try {
    const now = new Date();

    const result = await Seat.updateMany(
      {
        isReserved: true,
        isBooked: false,
        reservedUntil: { $ne: null, $lte: now },
      },
      {
        $set: { isAvailable: true, isReserved: false },
        $unset: { reservedUntil: "", reservedBy: "" },
      }
    );

    // optional log
    // console.log("Released seats:", result.modifiedCount);
  } catch (err) {
    console.error("releaseExpiredSeats error:", err);
  }
});
