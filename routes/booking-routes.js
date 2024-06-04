const express = require("express");
const router = express.Router();

const bookingController = require("../controllers/booking-controller");

const verifyAuth = require("../middleware/auth");
const verifyAdmin = require("../middleware/admin-auth");

//router for creating a booking
router.post("/create", verifyAuth, bookingController.createBooking);

//router to create a payment for a booking
router.post("/create-payment", verifyAuth, bookingController.createPayment);

//router for getting all bookings of a user
router.get("/", verifyAuth, bookingController.getBookings);

//router for getting all bookings of an owner
router.get("/owner", verifyAuth, bookingController.getOwnerBookings);

//router for getting a booking by id
router.get("/:id", verifyAuth, bookingController.getBookingById);

//router for updating a booking
router.put("/:id", verifyAdmin, bookingController.updateBooking);

//router for deleting a booking
router.delete("/:id", verifyAdmin, bookingController.deleteBooking);

module.exports = router;
