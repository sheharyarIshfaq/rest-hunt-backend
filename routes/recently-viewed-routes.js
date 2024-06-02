const express = require("express");
const router = express.Router();

const recentlyViewedController = require("../controllers/recently-viewed-controller");
const verifyAuth = require("../middleware/auth");

router.post("/add", recentlyViewedController.addToRecentlyViewed);

module.exports = router;
