const { default: mongoose } = require("mongoose");
const { uploadFile, deleteFile, getSignedUrlFromKey } = require("../config/s3");
const Property = require("../models/property-model");
const User = require("../models/user-model");
const RecentlyViewed = require("../models/recently-viewed-model");
const Review = require("../models/review-model");

const createProperty = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    const {
      name,
      address,
      location,
      nearbySiteName,
      propertyType,
      propertySize,
      propertySizeUnit,
    } = req.body;

    if (
      !(
        name &&
        address &&
        location &&
        nearbySiteName &&
        propertyType &&
        propertySize &&
        propertySizeUnit
      )
    ) {
      res.status(400).send({ error: "All input is required" });
    }

    const newProperty = await Property.create({
      name,
      address,
      location,
      nearbySiteName,
      propertyType,
      propertySize,
      propertySizeUnit,
      owner: user._id,
    });

    res.status(201).json({
      message: "Property created successfully",
      data: newProperty,
    });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

const getProperties = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 10;
    const search = req.query.search || "";

    const skip = (page - 1) * perPage;

    let query = {
      status: "Active",
      rooms: { $exists: true, $not: { $size: 0 } },
    };

    if (search.trim() !== "") {
      query = {
        ...query,
        $or: [
          { name: { $regex: search, $options: "i" } },
          { address: { $regex: search, $options: "i" } },
          { nearbySiteName: { $regex: search, $options: "i" } },
        ],
      };
    }

    const properties = await Property.find(query)
      .skip(skip)
      .limit(perPage)
      .sort({ createdAt: -1 });

    let updatedProperties = properties.map(async (property) => {
      let leastPrice = Number.MAX_VALUE;
      let leastPriceUnit;
      for (let i = 0; i < property?.rooms?.length; i++) {
        if (property.rooms[i]?.rentAmount < leastPrice) {
          leastPrice = property.rooms[i]?.rentAmount;
          leastPriceUnit = property.rooms[i]?.rentAmountUnit;
        }
        if (property?.rooms[i]?.images.length === 0) {
          continue;
        }
        for (let j = 0; j < property?.rooms[i]?.images.length; j++) {
          property.rooms[i].images[j] = await getSignedUrlFromKey(
            property.rooms[i].images[j]
          );
        }
      }
      return {
        ...property._doc,
        image:
          property?.rooms[0]?.images[0] ||
          (await getSignedUrlFromKey("no-image-found.png")),
        leastPrice: leastPriceUnit ? leastPrice : 0,
        leastPriceUnit,
      };
    });

    updatedProperties = await Promise.all(updatedProperties);

    const totalCount = await Property.countDocuments(query);
    const totalPages = Math.ceil(totalCount / perPage);

    res.status(200).json({
      data: updatedProperties,
      totalPages,
      currentPage: page,
      totalCount,
    });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

