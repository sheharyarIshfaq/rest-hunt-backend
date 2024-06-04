const Chat = require("../models/chat-model");

const createChat = async (req, res) => {
  try {
    const newChat = new Chat({
      members: [req.body.senderId, req.body.receiverId],
    });

    const savedChat = await newChat.save();
    res.status(200).json({
      chat: savedChat,
      message: "Chat created successfully",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const userChats = async (req, res) => {
  try {
    const { userId } = req.params;
    const chats = await Chat.find({ members: { $in: [userId] } });
    res.status(200).json({
      chats,
      message: "Chats fetched successfully",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const findChat = async (req, res) => {
  try {
    const { firstId, secondId } = req.params;
    const chat = await Chat.findOne({
      members: { $all: [firstId, secondId] },
    });
    res.status(200).json({
      chat,
      message: "Chat fetched successfully",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createChat,
  userChats,
  findChat,
};
