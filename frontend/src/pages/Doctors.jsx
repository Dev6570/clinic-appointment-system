import { useState, useEffect } from "react";
import { getDoctors, createDoctor, updateDoctor, deleteDoctor } from "../services/doctorService";

function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    doctor_name: "",
    specialization: "",
    phone: "",
    email: "",
    experience: "",
  });

  async function loadDoctors() {
    try {
      const data = await getDoctors();
      setDoctors(data);
    } catch (err) {
      setError("Failed to load doctors. Are you logged in?");
    }
  }

  useEffect(() => {
    loadDoctors();
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function resetForm() {
    setForm({ doctor_name: "", specialization: "", phone: "", email: "", experience: "" });
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const payload = {
      ...form,
      experience: form.experience ? parseInt(form.experience) : null,
    };
    try {
      if (editingId) {
        await updateDoctor(editingId, payload);
      } else {
        await createDoctor(payload);
      }
      resetForm();
      loadDoctors();
    } catch (err) {
      setError("Failed to save doctor. Check the fields and try again.");
    }
  }

  function handleEdit(doctor) {
    setEditingId(doctor.doctor_id);
    setForm({
      doctor_name: doctor.doctor_name,
      specialization: doctor.specialization,
      phone: doctor.phone || "",
      email: doctor.email || "",
      experience: doctor.experience || "",
    });
  }

  async function handleDelete(id) {
    if (!confirm("Remove this doctor?")) return;
    try {
      await deleteDoctor(id);
      loadDoctors();
    } catch (err) {
      setError("Failed to delete doctor.");
    }
  }

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Doctors</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: "30px", border: "1px solid #ccc", padding: "16px" }}>
        <h3>{editingId ? "Edit Doctor" : "Add Doctor"}</h3>
        <div style={{ marginBottom: "8px" }}>
          <input name="doctor_name" placeholder="Doctor Name" value={form.doctor_name} onChange={handleChange} required style={{ width: "100%", padding: "8px" }} />
        </div>
        <div style={{ marginBottom: "8px" }}>
          <input name="specialization" placeholder="Specialization" value={form.specialization} onChange={handleChange} required style={{ width: "100%", padding: "8px" }} />
        </div>
        <div style={{ marginBottom: "8px" }}>
          <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} style={{ width: "100%", padding: "8px" }} />
        </div>
        <div style={{ marginBottom: "8px" }}>
          <input name="email" placeholder="Email" value={form.email} onChange={handleChange} style={{ width: "100%", padding: "8px" }} />
        </div>
        <div style={{ marginBottom: "8px" }}>
          <input name="experience" placeholder="Experience (years)" type="number" value={form.experience} onChange={handleChange} style={{ width: "100%", padding: "8px" }} />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" style={{ padding: "8px 16px", marginRight: "8px" }}>
          {editingId ? "Update" : "Save"}
        </button>
        {editingId && (
          <button type="button" onClick={resetForm} style={{ padding: "8px 16px" }}>
            Cancel
          </button>
        )}
      </form>

      <h3>Doctor List</h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #333", textAlign: "left" }}>
            <th>Name</th>
            <th>Specialization</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Experience</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {doctors.map((doc) => (
            <tr key={doc.doctor_id} style={{ borderBottom: "1px solid #ddd" }}>
              <td>{doc.doctor_name}</td>
              <td>{doc.specialization}</td>
              <td>{doc.phone}</td>
              <td>{doc.email}</td>
              <td>{doc.experience}</td>
              <td>
                <button onClick={() => handleEdit(doc)} style={{ marginRight: "8px" }}>Edit</button>
                <button onClick={() => handleDelete(doc.doctor_id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Doctors;