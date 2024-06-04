const Chat = require("../models/chat-model");
const User = require("../models/user-model");

const createChat = async (req, res) => {
  try {
    //findt the sender and receiver chat

    const senderId = await User.findById(req.body.senderId);
    const receiver = await User.findById(req.body.receiverId);

    if (!senderId || !receiver) {
      return res.status(400).json({
        message: "Sender or receiver not found",
      });
    }

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
