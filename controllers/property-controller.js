const { uploadFile, deleteFile, getSignedUrlFromKey } = require("../config/s3");
const Property = require("../models/property-model");
const User = require("../models/user-model");

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

const getProperties = async (req, res) => {};

const getProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).send({ error: "Property not found" });
    }

    //get signed url for the images of rooms
    for (let i = 0; i < property.rooms.length; i++) {
      for (let j = 0; j < property.rooms[i].images.length; j++) {
        property.rooms[i].images[j] = await getSignedUrlFromKey(
          property.rooms[i].images[j]
        );
      }
    }

    res.status(200).json({ data: property });
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

module.exports = {
  createProperty,
  getProperties,
  getProperty,
  updateProperty,
  deleteProperty,
  addRoom,
  deleteRoom,
};
