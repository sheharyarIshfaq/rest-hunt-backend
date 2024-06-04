// requiring the dotenv package
require("dotenv").config();
// requiring the database connection
require("./config/db").connect();

const express = require("express");
const cors = require("cors");

const cron = require("node-cron");

// requiring the routes
const userRoutes = require("./routes/user-routes");
const propertyRoutes = require("./routes/property-routes");
const favouriteRoutes = require("./routes/favourites-routes");
const recentlyViewedRoutes = require("./routes/recently-viewed-routes");
const bookingRoutes = require("./routes/booking-routes");
const reviewRoutes = require("./routes/review-routes");
const earningRoutes = require("./routes/earning-routes");
const withdrawalRoutes = require("./routes/withdrawal-routes");

const Earning = require("./models/earning-model");

// getting the port from the environment variables
const PORT = process.env.PORT || 5000;

const app = express();
app.use(cors());

// set the limit of the request body size
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// using the routes
app.use("/api/users", userRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/favourites", favouriteRoutes);
app.use("/api/recently-viewed", recentlyViewedRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/earnings", earningRoutes);
app.use("/api/withdrawals", withdrawalRoutes);

// route to check if the api is running
app.get("/", (req, res) => {
  res.send("Api is running...");
});

//cron job to update the earnings status to approved after 10 days
cron.schedule("0 0 * * *", async () => {
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

  try {
    await Earning.updateMany(
      { status: "pending", createdAt: { $lte: tenDaysAgo } },
      { status: "approved" }
    );
  } catch (error) {
    console.log(error);
  }

  console.log("Earnings status updated to approved after 10 days");
});

// starting the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}...`);
});
