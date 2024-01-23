// requiring the dotenv package
require("dotenv").config();
// requiring the database connection
require("./config/db").connect();

const express = require("express");
const cors = require("cors");

// requiring the routes
const userRoutes = require("./routes/user-routes");

// getting the port from the environment variables
const PORT = process.env.PORT || 5000;

const app = express();
app.use(cors());

// set the limit of the request body size
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// using the routes
app.use("/api/users", userRoutes);

// route to check if the api is running
app.get("/", (req, res) => {
  res.send("Api is running...");
});

// starting the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}...`);
});
