const Order = require("../Models/Order");
const Seat = require("../Models/Seat");

exports.getOrders = async (req, res) => {
  try {
    // Extract the user from the request (assuming user is added to the request by middleware)
    const user = req.user;
    const userId = user._id;
    console.log(userId);

    // Fetch orders for the user, including their associated seats
    const orders = await Order.find({ userId }).populate("seats").exec();

    if (!orders.length) {
      return res
        .status(404)
        .json({ error: "No orders found for the given user." });
    }

    // Format the response
    const orderResponses = orders.map((order) => {
      const seatNumbers = order.seats.map((seat) => seat.seatNumber);
      return {
        id: order._id,
        totalPrice: order.totalPrice,
        seats: seatNumbers,
      };
    });

    res.status(200).json({ orders: orderResponses });
  } catch (error) {
    res.status(500).json({ error: "An error occurred while fetching orders." });
  }
};
