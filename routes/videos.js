const express = require("express");
const multer = require("multer");
const router = express.Router();
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

require('dotenv').config(); // Ensure environment variables are available
const { PORT, BACKEND_URL, NODE_ENV } = process.env; // Destructure process.env


/* get video file using absolute path with Node path module. 
Note: Support videos.dev.json to not commit changes to version control.
*/
const path = require('path');
const videosFileFolder = path.resolve(__dirname, '../data');
const videosFile = NODE_ENV === 'production' ? 'videos.json' : 'videos.dev.json';
const videosFilePath = path.join(videosFileFolder, videosFile);

/* resolving local image so we can then serve images like image0.jpg  */
const imageFilePath = `${BACKEND_URL}:${PORT}/images/`;

/* resolving local video player folder containing video files  */
const videoPlayerPath = `${BACKEND_URL}:${PORT}/player/`;


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
        if (NODE_ENV !== 'production' && !fs.existsSync(videosFilePath)) {
            // If videos.dev.json doesn't exist, create it based on videos.json
            const defaultVideos = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/videos.json'), 'utf8'));
            fs.writeFileSync(videosFilePath, JSON.stringify(defaultVideos));
        }
        return JSON.parse(fs.readFileSync(videosFilePath, "utf8"));
    } catch (error) {
        console.error('Could not load video data:', error.message);
    }
}

// Configure multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../public/images")); // Ensure the 'uploads' directory is inside 'public'
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Use current timestamp as file name
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // Set limit to 10MB
    }
});

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
            // make image accessible on server, and use placeholder video
            const videoWithFullPath = {
                ...foundVideo,
                image: `${imageFilePath}${foundVideo.image}`,
                video: `${videoPlayerPath}BrainStation Sample Video.mp4`
            };
            res.json(videoWithFullPath);
        } else {
            res.status(404).json({ error: 'Video not found' });
        }
    } else {
        res.status(500).json({ error: 'Failed to load video data' });
    }
});

// endpoint to like a video
router.put("/:id/likes", (req, res) => {
    const videos = loadVideoData();
    if (videos) {
        const foundVideo = videos.find(video => video.id === req.params.id);

        if (foundVideo) {

            // Convert the likes property to a number if not already
            let likes = typeof foundVideo.likes === 'string' ? parseInt(foundVideo.likes.replace(/,/g, ''), 10) : foundVideo.likes;
            likes += 1 // increment like counter

            // Update the likes property (and format it as a string with commas, if needed)
            foundVideo.likes = likes.toLocaleString();

            // save change back to videos file
            fs.writeFileSync(videosFilePath, JSON.stringify(videos));
            res.status(200).json({
                message: "Like added on this video",
                video: {
                    id: foundVideo.id,
                    title: foundVideo.title,
                    likes: foundVideo.likes
                }
            });
        } else {
            res.status(404).json({ error: 'Video not found' });
        }
    } else {
        res.status(500).json({ error: 'Failed to load video data' });
    }
});

// Define the route for image upload from field named "poster"
router.post("/image", upload.single("poster"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    res.status(200).json({
        message: "File uploaded successfully",
        fileName: `${req.file.filename}`
    });
});


/* Define the route to post video */
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
        fs.writeFileSync(videosFilePath, JSON.stringify(videos));
        res.json({
            message: "Video uploaded successfully",
            video: newVideo // return video object 
        });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

/* Post comment */
router.post("/:id/comments", (req, res) => {
    try {
        const videos = loadVideoData(); // read video json file

        // find video to add comment to
        const video = videos.find(video => video.id === req.params.id);

        // construct new comment to add
        const newComment = {
            id: uuidv4(),
            name: req.body.name,
            comment: req.body.comment,
            likes: 0, // no likes as comment just posted
            timestamp: Date.now(), // set current time for posted date
        };
        video.comments.push(newComment);
        fs.writeFileSync(videosFilePath, JSON.stringify(videos));
        res.json({
            message: "Comment added to video successfully",
            comment: newComment // return comment object 
        });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

/* endpoint to like a video comment, reusing like same functionality as like video and delete comment functionality.  */
router.put("/:videoId/comments/:id/likes", (req, res) => {
    const videos = loadVideoData();
    if (videos) {
        // find video with comment to like
        const video = videos.find(video => video.id === req.params.videoId);

        // now find comment to like
        const foundComment = video.comments.find(comment => comment.id === req.params.id);

        if (foundComment) {
            foundComment.likes += 1 // increment like number counter

            // save change back to videos file
            fs.writeFileSync(videosFilePath, JSON.stringify(videos));
            res.status(200).json({
                message: "Like added on this comment",
                video: {
                    id: video.id,
                    title: video.title,
                    comments: {
                        id: foundComment.id,
                        likes: foundComment.likes
                    }
                }
            });
        } else {
            res.status(404).json({ error: 'Comment not found' });
        }
    } else {
        res.status(500).json({ error: 'Failed to load video comment data' });
    }
});

/* Delete comment */
router.delete("/:videoId/comments/:id", (req, res) => {
    try {
        const videos = loadVideoData(); // read video json file

        // find video with comment to delete
        const video = videos.find(video => video.id === req.params.videoId);

        // now find comment to delete
        const commentIdToRemove = req.params.id;
        const commentToRemove = video.comments.find(comment => comment.id === commentIdToRemove);

        if (commentToRemove) {
            // Remove comment from the array
            video.comments = video.comments.filter(comment => comment.id !== commentIdToRemove);

            fs.writeFileSync(videosFilePath, JSON.stringify(videos));
            res.json({
                message: "Comment removed successfully",
                comment: commentToRemove // return deleted comment object 
            });
        } else {
            res.status(404).json({ error: "Comment not found" });
        }
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});


module.exports = router;
