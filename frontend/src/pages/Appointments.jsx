import { useState, useEffect } from "react";
import { getAppointments, createAppointment, updateAppointment, deleteAppointment } from "../services/appointmentService";
import { getDoctors } from "../services/doctorService";
import { getPatients } from "../services/patientService";

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    patient_id: "",
    doctor_id: "",
    appointment_date: "",
    appointment_time: "",
    reason: "",
    status: "Scheduled",
  });

  async function loadAll() {
    try {
      const [appts, docs, pats] = await Promise.all([getAppointments(), getDoctors(), getPatients()]);
      setAppointments(appts);
      setDoctors(docs);
      setPatients(pats);
    } catch (err) {
      setError("Failed to load data. Are you logged in?");
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function resetForm() {
    setForm({ patient_id: "", doctor_id: "", appointment_date: "", appointment_time: "", reason: "", status: "Scheduled" });
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const payload = {
      ...form,
      patient_id: parseInt(form.patient_id),
      doctor_id: parseInt(form.doctor_id),
    };
    try {
      if (editingId) {
        await updateAppointment(editingId, payload);
      } else {
        await createAppointment(payload);
      }
      resetForm();
      loadAll();
    } catch (err) {
      if (err.response && err.response.status === 409) {
        setError("This doctor is already booked at that date and time.");
      } else {
        setError("Failed to save appointment. Check the fields and try again.");
      }
    }
  }

  function handleEdit(appt) {
    setEditingId(appt.appointment_id);
    setForm({
      patient_id: appt.patient_id,
      doctor_id: appt.doctor_id,
      appointment_date: appt.appointment_date,
      appointment_time: appt.appointment_time,
      reason: appt.reason || "",
      status: appt.status || "Scheduled",
    });
  }

  async function handleDelete(id) {
    if (!confirm("Cancel this appointment?")) return;
    try {
      await deleteAppointment(id);
      loadAll();
    } catch (err) {
      setError("Failed to cancel appointment.");
    }
  }

  function doctorName(id) {
    const d = doctors.find((doc) => doc.doctor_id === id);
    return d ? d.doctor_name : "Unknown";
  }

  function patientName(id) {
    const p = patients.find((pat) => pat.patient_id === id);
    return p ? p.patient_name : "Unknown";
  }

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", maxWidth: "900px", margin: "0 auto" }}>
      <h1>Appointments</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: "30px", border: "1px solid #ccc", padding: "16px" }}>
        <h3>{editingId ? "Edit Appointment" : "Book Appointment"}</h3>

        <div style={{ marginBottom: "8px" }}>
          <select name="patient_id" value={form.patient_id} onChange={handleChange} required style={{ width: "100%", padding: "8px" }}>
            <option value="">Select Patient</option>
            {patients.map((p) => (
              <option key={p.patient_id} value={p.patient_id}>{p.patient_name}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "8px" }}>
          <select name="doctor_id" value={form.doctor_id} onChange={handleChange} required style={{ width: "100%", padding: "8px" }}>
            <option value="">Select Doctor</option>
            {doctors.map((d) => (
              <option key={d.doctor_id} value={d.doctor_id}>{d.doctor_name} ({d.specialization})</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "8px" }}>
          <input name="appointment_date" type="date" value={form.appointment_date} onChange={handleChange} required style={{ width: "100%", padding: "8px" }} />
        </div>

        <div style={{ marginBottom: "8px" }}>
          <input name="appointment_time" type="time" value={form.appointment_time} onChange={handleChange} required style={{ width: "100%", padding: "8px" }} />
        </div>

        <div style={{ marginBottom: "8px" }}>
          <input name="reason" placeholder="Reason for visit" value={form.reason} onChange={handleChange} style={{ width: "100%", padding: "8px" }} />
        </div>

        {editingId && (
          <div style={{ marginBottom: "8px" }}>
            <select name="status" value={form.status} onChange={handleChange} style={{ width: "100%", padding: "8px" }}>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        )}

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit" style={{ padding: "8px 16px", marginRight: "8px" }}>
          {editingId ? "Update" : "Book Appointment"}
        </button>
        {editingId && (
          <button type="button" onClick={resetForm} style={{ padding: "8px 16px" }}>
            Cancel
          </button>
        )}
      </form>

      <h3>Appointment List</h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #333", textAlign: "left" }}>
            <th>Patient</th>
            <th>Doctor</th>
            <th>Date</th>
            <th>Time</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((a) => (
            <tr key={a.appointment_id} style={{ borderBottom: "1px solid #ddd" }}>
              <td>{patientName(a.patient_id)}</td>
              <td>{doctorName(a.doctor_id)}</td>
              <td>{a.appointment_date}</td>
              <td>{a.appointment_time}</td>
              <td>{a.status}</td>
              <td>
                <button onClick={() => handleEdit(a)} style={{ marginRight: "8px" }}>Edit</button>
                <button onClick={() => handleDelete(a.appointment_id)}>Cancel</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Appointments;