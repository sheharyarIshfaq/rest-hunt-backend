const mongoose = require("mongoose");

// Create a schema for favourites
const favouriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
  },
  { timestamps: true }
);

// Create a model for favourites
const Favourite = mongoose.model("Favourite", favouriteSchema);

module.exports = Favourite;
