import { useState, useEffect } from "react";
import { getDailyReport, getDoctorReport, getPatientReport } from "../services/reportService";

function Reports() {
  const [daily, setDaily] = useState(null);
  const [doctorReport, setDoctorReport] = useState([]);
  const [patientReport, setPatientReport] = useState([]);
  const [reportDate, setReportDate] = useState("");
  const [error, setError] = useState("");

  async function loadDaily(dateValue) {
    try {
      const data = await getDailyReport(dateValue || undefined);
      setDaily(data);
    } catch (err) {
      setError("Failed to load daily report.");
    }
  }

  async function loadAll() {
    try {
      const [docs, pats] = await Promise.all([getDoctorReport(), getPatientReport()]);
      setDoctorReport(docs.report);
      setPatientReport(pats.report);
    } catch (err) {
      setError("Failed to load reports.");
    }
  }

  useEffect(() => {
    loadDaily();
    loadAll();
  }, []);

  function handleDateChange(e) {
    setReportDate(e.target.value);
    loadDaily(e.target.value);
  }

  const cardStyle = {
    border: "1px solid #ccc",
    borderRadius: "8px",
    padding: "16px",
    minWidth: "120px",
    textAlign: "center",
  };

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", maxWidth: "900px", margin: "0 auto" }}>
      <h1>Reports</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <h3>Daily Report</h3>
      <input type="date" value={reportDate} onChange={handleDateChange} style={{ padding: "8px", marginBottom: "16px" }} />
      {daily && (
        <div style={{ display: "flex", gap: "16px", marginBottom: "30px", flexWrap: "wrap" }}>
          <div style={cardStyle}><div style={{ fontSize: "22px", fontWeight: "bold" }}>{daily.total_appointments}</div><div>Total ({daily.date})</div></div>
          <div style={cardStyle}><div style={{ fontSize: "22px", fontWeight: "bold" }}>{daily.scheduled}</div><div>Scheduled</div></div>
          <div style={cardStyle}><div style={{ fontSize: "22px", fontWeight: "bold" }}>{daily.completed}</div><div>Completed</div></div>
          <div style={cardStyle}><div style={{ fontSize: "22px", fontWeight: "bold" }}>{daily.cancelled}</div><div>Cancelled</div></div>
        </div>
      )}

      <h3>Doctor Report</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #333", textAlign: "left" }}>
            <th>Doctor</th><th>Specialization</th><th>Total</th><th>Completed</th><th>Cancelled</th>
          </tr>
        </thead>
        <tbody>
          {doctorReport.map((d) => (
            <tr key={d.doctor_id} style={{ borderBottom: "1px solid #ddd" }}>
              <td>{d.doctor_name}</td>
              <td>{d.specialization}</td>
              <td>{d.total_appointments}</td>
              <td>{d.completed}</td>
              <td>{d.cancelled}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Patient Report</h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #333", textAlign: "left" }}>
            <th>Patient</th><th>Total</th><th>Completed</th><th>Cancelled</th>
          </tr>
        </thead>
        <tbody>
          {patientReport.map((p) => (
            <tr key={p.patient_id} style={{ borderBottom: "1px solid #ddd" }}>
              <td>{p.patient_name}</td>
              <td>{p.total_appointments}</td>
              <td>{p.completed}</td>
              <td>{p.cancelled}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Reports;