const express = require("express");
const router = express.Router();
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

// get video file using absolute path with Node path module
const path = require('path');
const videoFilePath = path.resolve(__dirname, '../data/videos.json');

function loadVideoData() {
    try {
        const videos = JSON.parse(fs.readFileSync(videoFilePath, "utf8"));
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
