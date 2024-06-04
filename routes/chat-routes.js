const express = require("express");
const router = express.Router();

const chatController = require("../controllers/chat-controller");

//router to create a new chat
router.post("/create", chatController.createChat);

//router to get user's chats
router.get("/:userId", chatController.userChats);

//router to find chats
router.get("/find/:firstId/:secondId", chatController.findChat);

module.exports = router;