const getOwnerProperties = async (req, res) => {
  try {
    // Get the page number and items per page from query parameters
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 10; // Adjust the default as needed
    const skip = (page - 1) * perPage;

    //we will also pass status query parameter to filter properties based on status
    const status = req.query.status || "all";

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    let properties = [];

    if (status === "all") {
      properties = await Property.find({ owner: user._id })
        .skip(skip)
        .limit(perPage)
        .sort({ createdAt: -1 });
    } else {
      properties = await Property.find({ owner: user._id, status })
        .skip(skip)
        .limit(perPage)
        .sort({ createdAt: -1 });
    }

    //each property has multiple rooms, each room has multiple images so we need to get signed url for each image
    let updatedProperties = properties.map(async (property) => {
      for (let i = 0; i < property?.rooms?.length; i++) {
        //if there are no images for the room, skip
        if (property.rooms[i]?.images?.length === 0) {
          continue;
        }
        for (let j = 0; j < property.rooms[i].images.length; j++) {
          property.rooms[i].images[j] = await getSignedUrlFromKey(
            property.rooms[i].images[j]
          );
        }
      }
      return {
        ...property._doc,
        //just add an image for the property
        image:
          property?.rooms[0]?.images[0] ||
          (await getSignedUrlFromKey("no-image-found.png")),
      };
    });

    //wait for all promises to resolve

    updatedProperties = await Promise.all(updatedProperties);

    //get the total count of properties
    let totalCount = 0;
    if (status === "all") {
      totalCount = await Property.countDocuments({ owner: user._id });
    } else {
      totalCount = await Property.countDocuments({ owner: user._id, status });
    }

    const totalPages = Math.ceil(totalCount / perPage);

    res.status(200).json({
      data: updatedProperties,
      totalPages,
      currentPage: page,
      totalCount,
    });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

const getProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate("owner");

    if (!property) {
      return res.status(404).send({ error: "Property not found" });
    }

    let leastPrice = Number.MAX_VALUE;
    let leastPriceUnit;
    //get signed url for the images of rooms
    for (let i = 0; i < property.rooms.length; i++) {
      if (property.rooms[i].rentAmount < leastPrice) {
        leastPrice = property.rooms[i].rentAmount;
        leastPriceUnit = property.rooms[i].rentAmountUnit;
      }
      for (let j = 0; j < property.rooms[i].images.length; j++) {
        property.rooms[i].images[j] = await getSignedUrlFromKey(
          property.rooms[i].images[j]
        );
      }
    }

    //get signed url for the image of owner
    if (property.owner.profilePicture) {
      property.owner.profilePicture = await getSignedUrlFromKey(
        property.owner.profilePicture
      );
    }

    //get the number of times the property has been viewed in the last 24 hours
    const noOfTimesViewed = await RecentlyViewed.countDocuments({
      property: property._id,
      createdAt: {
        $gte: new Date(new Date() - 24 * 60 * 60 * 1000),
      },
    });

    //find the reviews where the property id matches, and user should not be the owner of the property
    const reviews = await Review.find({
      property: property._id,
      user: { $ne: property.owner._id },
    }).populate("user");

    let filteredReviews = reviews.map(async (review) => {
      //if
      if (review.user.profilePicture) {
        review.user.profilePicture = await getSignedUrlFromKey(
          review.user.profilePicture
        );
      }
      return review;
    });

    const updatedReviews = await Promise.all(filteredReviews);

    res.status(200).json({
      data: {
        ...property._doc,
        leastPrice: leastPriceUnit ? leastPrice : 0,
        leastPriceUnit,
        reviews: updatedReviews,
        noOfTimesViewed,
      },
    });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

const updateProperty = async (req, res) => {
  try {
    //find the property by id
    const property = await Property.findById(req.params.id);

    //check if the property exists
    if (!property) {
      return res.status(404).send({ error: "Property not found" });
    }

    //update the property
    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json({
      message: "Property updated successfully",
      data: updatedProperty,
    });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

const addRoom = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }
    //find the property by id
    const property = await Property.findById(req.params.id);

    //check if the property exists
    if (!property) {
      return res.status(404).send({ error: "Property not found" });
    }

    //check if the user is the owner of the property
    if (property.owner.toString() !== user._id.toString()) {
      return res
        .status(401)
        .send({ error: "You are not the owner of this property" });
    }

    const images = req.files;
    if (images.length === 0) {
      return res.status(400).send({ error: "Please upload an images" });
    }

    let imagesUrl = [];

    for (let i = 0; i < images.length; i++) {
      const { fileName } = await uploadFile(images[i], "property-images");
      imagesUrl.push(fileName);
    }

    //add the room to the property
    property.rooms.push({
      ...req.body,
      generalFacilities: JSON.parse(req.body.generalFacilities),
      roomFacilities: JSON.parse(req.body.roomFacilities),
      images: imagesUrl,
    });

    await property.save();

    res.status(200).json({ message: "Room added successfully" });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

const deleteRoom = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    //find the property by id
    const property = await Property.findById(req.params.id);

    //check if the property exists
    if (!property) {
      return res.status(404).send({ error: "Property not found" });
    }

    //check if the user is the owner of the property
    if (property.owner.toString() !== user._id.toString()) {
      return res
        .status(401)
        .send({ error: "You are not the owner of this property" });
    }

    //find the room by id
    const requiredRoom = property.rooms.find(
      (room) => room._id.toString() === req.params.roomId
    );

    //check if the room exists
    if (!requiredRoom) {
      return res.status(404).send({ error: "Room not found" });
    }

    //delete the images from s3
    for (let i = 0; i < requiredRoom.images.length; i++) {
      await deleteFile(requiredRoom.images[i]);
    }

    //delete the room
    const updatedRooms = property.rooms.filter(
      (room) => room._id.toString() !== req.params.roomId
    );

    property.rooms = updatedRooms;

    await property.save();

    res.status(200).json({ message: "Room deleted successfully" });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

const deleteProperty = async (req, res) => {
  try {
    //find the property by id
    const property = await Property.findById(req.params.id);

    //check if the property exists
    if (!property) {
      return res.status(404).send({ error: "Property not found" });
    }

    //delete the property
    await Property.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Property deleted successfully" });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

const pauseProperty = async (req, res) => {
  try {
    //find the property by id
    const property = await Property.findById(req.params.id);

    //check if the property exists
    if (!property) {
      return res.status(404).send({ error: "Property not found" });
    }

    //update the status of the property to paused
    property.status = "Paused";

    await property.save();

    res.status(200).json({ message: "Property paused successfully" });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

const getAllProperties = async (req, res) => {
  try {
    const properties = await Property.find();

    const updatedProperties = properties.map(async (property) => {
      let leastPrice = Number.MAX_VALUE;
      let leastPriceUnit;
      for (let i = 0; i < property?.rooms?.length; i++) {
        if (property?.rooms[i]?.rentAmount < leastPrice) {
          leastPrice = property.rooms[i].rentAmount;
          leastPriceUnit = property.rooms[i].rentAmountUnit;
        }
        if (property?.rooms[i]?.images?.length === 0) {
          continue;
        }
        for (let j = 0; j < property?.rooms[i]?.images?.length; j++) {
          property.rooms[i].images[j] = await getSignedUrlFromKey(
            property.rooms[i].images[j]
          );
        }
      }
      return {
        ...property._doc,
        image:
          property?.rooms[0]?.images[0] ||
          (await getSignedUrlFromKey("no-image-found.png")),
        leastPrice: leastPriceUnit ? leastPrice : 0,
        leastPriceUnit,
      };
    });

    const updatedPropertiesData = await Promise.all(updatedProperties);

    res.status(200).json({ properties: updatedPropertiesData });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: error.message });
  }
};

const approveProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).send({ error: "Property not found" });
    }

    property.status = "Active";

    await property.save();

    res.status(200).json({ message: "Property approved successfully" });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

const rejectProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).send({ error: "Property not found" });
    }

    property.status = "Denied";

    await property.save();

    res.status(200).json({ message: "Property rejected successfully" });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

module.exports = {
  createProperty,
  getProperties,
  getProperty,
  updateProperty,
  deleteProperty,
  addRoom,
  deleteRoom,
  getOwnerProperties,
  pauseProperty,
  getAllProperties,
  approveProperty,
  rejectProperty,
};
