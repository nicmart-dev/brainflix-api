const express = require("express");
const router = express.Router();
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const videos = require("../data/videos.json"); // import json data


// get all videos as a single array collection
router.get("/", (_req, res) => {
    res.json(videos);
});


module.exports = router;
