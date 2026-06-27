const express = require("express");
const cors = require("cors");
require("dotenv").config();
require("./db");

const resumeRoutes = require("./routes/resumeRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/resumes", resumeRoutes);

app.get("/", (req, res) => {
    res.send("AI Resume Analyzer Backend Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});