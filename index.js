const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.send("Hello API routes. Demo");
});

app.listen(5555, () => {
    console.log(`Server is running at http://localhost:5555`);
});
