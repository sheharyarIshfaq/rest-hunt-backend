const Booking = require("../models/booking-model");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const createBooking = async (req, res) => {
  try {
    const booking = new Booking({ ...req.body, user: req.user._id });
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
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getBookingById = async (req, res) => {
  try {
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateBooking = async (req, res) => {
  try {
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteBooking = async (req, res) => {
  try {
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
};
