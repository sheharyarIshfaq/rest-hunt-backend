const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ["Private", "Shared", "Entire Place"],
    required: true,
  },
  availableRooms: {
    type: Number,
    required: true,
  },
  noOfBathrooms: {
    type: Number,
    required: true,
  },
  generalFacilities: {
    type: [String],
    required: true,
  },
  roomFacilities: {
    type: [String],
    required: true,
  },
  roomSize: {
    type: Number,
    required: true,
  },
  roomSizeUnit: {
    type: String,
    required: true,
  },
  rentAmount: {
    type: Number,
    required: true,
  },
  rentAmountUnit: {
    type: String,
    enum: ["Per Year", "Per Month", "Per Week", "Per Day"],
    required: true,
  },
  images: {
    type: [String],
    required: true,
  },
});

// Create a schema for properties
const propertySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    location: {
      lat: {
        type: Number,
        required: true,
      },
      lng: {
        type: Number,
        required: true,
      },
    },
    nearbySiteName: {
      type: String,
      required: true,
    },
    propertyType: {
      type: String,
      required: true,
    },
    propertySize: {
      type: Number,
      required: true,
    },
    propertySizeUnit: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rooms: {
      type: [roomSchema],
      required: true,
    },
  },
  { timestamps: true }
);

// Create a model for properties
const Property = mongoose.model("Property", propertySchema);

module.exports = Property;
