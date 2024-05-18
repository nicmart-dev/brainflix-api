const express = require("express");
const router = express.Router();
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

function loadVideoData() {
    try {
        // get file using absolute path using Node path module
        const path = require('path');
        const filePath = path.resolve(__dirname, '../data/videos.json');
        const videos = JSON.parse(fs.readFileSync(filePath, "utf8"));
        return videos;
    } catch (error) {
        console.error('Could not load video data:', error.message);
    }
}

// get all videos but only return basic info
router.get("/", (_req, res) => {
    const videos = loadVideoData();
    if (videos) {
        const videoSnippets = videos.map(video => ({
            id: video.id,
            title: video.title,
            channel: video.channel,
            image: video.image
        }));
        res.json(videoSnippets);
    } else {
        res.status(500).json({ error: 'Failed to load video data' });
    }
});


// get a single video using an id
router.get("/:id", (req, res) => {
    const videos = loadVideoData();
    const foundVideo = videos.find((video) => video.id === req.params.id);
    res.json(foundVideo);
});


module.exports = router;
