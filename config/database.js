const mongoose = require("mongoose");

require("dotenv").config();

exports.connect = () => {
  const mongoURL = process.env.MONGODB_URL;

  if (!mongoURL) {
    console.error("MONGODB_URL is not defined in .env");
    process.exit(1);
  }

  mongoose
    .connect(mongoURL)
    .then(() => console.log("DB Connected Successfully"))
    .catch((error) => {
      console.log("DB Connection Failed");
      console.error(error);
      process.exit(1);
    });
};
