const mongoose = require("mongoose");
const USER_ROLE = require("../types/user-role");
const USER_GENDER = require("../types/user-gender");

// Create a schema for users
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
    },
    gender: {
      type: String,
      enum: [USER_GENDER.MALE, USER_GENDER.FEMALE],
      default: USER_GENDER.MALE,
    },
    role: {
      type: String,
      enum: [USER_ROLE.ADMIN, USER_ROLE.USER, USER_ROLE.PROPERTY_OWNER],
      default: USER_ROLE.USER,
    },
    profilePicture: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Create a model for users
const User = mongoose.model("User", userSchema);

module.exports = User;
