import { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "./App.css";

function App() {
  const [resume, setResume] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/resumes/history");
      setHistory(response.data);
    } catch (error) {
      console.log("History fetch error:", error);
    }
  };

  const deleteResume = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/resumes/${id}`);
      fetchHistory();
    } catch (error) {
      console.log("Delete error:", error);
      alert("Delete failed");
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleUpload = async () => {
    if (!resume) {
      alert("Please select a resume PDF first");
      return;
    }

    const formData = new FormData();
    formData.append("resume", resume);

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:5000/api/resumes/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setResult(response.data);
      setResume(null);
      fetchHistory();
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const chartData = history.slice(0, 6).map((item) => ({
    name:
      item.file_name.length > 12
        ? item.file_name.substring(0, 12) + "..."
        : item.file_name,
    score: item.ats_score,
  }));

  const strongCount = history.filter((item) => item.ats_score >= 75).length;
  const averageCount = history.filter(
    (item) => item.ats_score >= 50 && item.ats_score < 75
  ).length;
  const weakCount = history.filter((item) => item.ats_score < 50).length;

  const pieData = [
    { name: "Strong", value: strongCount },
    { name: "Average", value: averageCount },
    { name: "Weak", value: weakCount },
  ];

  const filteredHistory = history.filter(
    (item) =>
      item.file_name.toLowerCase().includes(search.toLowerCase()) ||
      item.skills_found?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app">
      <header className="header">
        <h1>AI Resume Analyzer</h1>
        <p>
          Analyze resumes, calculate ATS score, detect skills, and save previous reports.
        </p>
      </header>

      <main className="container">
        <section className="upload-card">
          <h2>Upload Resume</h2>
          <p>Select a PDF resume to generate ATS score and improvement suggestions.</p>

          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setResume(e.target.files[0])}
          />

          <button onClick={handleUpload} disabled={loading}>
            {loading ? "Analyzing..." : "Analyze Resume"}
          </button>

          {result && (
            <div className="result">
              <h2>{result.message}</h2>
              <p>
                <strong>File:</strong> {result.fileName}
              </p>

              <div className="score-box">
                <h3>ATS Score</h3>
                <h1>{result.atsScore}/100</h1>
              </div>

              <h3>Skills Found</h3>
              <p>{result.skillsFound || "No skills found"}</p>

              <h3>Missing Skills</h3>
              <p>{result.missingSkills || "No missing skills"}</p>

              <h3>Suggestions</h3>
              <p>{result.suggestions}</p>
            </div>
          )}
        </section>

        <section className="dashboard">
          <div className="dashboard-header">
            <h2>Previous Analysis Dashboard</h2>
            <input
              type="text"
              placeholder="Search by file name or skill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="stats">
            <div className="stat-card">
              <h3>{history.length}</h3>
              <p>Total Resumes</p>
            </div>

            <div className="stat-card">
              <h3>
                {history.length
                  ? Math.round(
                      history.reduce((sum, item) => sum + item.ats_score, 0) /
                        history.length
                    )
                  : 0}
              </h3>
              <p>Average ATS Score</p>
            </div>

            <div className="stat-card">
              <h3>{strongCount}</h3>
              <p>Strong Resumes</p>
            </div>
          </div>

          <div className="charts-section">
            <div className="chart-card">
              <h3>Recent ATS Scores</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="score" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>Resume Strength Distribution</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={90}
                    label
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="history-list">
            {filteredHistory.length === 0 ? (
              <p>No resume analysis found.</p>
            ) : (
              filteredHistory.map((item) => (
                <div className="history-card" key={item.id}>
                  <div>
                    <h3>{item.file_name}</h3>
                    <p>
                      <strong>Skills:</strong> {item.skills_found || "Not found"}
                    </p>
                    <p>
                      <strong>Missing:</strong> {item.missing_skills || "None"}
                    </p>
                    <p>
                      <strong>Suggestions:</strong> {item.suggestions}
                    </p>
                    {item.resume_url && (
  <a
    href={item.resume_url}
    target="_blank"
    rel="noreferrer"
    className="view-btn"
  >
    View Uploaded Resume
  </a>
)}
                  </div>

                  <div>
                    <div className="mini-score">
                      <span>{item.ats_score}</span>
                      <p>ATS</p>
                    </div>

                    <button
                      className="delete-btn"
                      onClick={() => deleteResume(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;