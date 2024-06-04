const Earning = require("../models/earning-model");
const User = require("../models/user-model");
const Withdrawal = require("../models/withdrawal-model");

const getEarnings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const earnings = await Earning.find({ user: user._id })
      .populate({
        path: "booking",
        populate: { path: "user", select: "name email" },
      })
      .populate("user");

    const totalEarnings = earnings.reduce((acc, earning) => {
      return acc + earning.amount;
    }, 0);

    const withdrawals = await Withdrawal.find({
      user: user._id,
      status: "approved",
    });

    const withdrawnAmount = withdrawals.reduce((acc, withdrawal) => {
      return acc + withdrawal.amount;
    }, 0);

    const pendingWithdrawals = await Withdrawal.find({
      user: user._id,
      status: "pending",
    });

    const pendingAmount = pendingWithdrawals.reduce((acc, withdrawal) => {
      return acc + withdrawal.amount;
    }, 0);

    res
      .status(200)
      .json({ earnings, totalEarnings, withdrawnAmount, pendingAmount });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getEarnings,
};
