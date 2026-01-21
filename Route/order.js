const express = require("express");
const router = express.Router();
const { getOrders } = require("../Controllers/Order");
const { Auth } = require("../Middleware/Auth");

router.get("/getOrders", Auth, getOrders); // working

module.exports = router;
