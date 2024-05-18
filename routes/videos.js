const express = require("express");
const router = express.Router();
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

// get video file using absolute path with Node path module
const path = require('path');
const videoFilePath = path.resolve(__dirname, '../data/videos.json');

/* resolving local image so we can then serve images like image0.jpg  */
require('dotenv').config(); // Ensure environment variables are available
const { PORT, BACKEND_URL } = process.env; // Destructure BACKEND_URL and PORT from process.env
const imageFilePath = `${BACKEND_URL}:${PORT}/images/`;

// middleware to validate API key
const validateApiKey = (req, res, next) => {
    const apiKey = req.query.api_key;

    // check if API key is provided
    if (!apiKey) {
        return res.status(401).json({ error: 'API key is missing' });
    }

    // API key is valid, proceed to the next middleware
    next();
};

/* read video file when needed by endpoint */
function loadVideoData() {
    try {
        const videos = JSON.parse(fs.readFileSync(videoFilePath, "utf8"));
        return videos;
    } catch (error) {
        console.error('Could not load video data:', error.message);
    }
}

// apply API key validation middleware to all routes
router.use(validateApiKey);

// get all videos but only return basic info
router.get("/", (_req, res) => {
    const videos = loadVideoData();
    if (videos) {
        const videoSnippets = videos.map(video => ({
            id: video.id,
            title: video.title,
            channel: video.channel,
            image: `${imageFilePath}${video.image}` // make image accessible on server
        }));
        res.json(videoSnippets);
    } else {
        res.status(500).json({ error: 'Failed to load video data' });
    }
});


// get a single video using an id
router.get("/:id", (req, res) => {
    const videos = loadVideoData();
    if (videos) {
        const foundVideo = videos.find(video => video.id === req.params.id);
        if (foundVideo) {
            // make image accessible on server
            const videoWithFullPath = {
                ...foundVideo,
                image: `${imageFilePath}${foundVideo.image}`
            };
            res.json(videoWithFullPath);
        } else {
            res.status(404).json({ error: 'Video not found' });
        }
    } else {
        res.status(500).json({ error: 'Failed to load video data' });
    }
});

router.post("/", (req, res) => {
    try {
        const videos = loadVideoData(); // read video json file

        // new video with only title, image, and description set through API
        const newVideo = {
            id: uuidv4(),
            title: req.body.title,
            channel: "Anonymous visitor", // set placeholder value
            image: req.body.image,
            description: req.body.description,
            views: 0, // no views as just posted
            likes: 0, // no likes  as just posted
            duration: "0:20", // placeholder
            video: "https://unit-3-project-api-0a5620414506.herokuapp.com/stream", // placeholder video stream
            timestamp: Date.now(), // set current time for posted date
            comments: [], // set empty array for comments
        };
        videos.push(newVideo);
        fs.writeFileSync(videoFilePath, JSON.stringify(videos));
        res.json({
            message: "Video uploaded successfully",
            video: newVideo // return video object 
        });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});


module.exports = router;
