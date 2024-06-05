const express = require("express");
const router = express.Router();

const propertyController = require("../controllers/property-controller");
const verifyAuth = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");
const USER_ROLE = require("../types/user-role");
const { upload } = require("../config/multer");
const verifyAdmin = require("../middleware/admin-auth");

//router for creating a property
router.post(
  "/new",
  verifyAuth,
  checkRole(USER_ROLE.PROPERTY_OWNER),
  propertyController.createProperty
);

//router for getting all properties
router.get("/", propertyController.getProperties);

//router for getting all properties for admin
router.get("/all", verifyAdmin, propertyController.getAllProperties);

//router to get owner's properties
router.get(
  "/owner",
  verifyAuth,
  checkRole(USER_ROLE.PROPERTY_OWNER),
  propertyController.getOwnerProperties
);

//router to approve a property
router.put("/approve/:id", verifyAdmin, propertyController.approveProperty);

//router to reject a property
router.put("/reject/:id", verifyAdmin, propertyController.rejectProperty);

//router for getting a property by id
router.get("/:id", propertyController.getProperty);

//router to pause a property by id
router.put(
  "/:id/pause",
  verifyAuth,
  checkRole(USER_ROLE.PROPERTY_OWNER),
  propertyController.pauseProperty
);

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

//router to add a room to a property
router.post(
  "/:id/room",
  verifyAuth,
  checkRole(USER_ROLE.PROPERTY_OWNER),
  upload.array("images", 10),
  propertyController.addRoom
);

//router to delete a room from a property
router.delete(
  "/:id/room/:roomId",
  verifyAuth,
  checkRole(USER_ROLE.PROPERTY_OWNER),
  propertyController.deleteRoom
);

module.exports = router;
