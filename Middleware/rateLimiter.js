const rateLimit = require("express-rate-limit");

// 🔐 STRICT limiter for login / OTP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // ❗ max 10 attempts per IP per window
  standardHeaders: true, // send RateLimit headers
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login/OTP attempts. Please try again after 15 minutes.",
  },
});

module.exports = { authLimiter };
