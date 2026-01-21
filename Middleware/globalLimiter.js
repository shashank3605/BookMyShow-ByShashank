const rateLimit = require("express-rate-limit");

const globalLimiter = rateLimit({
  //   windowMs: 15 * 60 * 1000, // 15 min
  //   max: 300, // ✅ gentle: 300 requests / 15 min / IP
  windowMs: 60 * 1000,
  max: 3,

  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});
module.exports = { globalLimiter };
