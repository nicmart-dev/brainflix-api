const express = require("express");
const app = express();
const cors = require("cors");
const videoRoutes = require("./routes/videos");
require("dotenv").config(); // load environment variables from a .env file into process.env

const { PORT } = process.env; // destructuring assignment of PORT from process.env

// middleware
app.use(express.json()); // parses incoming requests specifically req.body
app.use(express.static("public")); // allow making some files publiclly available
app.use(cors()); // allow * / all to access our api. All domains, ips, ports

// start using videoRoutes for requests made to /videos
app.use("/videos", videoRoutes);

app.get("/", (_req, res) => {
    res.send("<h1>Welcome to the BrainFlix video API server!</h1>");
});

// boots up the server and listens on a specified port number
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
