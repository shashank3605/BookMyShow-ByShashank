const User = require("../Models/User");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// exports.Auth = async (req, res, next) => {
//   try {
//     console.log("BEFORE ToKEN EXTRACTION");
//     const headerToken = req.headers.authorization?.startsWith("Bearer ")
//       ? req.headers.authorization.split(" ")[1]
//       : null;
//     // const token = req.cookies?.token || req.body?.token || headerToken;
//     const token = (
//       req.cookies?.token ||
//       req.body?.token ||
//       headerToken ||
//       ""
//     ).trim();
//     console.log("token first/last:", token.slice(0, 10), token.slice(-10));

//     console.log("token in auth", token);
//     console.log("token length", token?.length);

//     if (!token) {
//       return res.status(401).json({
//         success: false,
//         message: "Token is missing",
//       });
//     }
//     //verify the token
//     try {
//       console.log("JWT_SECRET exists?", !!process.env.JWT_SECRET);
//       console.log("JWT_SECRET length:", process.env.JWT_SECRET?.length);

//       const decode = jwt.verify(token, process.env.JWT_SECRET);
//       console.log("decode in Auth:", decode);
//       req.user = decode;
//     } catch (error) {
//       return res.status(401).json({
//         success: false,
//         message: "token is invalid",
//       });
//     }
//     next();
//   } catch (error) {
//     return res.status(401).json({
//       success: false,
//       message: "Something went wrong while validating the token",
//     });
//   }
// };

exports.Auth = async (req, res, next) => {
  try {
    console.log("BEFORE TOKEN EXTRACTION");

    const headerToken = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null;

    const cookieToken = req.cookies?.token;
    const bodyToken = req.body?.token;

    const token = (cookieToken || bodyToken || headerToken || "").trim();

    console.log(
      "token source:",
      cookieToken
        ? "cookie"
        : bodyToken
        ? "body"
        : headerToken
        ? "header"
        : "none"
    );
    console.log("token length:", token?.length);

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Token is missing" });
    }

    console.log("JWT_SECRET exists?", !!process.env.JWT_SECRET);
    console.log("JWT_SECRET length:", process.env.JWT_SECRET?.length);

    try {
      const decode = jwt.verify(token, process.env.JWT_SECRET);
      console.log("decode in Auth:", decode);
      req.user = decode;
      return next();
    } catch (error) {
      console.log("jwt.verify error:", error.name, error.message);
      return res
        .status(401)
        .json({ success: false, message: "token is invalid" });
    }
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Something went wrong while validating the token",
    });
  }
};

exports.isAdmin = (req, res, next) => {
  if (!req.user || req.user.isAdmin !== true) {
    return res.status(403).json({
      success: false,
      message: "Admin access only",
    });
  }
  next();
};
