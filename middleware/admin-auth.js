const jwt = require("jsonwebtoken");

//verify the token and check if it is valid and the user role is admin
const verifyAdmin = async (req, res, next) => {
  try {
    // get the token from the request header
    const token = req.headers?.authorization?.split(" ")[1];
    // verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // check if the user role is admin or not and throw an error if not
    if (decoded.role !== "admin") {
      throw new Error("You are not authorized to perform this action");
    }
    // set the user to the request object
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

module.exports = verifyAdmin;
