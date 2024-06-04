const express = require("express");
const router = express.Router();

const messageController = require("../controllers/message-controller");

//router to add a new message
router.post("/add", messageController.addMessage);

//router to get messages of a chat
router.get("/:chatId", messageController.getMessages);

module.exports = router;
