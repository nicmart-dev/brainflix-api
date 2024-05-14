const express = require("express");
const app = express();
const cors = require("cors");
const apiRoutes = require("./routes/videos");
require("dotenv").config(); // load environment variables from a .env file into process.env

const { PORT } = process.env; // destructuring assignment of PORT from process.env
app.use(express.json()); // parse incoming requests with JSON payloads
app.use(express.static("public")); // serve static files from the 'public' folder

app.use(cors()); // allow cross-origin requests

app.use(apiRoutes); // use as a middleware

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
