import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getDashboardSummary, getTodayStats } from "../services/dashboardService";

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [today, setToday] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStats() {
      try {
        const [summaryData, todayData] = await Promise.all([
          getDashboardSummary(),
          getTodayStats(),
        ]);
        setSummary(summaryData);
        setToday(todayData);
      } catch (err) {
        setError("Failed to load dashboard stats.");
      }
    }
    loadStats();
  }, []);

  const cardStyle = {
    border: "1px solid #ccc",
    borderRadius: "8px",
    padding: "16px",
    minWidth: "140px",
    textAlign: "center",
  };

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", maxWidth: "900px", margin: "0 auto" }}>
      <h1>Dashboard</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {summary && (
        <>
          <h3>Overall Summary</h3>
          <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
            <div style={cardStyle}>
              <div style={{ fontSize: "24px", fontWeight: "bold" }}>{summary.total_doctors}</div>
              <div>Doctors</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: "24px", fontWeight: "bold" }}>{summary.total_patients}</div>
              <div>Patients</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: "24px", fontWeight: "bold" }}>{summary.total_appointments}</div>
              <div>Total Appointments</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: "24px", fontWeight: "bold" }}>{summary.scheduled_appointments}</div>
              <div>Scheduled</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: "24px", fontWeight: "bold" }}>{summary.completed_appointments}</div>
              <div>Completed</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: "24px", fontWeight: "bold" }}>{summary.cancelled_appointments}</div>
              <div>Cancelled</div>
            </div>
          </div>
        </>
      )}

      {today && (
        <>
          <h3>Today ({today.date})</h3>
          <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
            <div style={cardStyle}>
              <div style={{ fontSize: "24px", fontWeight: "bold" }}>{today.appointments_today}</div>
              <div>Today's Appointments</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: "24px", fontWeight: "bold" }}>{today.scheduled_today}</div>
              <div>Scheduled Today</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: "24px", fontWeight: "bold" }}>{today.completed_today}</div>
              <div>Completed Today</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: "24px", fontWeight: "bold" }}>{today.cancelled_today}</div>
              <div>Cancelled Today</div>
            </div>
          </div>
        </>
      )}

      <h3>Modules</h3>
      <nav style={{ display: "flex", gap: "16px" }}>
        <Link to="/doctors">Doctors</Link>
        <Link to="/patients">Patients</Link>
        <Link to="/appointments">Appointments</Link>
      </nav>
    </div>
  );
}

export default Dashboard;