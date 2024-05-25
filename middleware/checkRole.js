const checkRole = (role) => {
  return (req, res, next) => {
    if (req?.user?.role === role) {
      next();
    } else {
      res
        .status(403)
        .json({ message: "You are not authorized to perform this action" });
    }
  };
};

module.exports = checkRole;
