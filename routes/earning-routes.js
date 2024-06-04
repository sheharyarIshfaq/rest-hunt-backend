const express = require("express");
const router = express.Router();

const earningController = require("../controllers/earning-controller");

const verifyAuth = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");
const USER_ROLE = require("../types/user-role");

//router for getting all earnings of a user
router.get(
  "/",
  verifyAuth,
  checkRole(USER_ROLE.PROPERTY_OWNER),
  earningController.getEarnings
);

module.exports = router;
