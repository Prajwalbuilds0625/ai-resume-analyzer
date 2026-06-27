const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const fs = require("fs");
const db = require("../db");
const cloudinary = require("../config/cloudinary");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

function analyzeResume(text) {
    const resume = text.toLowerCase();

    const importantSkills = [
        "html", "css", "javascript", "react", "node", "express",
        "mysql", "mongodb", "git", "github", "api", "rest",
        "java", "spring", "spring boot", "hibernate",
        "docker", "aws", "cloud", "ci/cd"
    ];

    const foundSkills = importantSkills.filter(skill =>
        resume.includes(skill.toLowerCase())
    );

    const missingSkills = importantSkills.filter(skill =>
        !resume.includes(skill.toLowerCase())
    );

    let score = 40 + foundSkills.length * 3;

    if (resume.includes("project")) score += 10;
    if (resume.includes("internship") || resume.includes("experience")) score += 10;
    if (resume.includes("github")) score += 5;
    if (resume.includes("linkedin")) score += 5;

    if (score > 100) score = 100;

    const suggestions = [
        "Add measurable project impact like number of users, APIs, tables, or features.",
        "Add deployed project links and GitHub repository links.",
        "Include modern keywords like Docker, AWS, CI/CD, REST APIs, and Cloud Deployment.",
        "Improve project descriptions using action words such as developed, implemented, integrated, and deployed.",
        "Keep resume ATS-friendly with clear headings like Skills, Projects, Education, and Certifications."
    ].join(" ");

    return {
        ats_score: score,
        skills_found: foundSkills.join(", "),
        missing_skills: missingSkills.slice(0, 8).join(", "),
        suggestions
    };
}

router.post("/upload", upload.single("resume"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const fileBuffer = fs.readFileSync(req.file.path);
        const pdfData = await pdfParse(fileBuffer);

        const resumeText = pdfData.text;
        const fileName = req.file.originalname;

        const cloudUpload = await cloudinary.uploader.upload(req.file.path, {
    folder: "ai_resume_analyzer",
    resource_type: "raw",
    use_filename: true,
    unique_filename: false,
    access_mode: "public"
});

        const resumeUrl = cloudUpload.secure_url;
        const analysis = analyzeResume(resumeText);

        const sql = `
            INSERT INTO resumes 
            (file_name, resume_text, ats_score, skills_found, missing_skills, suggestions, resume_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(
            sql,
            [
                fileName,
                resumeText,
                analysis.ats_score,
                analysis.skills_found,
                analysis.missing_skills,
                analysis.suggestions,
                resumeUrl
            ],
            (error, result) => {
                if (error) {
                    return res.status(500).json({
                        message: "Database error",
                        error: error.message
                    });
                }

                res.status(201).json({
                    message: "Resume analyzed successfully",
                    resumeId: result.insertId,
                    fileName,
                    resumeUrl,
                    atsScore: analysis.ats_score,
                    skillsFound: analysis.skills_found,
                    missingSkills: analysis.missing_skills,
                    suggestions: analysis.suggestions
                });
            }
        );

    } catch (error) {
        res.status(500).json({
            message: "Upload failed",
            error: error.message
        });
    }
});

router.get("/", (req, res) => {
    const sql = `
        SELECT
            id,
            file_name,
            resume_url,
            ats_score,
            skills_found,
            missing_skills,
            suggestions,
            created_at
        FROM resumes
        ORDER BY id DESC
    `;

    db.query(sql, (error, results) => {
        if (error) {
            return res.status(500).json({
                message: "Database error",
                error: error.message
            });
        }

        res.json(results);
    });
});

router.get("/history", (req, res) => {
    const sql = `
        SELECT
            id,
            file_name,
            resume_url,
            ats_score,
            skills_found,
            missing_skills,
            suggestions,
            created_at
        FROM resumes
        ORDER BY created_at DESC
    `;

    db.query(sql, (error, results) => {
        if (error) {
            return res.status(500).json({
                message: "Database error",
                error: error.message
            });
        }

        res.json(results);
    });
});

router.delete("/:id", (req, res) => {
    const { id } = req.params;

    db.query(
        "DELETE FROM resumes WHERE id = ?",
        [id],
        (error) => {
            if (error) {
                return res.status(500).json({
                    message: "Delete failed",
                    error: error.message
                });
            }

            res.json({
                message: "Resume deleted successfully"
            });
        }
    );
});

module.exports = router;