const express = require("express");
const app = express();
const morgan = require("morgan");
const movieRoutes = require("./Route/movie");
const userRoutes = require("./Route/user");
const venueRoutes = require("./Route/venue");
const seatRoutes = require("./Route/Seat");
const orderRoutes = require("./Route/order");
const database = require("./config/database");
const helmet = require("helmet");
require("./Utility/releaseExpiredSeats");
const { cloudinaryConnect } = require("./config/cloudinary");
const fileUpload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const { globalLimiter } = require("./Middleware/globalLimiter");

const dotenv = require("dotenv");
dotenv.config();

const PORT = process.env.PORT || 4000;
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));
app.use(globalLimiter);

app.use((req, res, next) => {
  const start = process.hrtime();

  res.on("finish", () => {
    const diff = process.hrtime(start);
    const ms = diff[0] * 1000 + diff[1] / 1e6;

    // ❗ can't set headers here because response is already finished
    console.log(
      `[LATENCY] ${req.method} ${req.originalUrl} -> ${
        res.statusCode
      } (${ms.toFixed(2)} ms)`
    );
  });

  // set header by wrapping res.end
  const originalEnd = res.end;
  res.end = function (...args) {
    const diff = process.hrtime(start);
    const ms = diff[0] * 1000 + diff[1] / 1e6;
    res.setHeader("X-Response-Time", `${ms.toFixed(2)} ms`);
    originalEnd.apply(res, args);
  };

  next();
});

database.connect();
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);
//cloudinary connection
cloudinaryConnect();

//Attach routes
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

app.listen(PORT, () => {
  console.log(`App is running at ${PORT}`);
});

// jest testing
// const dotenv = require("dotenv");
// dotenv.config();

// const app = require("./app");
// const database = require("./config/database");
// const { cloudinaryConnect } = require("./config/cloudinary");
// const fileUpload = require("express-fileupload");

// const PORT = process.env.PORT || 4000;

// // DB connect
// database.connect();

// // file upload middleware (only needed in real server)
// app.use(
//   fileUpload({
//     useTempFiles: true,
//     tempFileDir: "/tmp/",
//   })
// );

// // cloudinary connect
// cloudinaryConnect();

// app.listen(PORT, () => {
//   console.log(`App is running at ${PORT}`);
// });
