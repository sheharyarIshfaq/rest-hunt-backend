const Property = require("../models/property-model");
const RecentlyViewed = require("../models/recently-viewed-model");
const User = require("../models/user-model");

// Add a property to the recently viewed list
const addToRecentlyViewed = async (req, res) => {
  try {
    const user = await User.findById(req?.body?.userId);

    const propertyId = req.body.propertyId;

    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const recentlyViewed = await RecentlyViewed.findOne({
      user: user?._id,
      property: propertyId,
    });

    //if it is recently viewed and createdAt is less than 1 day
    if (
      recentlyViewed &&
      recentlyViewed.createdAt.getTime() + 1 * 24 * 60 * 60 * 1000 > Date.now()
    ) {
      return res.status(400).json({ message: "Property already added" });
    }

    await RecentlyViewed.create({
      user: user?._id,
      property: property._id,
    });

    res.status(201).json({ message: "Property added to recently viewed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { addToRecentlyViewed };
