const jwt = require("jsonwebtoken");

const verifyAuth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers?.authorization?.split(" ")[1];
    // Verify token and decode it to get user id and email
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Set user id and email to req.user
    req.user = decoded;
    next();
  } catch (error) {
    // If token is not valid, return error
    res.status(401).json({ error: error.message });
  }
};

module.exports = verifyAuth;
