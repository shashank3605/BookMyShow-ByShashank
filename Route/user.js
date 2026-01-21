const express = require("express");
const router = express.Router();
const { signup, login, sendOtp } = require("../Controllers/user");
const { Auth, isAdmin } = require("../Middleware/Auth");
const { authLimiter } = require("../Middleware/rateLimiter");

router.post("/signup", signup); // working

router.post("/login", authLimiter, Auth, login); // working

router.post("/sendOtp", authLimiter, sendOtp); // working

module.exports = router;
