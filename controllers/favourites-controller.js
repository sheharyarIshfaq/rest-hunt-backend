const Favourite = require("../models/favourites-model");
const Property = require("../models/property-model");
const User = require("../models/user-model");

const addToFavourites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const propertyId = req.body.propertyId;

    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const favourite = await Favourite.create({
      user: user._id,
      property: property._id,
    });

    res.status(201).json({
      message: "Property added to favourites",
      favourite,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const removeFromFavourites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const propertyId = req.body.propertyId;

    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const favourite = await Favourite.findOneAndDelete({
      user: user._id,
      property: property._id,
    });

    if (!favourite) {
      return res.status(404).json({ message: "Favourite not found" });
    }

    res.status(200).json({
      message: "Property removed from favourites",
      favourite,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getFavourites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const favourites = await Favourite.find({ user: user._id });

    res.status(200).json({
      message: "Favourites fetched successfully",
      favourites,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  addToFavourites,
  removeFromFavourites,
  getFavourites,
};
