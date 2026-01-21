const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const { globalLimiter } = require("./Middleware/globalLimiter");

// routes
const movieRoutes = require("./Route/movie");
const userRoutes = require("./Route/user");
const venueRoutes = require("./Route/venue");
const seatRoutes = require("./Route/Seat");
const orderRoutes = require("./Route/order");

const app = express();
app.use(globalLimiter);
app.use(helmet());
app.use(express.json({ limit: "10kb" })); // ✅ add limit
app.use(cookieParser());
app.use(morgan("dev"));

// latency middleware (keep)
app.use((req, res, next) => {
  const start = process.hrtime();

  res.on("finish", () => {
    const diff = process.hrtime(start);
    const ms = diff[0] * 1000 + diff[1] / 1e6;
    console.log(
      `[LATENCY] ${req.method} ${req.originalUrl} -> ${
        res.statusCode
      } (${ms.toFixed(2)} ms)`
    );
  });

  const originalEnd = res.end;
  res.end = function (...args) {
    const diff = process.hrtime(start);
    const ms = diff[0] * 1000 + diff[1] / 1e6;
    res.setHeader("X-Response-Time", `${ms.toFixed(2)} ms`);
    originalEnd.apply(res, args);
  };

  next();
});

// Attach routes
app.use("/movie", movieRoutes);
app.use("/user", userRoutes);
app.use("/venue", venueRoutes);
app.use("/seat", seatRoutes);
app.use("/order", orderRoutes);

app.get("/", (req, res) => {
  return res.json({
    success: true,
    message: "Your server is up and running....",
  });
});

module.exports = app;
