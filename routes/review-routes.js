const express = require("express");
const router = express.Router();

const reviewController = require("../controllers/review-controller");

const verifyAuth = require("../middleware/auth");

//router for creating a review
router.post("/create", verifyAuth, reviewController.createReview);

//router for getting review by booking id
router.get("/booking/:id", verifyAuth, reviewController.getReviewByBookingId);

//router for getting all reviews of a property
router.get("/property/:propertyId", reviewController.getReviews);

//router for getting a review by id
router.get("/:id", reviewController.getReviewById);

//router for updating a review
router.put("/:id", verifyAuth, reviewController.updateReview);

//router for deleting a review
router.delete("/:id", verifyAuth, reviewController.deleteReview);

module.exports = router;
