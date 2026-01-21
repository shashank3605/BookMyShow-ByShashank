const generateSeatsForShowTime = (showtimeId) => {
  const rows = ["A", "B", "C", "D", "E"]; // Example rows
  const seatsPerRow = 10; // Example: 10 seats per row

  const seats = [];

  rows.forEach((row) => {
    for (let seatNumber = 1; seatNumber <= seatsPerRow; seatNumber++) {
      const seat = {
        seatNumber: `${row}${seatNumber}`, // e.g., A1, A2, B1, etc.
        isAvailable: true,
        isReserved: false,
        isBooked: false,
        price: 250,
        showtimeId: showtimeId,
      };
      seats.push(seat);
    }
  });

  return seats;
  console.log(seats);
};

const formatShowTime = (date) => {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`; // e.g., "16:38"
};

const createSeatMatrix = (seats) => {
  const seatMatrix = {};

  seats.forEach((seat) => {
    const row = seat.seatNumber.charAt(0); // The first character represents the row
    if (!seatMatrix[row]) {
      seatMatrix[row] = [];
    }
    seatMatrix[row].push({
      seatNumber: seat.seatNumber,
      isReserved: seat.isReserved,
      isBooked: seat.isBooked,
      isAvailable: seat.isAvailable,
      price: seat.price,
    });
  });

  return seatMatrix;
};

const unReserveSeats = async (seatIDs, duration) => {
  setTimeout(async () => {
    const session = await initializers.Db.startSession();
    session.startTransaction();
    try {
      for (const seatID of seatIDs) {
        const seat = await initializers.Db.collection("seats").findOne(
          { _id: seatID, isReserved: true, isBooked: false },
          { session }
        );
        if (seat) {
          await initializers.Db.collection("seats").updateOne(
            { _id: seatID },
            {
              $set: { isReserved: false, isAvailable: true },
            },
            { session }
          );
        }
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      console.error(error);
    } finally {
      session.endSession();
    }
  }, duration);
};

// const twilio = require("twilio");

// const sendOtp = async (phone) => {
//   const accountSID = process.env.TWILIO_ACCOUNT_SID;
//   const authToken = process.env.TWILIO_AUTH_TOKEN;
//   const serviceSid = process.env.TWILIO_SERVICE_SID;

//   const client = twilio(accountSID, authToken);
//   const to = `+91${phone}`;

//   try {
//     const verification = await client.verify
//       .services(serviceSid)
//       .verifications.create({ to, channel: "sms" });
//     return verification.sid;
//   } catch (error) {
//     throw new Error("Failed to send OTP");
//   }
// };

// const checkOtp = async (phone, code) => {
//   const accountSID = process.env.TWILIO_ACCOUNT_SID;
//   const authToken = process.env.TWILIO_AUTH_TOKEN;
//   const serviceSid = process.env.TWILIO_SERVICE_SID;

//   const client = twilio(accountSID, authToken);
//   const to = `+91${phone}`;

//   try {
//     const verificationCheck = await client.verify
//       .services(serviceSid)
//       .verificationChecks.create({ to, code });
//     if (verificationCheck.status === "approved") {
//       return true;
//     } else {
//       throw new Error("Invalid OTP");
//     }
//   } catch (error) {
//     throw new Error("OTP verification failed");
//   }
// };

// const AWS = require("aws-sdk");
// const s3 = new AWS.S3();

// const saveFile = async (file, fileName) => {
//   const bucketName = process.env.AWS_BUCKET_NAME;

//   const params = {
//     Bucket: bucketName,
//     Key: fileName,
//     Body: file.buffer,
//     ContentType: file.mimetype,
//   };

//   try {
//     const data = await s3.upload(params).promise();
//     return data.Location; // This is the URL of the uploaded file
//   } catch (error) {
//     throw new Error("Failed to upload file");
//   }
// };

const cloudinary = require("cloudinary").v2;

exports.uploadImageToCloudinary = async (file, folder, height, quality) => {
  const options = { folder };
  if (height) {
    options.height = height;
  }
  if (quality) {
    options.quality = quality;
  }
  options.resource_type = "auto";

  return await cloudinary.uploader.upload(file.tempFilePath, options);
};
