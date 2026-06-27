const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

db.connect((error) => {
    if (error) {
        console.error("MySQL connection error:", error.message);
        return;
    }
    console.log("MySQL connected successfully");
});

module.exports = db;