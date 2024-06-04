const Booking = require("../models/booking-model");
const Property = require("../models/property-model");
const User = require("../models/user-model");
const Earning = require("../models/earning-model");
const { getSignedUrlFromKey } = require("../config/s3");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const createBooking = async (req, res) => {
  try {
    //we find the user by the id and then create a booking with the user id
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const property = await Property.findById(req.body.property);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    const room = property.rooms.find((room) => room._id == req.body.room);

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    //if the room is not available
    if (room.availableRooms <= 0) {
      return res.status(400).json({ error: "Room not available" });
    }

    const booking = new Booking({
      user: user._id,
      property: property._id,
      room: room._id,
      moveIn: req.body.moveIn,
      moveOut: req.body.moveOut,
      total: req.body.total,
      provider: req.body.provider,
    });

    //minus the room availability from the property
    room.availableRooms -= 1;

    //save the room
    await property.save();

    //create an earning for the owner
    const earning = new Earning({
      user: property.owner,
      amount: req.body.total,
      provider: req.body.provider,
      booking: booking._id,
      description: `Booking for ${property.name}`,
    });

    await earning.save();

    await booking.save();
    res.status(201).json({ booking });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const createPayment = async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: req.body.amount,
      currency: "pkr",
    });

    res.status(201).json({ client_secret: paymentIntent.client_secret });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getBookings = async (req, res) => {
  try {
    // Get the page number and items per page from query parameters
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 10; // Adjust the default as needed
    const skip = (page - 1) * perPage;

    const status = req.query.status || "previous";

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let query = {
      user: user._id,
    };

    if (status === "previous") {
      //we need to find the bookings which have moveOut date less than today
      query.moveOut = { $lt: new Date() };
    } else {
      //we need to find the bookings which have moveOut date greater than today
      query.moveOut = { $gte: new Date() };
    }

    const bookings = await Booking.find({
      ...query,
    })
      .skip(skip)
      .limit(perPage)
      .sort({ createdAt: -1 })
      .populate("property");

    const fallBackImage = await getSignedUrlFromKey("no-image-found.png");

    //for each booking we need to add find the room from property and add it to the booking
    const bookingsWithRooms = await Promise.all(
      bookings.map(async (booking) => {
        const property = booking.property;

        const user = await User.findById(property.owner);

        const room = property?.rooms?.find(
          (room) => room._id.toString() === booking.room.toString()
        );

        if (!room) {
          return booking;
        }

        let signedImages;

        if (room.images.length > 0) {
          signedImages = await Promise.all(
            room.images.map(async (image) => {
              return await getSignedUrlFromKey(image);
            })
          );
        }
        return {
          ...booking.toObject(),
          room: {
            ...room.toObject(),
            images: signedImages || [fallBackImage],
          },
          user: {
            ...user.toObject(),
            password: undefined,
          },
        };
      })
    );

    const totalCount = await Booking.countDocuments({
      ...query,
    });

    const totalPages = totalCount === 0 ? 1 : Math.ceil(totalCount / perPage);

    res.status(200).json({
      data: bookingsWithRooms,
      totalPages,
      currentPage: page,
      total: totalCount,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getOwnerBookings = async (req, res) => {
  try {
    // Get the page number and items per page from query parameters
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 10; // Adjust the default as needed
    const skip = (page - 1) * perPage;
    const status = req.query.status || "previous";

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userProperties = await Property.find({ owner: user._id });

    const userPropertiesIds = userProperties.map((property) => property._id);

    let query = {
      property: { $in: userPropertiesIds },
    };

    if (status === "previous") {
      //we need to find the bookings which have moveOut date less than today
      query.moveOut = { $lt: new Date() };
    } else {
      //we need to find the bookings which have moveOut date greater than today
      query.moveOut = { $gte: new Date() };
    }

    const bookings = await Booking.find({
      ...query,
    })
      .skip(skip)
      .limit(perPage)
      .sort({ createdAt: -1 })
      .populate("property")
      .populate("user");

    const fallBackImage = await getSignedUrlFromKey("no-image-found.png");

    //for each booking we need to add find the room from property and add it to the booking
    const bookingsWithRooms = await Promise.all(
      bookings.map(async (booking) => {
        const property = booking.property;

        const room = property?.rooms?.find(
          (room) => room._id.toString() === booking.room.toString()
        );

        if (!room) {
          return booking;
        }

        let signedImages;

        if (room.images.length > 0) {
          signedImages = await Promise.all(
            room.images.map(async (image) => {
              return await getSignedUrlFromKey(image);
            })
          );
        }
        return {
          ...booking.toObject(),
          room: {
            ...room.toObject(),
            images: signedImages || [fallBackImage],
          },
        };
      })
    );

    const totalCount = await Booking.countDocuments({
      ...query,
    });

    const totalPages = totalCount === 0 ? 1 : Math.ceil(totalCount / perPage);

    res.status(200).json({
      data: bookingsWithRooms,
      totalPages,
      currentPage: page,
      total: totalCount,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getBookingById = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const booking = await Booking.findById(req.params.id)
      .populate("property")
      .populate("user");

    //if the booking is not found
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const property = booking.property;

    const room = property?.rooms?.find(
      (room) => room._id.toString() === booking.room.toString()
    );

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    let signedImages;

    if (room.images.length > 0) {
      signedImages = await Promise.all(
        room.images.map(async (image) => {
          return await getSignedUrlFromKey(image);
        })
      );
    }

    const fallBackImage = await getSignedUrlFromKey("no-image-found.png");

    const owner = await User.findById(property.owner);

    return res.status(200).json({
      data: {
        ...booking.toObject(),
        room: {
          ...room.toObject(),
          images: signedImages || [fallBackImage],
        },
        user: {
          ...booking.user.toObject(),
          password: undefined,
        },
        owner: {
          ...owner.toObject(),
          password: undefined,
        },
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (req.body.status === "rejected") {
      //add the room availability back to the property
      const property = await Property.findById(booking.property);

      const room = property.rooms.find((room) => room._id == booking.room);

      room.availableRooms += 1;

      await property.save();

      //remove the earning for the owner
      await Earning.deleteOne({ booking: booking._id });
    }

    booking.status = req.body.status;

    await booking.save();

    res.status(200).json({ booking });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    //add the room availability back to the property
    const property = await Property.findById(booking.property);

    const room = property.rooms.find((room) => room._id == booking.room);

    room.availableRooms += 1;

    await property.save();

    //remove the earning for the owner
    await Earning.deleteOne({ booking: booking._id });

    await Booking.deleteOne({ _id: booking._id });

    res.status(200).json({ message: "Booking removed" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  createBooking,
  createPayment,
  getBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
  getOwnerBookings,
};
