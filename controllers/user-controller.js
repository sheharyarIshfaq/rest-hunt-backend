const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/user-model");
const { getSignedUrlFromKey, uploadFile, deleteFile } = require("../config/s3");
const Favourite = require("../models/favourites-model");
const Property = require("../models/property-model");
const Review = require("../models/review-model");
const Booking = require("../models/booking-model");

const getUserWithPresignedProfilePicture = async (id) => {
  const user = await User.findById(id).select("-password");

  if (user.profilePicture) {
    user.profilePicture = await getSignedUrlFromKey(user.profilePicture);
  }

  return user;
};

const signup = async (req, res) => {
  try {
    // Get user input
    const { name, email, password, role, location, gender } = req.body;

    // Validate user input
    if (!(email && password && name)) {
      res.status(400).send({ error: "All input is required" });
    }

    // Check if user already exist
    const existingUser = await User.findOne({ email });

    // If user exist return error
    if (existingUser) {
      return res
        .status(400)
        .send({ error: "User already exists. Please Login" });
    }

    // Encrypt user password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in our database
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      gender,
      location,
    });

    // Create token using user id, email and secret
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );

    const user = await User.findById(newUser._id).select("-password");

    // return the token and user
    return res.status(201).json({
      user,
      token,
      message: "User created successfully",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    // Get user input
    const { email, password } = req.body;

    // Validate user input
    if (!(email && password)) {
      res.status(400).send({ error: "All input is required" });
    }

    // Validate if user exist in our database
    const user = await User.findOne({ email });

    // If user exists and password is correct return token
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        {
          expiresIn: "24h",
        }
      );

      return res.status(200).json({
        user: await getUserWithPresignedProfilePicture(user._id),
        token,
        message: "Login successful",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
    }

    // If user does not exist or password is incorrect return error
    return res.status(400).send({ error: "Invalid credentials" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUser = async (req, res) => {
  try {
    // find user in our database using id from token payload and miunus password
    const user = await User.findById(req.user.id).select("-password");

    // if user does not exist return error
    if (!user) {
      return res.status(400).send({ error: "User not found" });
    }
    // return user
    return res
      .status(200)
      .json(await getUserWithPresignedProfilePicture(req.user.id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    // find user in our database using id from token payload and miunus password
    const user = await User.findById(req.user.id).select("-password");

    // if user does not exist return error
    if (!user) {
      return res.status(400).send({ error: "User not found" });
    }

    //check if the user is trying to update the password
    if (req.body.password) {
      // if the user is trying to update the password, encrypt the password
      const hashedPassword = await bcrypt.hash(req.body.password, 10);

      // update the password
      req.body.password = hashedPassword;
    }

    //if user is trying to update the email, check if the email already exists
    if (req.body.email) {
      const existingUser = await User.findOne({ email: req.body.email });
      if (
        existingUser &&
        existingUser._id.toString() !== req.user.id.toString()
      ) {
        return res.status(400).send({ error: "Email already exists" });
      }
    }

    // update user
    await User.findByIdAndUpdate(req.user.id, req.body);

    // return updated user
    return res.status(200).json({
      user: await getUserWithPresignedProfilePicture(req.user.id),
      message: "User updated successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    // find all users in our database and miunus password
    const users = await User.find().select("-password");

    // if users does not exist return error
    if (!users) {
      return res.status(400).send({ error: "Users not found" });
    }

    // loop through all users and get presigned url for profile picture
    for (let i = 0; i < users.length; i++) {
      if (users[i].profilePicture) {
        users[i].profilePicture = await getSignedUrlFromKey(
          users[i].profilePicture
        );
      }
    }

    // return users
    return res.status(200).json({
      users,
      message: "Users fetched successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const uploadProfilePicture = async (req, res) => {
  try {
    // find user in our database using id from token payload and miunus password
    const user = await User.findById(req.user.id).select("-password");

    // if user does not exist return error
    if (!user) {
      return res.status(400).send({ error: "User not found" });
    }

    if (req.file) {
      //first we need to delete the existing profile picture
      if (user.profilePicture && user.profilePicture !== "") {
        await deleteFile(user.profilePicture);
      }

      //upload the new profile picture
      const response = await uploadFile(req.file, "profile-pictures");

      //update the user profile picture
      await User.findByIdAndUpdate(req.user.id, {
        profilePicture: response.fileName,
      });
    }

    const updatedUser = await getUserWithPresignedProfilePicture(req.user.id);

    //find the reviews of the user
    const reviews = await Review.find({ user: req.user.id });

    //calculate the average rating of the user
    let averageRating = 0;
    if (reviews.length > 0) {
      averageRating =
        reviews.reduce((acc, review) => acc + review.rating, 0) /
        reviews.length;
    }

    // return updated user
    return res.status(200).json({
      user: {
        ...updatedUser._doc,
        averageRating,
        reviewsCount: reviews.length,
      },
      message: "Profile picture updated successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getFavourites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 4;

    const skip = (page - 1) * perPage;

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const favourites = await Favourite.find({ user: user._id })
      .skip(skip)
      .limit(perPage)
      .populate("property");

    const properties = favourites.map((favourite) => favourite.property);

    let updatedProperties = properties.map(async (property) => {
      let leastPrice = Number.MAX_VALUE;
      let leastPriceUnit;
      for (let i = 0; i < property?.rooms?.length; i++) {
        if (property.rooms[i]?.rentAmount < leastPrice) {
          leastPrice = property.rooms[i]?.rentAmount;
          leastPriceUnit = property.rooms[i]?.rentAmountUnit;
        }
        if (property?.rooms[i]?.images.length === 0) {
          continue;
        }
        for (let j = 0; j < property?.rooms[i]?.images.length; j++) {
          property.rooms[i].images[j] = await getSignedUrlFromKey(
            property.rooms[i].images[j]
          );
        }
      }
      return {
        ...property._doc,
        image:
          property?.rooms[0]?.images[0] ||
          (await getSignedUrlFromKey("no-image-found.png")),
        leastPrice: leastPriceUnit ? leastPrice : 0,
        leastPriceUnit,
      };
    });

    updatedProperties = await Promise.all(updatedProperties);

    const totalCount = await Favourite.countDocuments({ user: user._id });
    const totalPages = Math.ceil(totalCount / perPage);

    return res.status(200).json({
      properties: updatedProperties,
      currentPage: page,
      totalPages,
      message: "Favourites fetched successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getUserData = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const requiredUser = await getUserWithPresignedProfilePicture(user._id);

    const userBookings = await Booking.find({ user: user._id });

    const ownerProperties = await Property.find({ owner: user._id });

    const ownerPropertiesIds = ownerProperties.map((property) => property._id);

    const userBookingsIds = userBookings.map((booking) => booking._id);

    //we need to find the reviews of the user, when a booking is done, a review is added by the user and the owner
    //so we need to find the reviews where the user is the owner
    const reviews = await Review.find({
      $or: [
        { property: { $in: ownerPropertiesIds } },
        { booking: { $in: userBookingsIds } },
      ],
      //we don't want to include the reviews where the user is the owner
      user: { $ne: requiredUser._id },
    }).populate("user");

    const reviewsWithUser = reviews.map(async (review) => {
      const userProfilePicture = await getSignedUrlFromKey(
        review.user.profilePicture
      );
      return {
        ...review._doc,
        user: {
          ...review.user._doc,
          profilePicture: userProfilePicture,
        },
      };
    });

    const updatedReviews = await Promise.all(reviewsWithUser);

    const averageRating =
      reviews.length > 0
        ? reviews.reduce((acc, review) => acc + review.rating, 0) /
          reviews.length
        : 0;

    return res.status(200).json({
      user: {
        ...requiredUser._doc,
        reviewsCount: reviews.length,
        averageRating,
        reviews: updatedReviews,
      },
      message: "User fetched successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// export all the functions
module.exports = {
  signup,
  login,
  getUser,
  updateUser,
  getAllUsers,
  uploadProfilePicture,
  getFavourites,
  getUserData,
};
