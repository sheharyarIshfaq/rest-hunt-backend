const Review = require("../models/review-model");
const Property = require("../models/property-model");
const Booking = require("../models/booking-model");
const User = require("../models/user-model");
const { getSignedUrlFromKey } = require("../config/s3");

const createReview = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const property = await Property.findById(req.body.property);

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    const booking = await Booking.findById(req.body.booking);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const review = new Review({
      user: user._id,
      property: property._id,
      booking: booking._id,
      review: req.body.review,
      rating: req.body.rating,
    });

    await review.save();

    const updatedReview = await Review.findById(review._id)
      .populate("user")
      .populate("property")
      .populate("booking");

    if (updatedReview.user.profilePicture) {
      updatedReview.user.profilePicture = await getSignedUrlFromKey(
        updatedReview.user.profilePicture
      );
    }

    res.status(201).json({ review: updatedReview });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getReviews = async (req, res) => {
  try {
    const propertyId = req.params.propertyId;

    const reviews = await Review.find({ property: propertyId })
      .populate("user")
      .populate("property")
      .populate("booking");

    res.status(200).json({ reviews });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getReviewByBookingId = async (req, res) => {
  try {
    const bookingId = req.params.id;

    const reviews = await Review.find({ booking: bookingId })
      .populate("user")
      .populate("property")
      .populate("booking");

    const updatedReviews = await Promise.all(
      reviews.map(async (review) => {
        if (review.user.profilePicture) {
          review.user.profilePicture = await getSignedUrlFromKey(
            review.user.profilePicture
          );
        }

        return review;
      })
    );

    res.status(200).json({
      reviews: updatedReviews,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getReviewById = async (req, res) => {
  try {
    const reviewId = req.params.id;

    const review = await Review.findById(reviewId)
      .populate("user")
      .populate("property")
      .populate("booking");

    res.status(200).json({ review });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateReview = async (req, res) => {
  try {
    const reviewId = req.params.id;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    await Review.findByIdAndUpdate(reviewId, req.body);

    res.status(200).json({ message: "Review updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteReview = async (req, res) => {
  try {
    const reviewId = req.params.id;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    await Review.findByIdAndDelete(reviewId);

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createReview,
  getReviews,
  getReviewByBookingId,
  getReviewById,
  updateReview,
  deleteReview,
};
