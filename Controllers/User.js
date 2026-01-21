const mongoose = require("mongoose");
const User = require("../Models/User");
const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const mailSender = require("../Utility/mailSender");
exports.signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, isAdmin, phoneNumber, otp } =
      req.body;
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !phoneNumber ||
      !otp
    ) {
      return res.status(403).send({
        success: false,
        message: "Please enter all the required data.",
      });
    }

    const existingUser = await User.findOne({ email, isVerified: true });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exist. Please sign in to continue. ",
      });
    }

    const userSendOtp = await User.findOne({ email, isVerified: false });

    if (!userSendOtp || !userSendOtp.otp) {
      return res.status(400).json({
        success: false,
        message: "The OTP not found",
      });
    }

    if (!userSendOtp.otpExpiresAt || userSendOtp.otpExpiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request again.",
      });
    }

    if (String(userSendOtp.otp) !== String(otp)) {
      return res.status(400).json({
        success: false,
        message: "Kindly enter correct otp",
      });
    }
    // const response= await User.findOne({otp}).sort({createdAt:-1).limit(1)
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.findOneAndUpdate(
      { email, isVerified: false },
      {
        firstName,
        lastName,
        password: hashedPassword,
        phoneNumber,
        isVerified: true,
        otp: undefined,
        otpExpiresAt: undefined,
        isAdmin,
      },
      { new: true }
    );

    // userSendOtp.firstName = firstName;
    // userSendOtp.lastName = lastName;
    // userSendOtp.password = hashedPassword;
    // userSendOtp.phoneNumber = phoneNumber;
    // userSendOtp.isVerified = true;

    // await userSendOtp.save();

    return res.status(200).json({
      success: true,
      user,
      message: "User registered successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "User cannot be registered. Please try again.",
    });
  }
};

exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const checkExistingEmail = await User.findOne({ email, isVerified: true });

    if (checkExistingEmail) {
      return res.status(400).json({
        success: false,
        message: "This email already exist",
      });
    }

    var otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    let result = await User.findOne({ otp: otp });
    console.log("otp is generated");
    console.log("OTP", otp);

    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      result = await User.findOne({ otp: otp });
    }

    await User.findOneAndUpdate(
      { email },
      {
        otp,
        otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
        isVerified: false,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    await mailSender(
      email,
      `<h2>Your OTP is</h2><h1>${otp}</h1><p>This OTP is valid for 5 minutes.</p>`
    );

    res.status(200).json({
      success: true,
      message: `OTP Sent Successfully`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: `Please Fill up All the Required Fields`,
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: `User is not Registered with Us Please SignUp to Continue`,
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify OTP first",
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: `User is not Registered with Us Please SignUp to Continue`,
      });
    }

    // Generate JWT token and Compare Password
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const payload = {
        id: user._id,
        email: user.email,
        isAdmin: user.isAdmin,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });
      console.log("token:", token);

      // user.token = token;
      user.password = undefined;

      const Option = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      };

      res.cookie("token", token, Option).status(200).json({
        success: true,
        token,
        user,
        message: `User Login Success`,
      });
    } else {
      return res.status(401).json({
        success: false,
        message: `Password is incorrect`,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: `Login Failure Please Try Again`,
    });
  }
};
