const express = require("express");
const router = express.Router();

const favouriteController = require("../controllers/favourites-controller");
const verifyAuth = require("../middleware/auth");

//router for creating a favourite
router.post("/add", verifyAuth, favouriteController.addToFavourites);

//router for removing a favourite
router.delete("/remove", verifyAuth, favouriteController.removeFromFavourites);

//router for getting all favourites of a user
router.get("/", verifyAuth, favouriteController.getFavourites);

module.exports = router;
