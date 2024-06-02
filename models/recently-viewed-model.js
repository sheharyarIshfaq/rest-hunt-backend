const mongoose = require("mongoose");

// Create a schema for recently viewed
const recentlyViewedSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
  },
  { timestamps: true }
);

// Create a model for recently viewed
const RecentlyViewed = mongoose.model("RecentlyViewed", recentlyViewedSchema);

module.exports = RecentlyViewed;
