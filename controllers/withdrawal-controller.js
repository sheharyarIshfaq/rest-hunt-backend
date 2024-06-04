const Withdrawal = require("../models/withdrawal-model");
const User = require("../models/user-model");
const Earnings = require("../models/earning-model");

const createWithdrawal = async (req, res) => {
  try {
    const { amount, payoutMethod, accountDetails } = req.body;

    if (!amount || !payoutMethod || !accountDetails) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const earnings = await Earnings.find({
      user: req.user._id,
      status: "approved",
    });

    const totalEarnings = earnings.reduce(
      (acc, earning) => acc + earning.amount,
      0
    );

    if (totalEarnings < amount) {
      return res.status(400).json({ message: "Insufficient earnings" });
    }

    const withdrawal = new Withdrawal({
      user: req.user._id,
      amount,
      payoutMethod,
      accountDetails,
    });

    await withdrawal.save();

    res
      .status(201)
      .json({ message: "Withdrawal request created successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllWithdrawals = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const withdrawals = await Withdrawal.find({ user: user._id });

    res.status(200).json({ withdrawals });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllWithdrawalsForAdmin = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({});

    res.status(200).json({ withdrawals });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);

    if (!withdrawal) {
      return res.status(404).json({ message: "Withdrawal request not found" });
    }

    withdrawal.status = "approved";

    await withdrawal.save();

    res.status(200).json({ message: "Withdrawal request approved" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rejectWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);

    if (!withdrawal) {
      return res.status(404).json({ message: "Withdrawal request not found" });
    }

    withdrawal.status = "rejected";

    await withdrawal.save();

    res.status(200).json({ message: "Withdrawal request rejected" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createWithdrawal,
  getAllWithdrawals,
  getAllWithdrawalsForAdmin,
  approveWithdrawal,
  rejectWithdrawal,
};
