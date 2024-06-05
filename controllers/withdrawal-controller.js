const Withdrawal = require("../models/withdrawal-model");
const User = require("../models/user-model");
const Earnings = require("../models/earning-model");

const createWithdrawal = async (req, res) => {
  try {
    const { amount, payoutMethod, accountDetails } = req.body;

    if (!amount || !payoutMethod || !accountDetails) {
      throw new Error("Please provide all required fields");
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      throw new Error("User not found");
    }

    const earnings = await Earnings.find({
      user: req.user.id,
    });

    const totalEarnings = earnings.reduce(
      (acc, earning) => acc + earning.amount,
      0
    );

    const withdrawals = await Withdrawal.find({
      user: req.user.id,
      //status is not equal to rejected
      status: { $ne: "rejected" },
    });

    const withdrawnAmount = withdrawals.reduce(
      (acc, withdrawal) => acc + withdrawal.amount,
      0
    );

    const availableBalance = totalEarnings - withdrawnAmount;

    if (availableBalance < amount) {
      throw new Error("Insufficient earnings");
    }

    const withdrawal = new Withdrawal({
      user: req.user.id,
      amount,
      payoutMethod,
      accountDetails,
    });

    await withdrawal.save();

    res
      .status(201)
      .json({ message: "Withdrawal request created successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllWithdrawals = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      throw new Error("User not found");
    }

    const withdrawals = await Withdrawal.find({ user: user._id });

    res.status(200).json({ withdrawals });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllWithdrawalsForAdmin = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({}).populate("user");

    res.status(200).json({ withdrawals });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const approveWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);

    if (!withdrawal) {
      throw new Error("Withdrawal request not found");
    }

    withdrawal.status = "approved";

    await withdrawal.save();

    res.status(200).json({ message: "Withdrawal request approved" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const rejectWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);

    if (!withdrawal) {
      throw new Error("Withdrawal request not found");
    }

    withdrawal.status = "rejected";

    await withdrawal.save();

    res.status(200).json({ message: "Withdrawal request rejected" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createWithdrawal,
  getAllWithdrawals,
  getAllWithdrawalsForAdmin,
  approveWithdrawal,
  rejectWithdrawal,
};
