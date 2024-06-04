const Earning = require("../models/earning-model");
const User = require("../models/user-model");

const getEarnings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const earnings = await Earning.find({ user: user._id }).populate("booking");

    res.status(200).json({ earnings });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getEarnings,
};
