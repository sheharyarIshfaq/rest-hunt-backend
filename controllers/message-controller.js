const Chat = require("../models/chat-model");
const Message = require("../models/message-model");
const User = require("../models/user-model");

const addMessage = async (req, res) => {
  try {
    const { chatId, senderId, text } = req.body;
    const newMessage = new Message({
      chatId,
      senderId,
      text,
    });
    const savedMessage = await newMessage.save();
    res.status(200).json({
      message: "Message added successfully",
      savedMessage,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const messages = await Message.find({ chatId });
    res.status(200).json({
      messages,
      message: "Messages fetched successfully",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addEnquiry = async (req, res) => {
  try {
    const { senderId, receiverId, text, propertyId, roomId } = req.body;

    //we check if sender and receiver are valid users
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) {
      return res.status(400).json({
        message: "Sender or receiver not found",
      });
    }

    if (senderId === receiverId) {
      return res.status(400).json({
        message: "You can't send enquiry to yourself",
      });
    }

    //we check if the chat already exists
    const chat = await Chat.findOne({
      members: { $all: [senderId, receiverId] },
    });

    let chatId;
    if (chat) {
      chatId = chat._id;
    } else {
      const newChat = new Chat({
        members: [senderId, receiverId],
      });
      const savedChat = await newChat.save();
      chatId = savedChat._id;
    }

    const newMessage = new Message({
      chatId,
      senderId,
      text,
      enquiry: true,
      propertyId,
      roomId,
    });
    const savedMessage = await newMessage.save();
    res.status(200).json({
      message: "Enquiry added successfully",
      savedMessage,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  addMessage,
  getMessages,
  addEnquiry,
};
