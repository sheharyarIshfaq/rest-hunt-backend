const Message = require("../models/message-model");

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

module.exports = {
  addMessage,
  getMessages,
};
