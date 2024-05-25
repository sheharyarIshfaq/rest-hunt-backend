const express = require("express");
const router = express.Router();

const propertyController = require("../controllers/property-controller");
const verifyAuth = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");
const USER_ROLE = require("../types/user-role");

//router for creating a property
router.post(
  "/new",
  verifyAuth,
  checkRole(USER_ROLE.PROPERTY_OWNER),
  propertyController.createProperty
);

//router for getting all properties
router.get("/", propertyController.getProperties);

//router for getting a property by id
router.get("/:id", propertyController.getProperty);

//router for updating a property by id
router.put(
  "/:id",
  verifyAuth,
  checkRole(USER_ROLE.PROPERTY_OWNER),
  propertyController.updateProperty
);

//router for deleting a property by id
router.delete(
  "/:id",
  verifyAuth,
  checkRole(USER_ROLE.PROPERTY_OWNER),
  propertyController.deleteProperty
);

module.exports = router;
