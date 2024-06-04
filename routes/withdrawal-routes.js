const express = require("express");
const router = express.Router();

const withdrawalController = require("../controllers/withdrawal-controller");

const verifyAuth = require("../middleware/auth");
const verifyAdmin = require("../middleware/admin-auth");

// router to handle withdrawal request
router.post("/request", verifyAuth, withdrawalController.createWithdrawal);

// router to get all withdrawal requests
router.get("/", verifyAuth, withdrawalController.getAllWithdrawals);

//router to get all withdrawal requests for admin
router.get("/all", verifyAdmin, withdrawalController.getAllWithdrawalsForAdmin);

// router to approve a withdrawal request
router.put("/approve/:id", verifyAdmin, withdrawalController.approveWithdrawal);

// router to reject a withdrawal request
router.put("/reject/:id", verifyAdmin, withdrawalController.rejectWithdrawal);

module.exports = router;
