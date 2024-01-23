const mongoose = require("mongoose");
const User = require("../models/user-model");
const bcrypt = require("bcrypt");
const USER_ROLE = require("../types/user-role");

// Get the MONGO_URI from the environment variables
const { MONGO_URI } = process.env;

exports.connect = () => {
  // Connecting to the database
  mongoose
    .connect(MONGO_URI)
    .then(async () => {
      // If connection is successful then log a message
      console.log("Successfully connected to database");
      const user = await User.findOne({ email: process.env.ADMIN_EMAIL });
      if (!user) {
        const hashedPassword = await bcrypt.hash(
          process.env.ADMIN_PASSWORD,
          10
        );
        await User.create({
          name: "Admin",
          email: process.env.ADMIN_EMAIL,
          password: hashedPassword,
          phoneNumber: "1234567890",
          location: "Rawalpindi",
          role: USER_ROLE.ADMIN,
        });
      }
    })
    .catch((error) => {
      // If connection fails then log a message and exit the process
      console.log("database connection failed. exiting now...");
      console.error(error);
      process.exit(1);
    });
};
