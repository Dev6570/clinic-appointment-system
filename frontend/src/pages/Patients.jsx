import { useState, useEffect } from "react";
import { getPatients, createPatient, updatePatient, deletePatient } from "../services/patientService";

function Patients() {
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    patient_name: "",
    age: "",
    gender: "",
    phone: "",
    email: "",
    address: "",
    blood_group: "",
  });

  async function loadPatients() {
    try {
      const data = await getPatients();
      setPatients(data);
    } catch (err) {
      setError("Failed to load patients. Are you logged in?");
    }
  }

  useEffect(() => {
    loadPatients();
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function resetForm() {
    setForm({ patient_name: "", age: "", gender: "", phone: "", email: "", address: "", blood_group: "" });
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const payload = {
      ...form,
      age: form.age ? parseInt(form.age) : null,
    };
    try {
      if (editingId) {
        await updatePatient(editingId, payload);
      } else {
        await createPatient(payload);
      }
      resetForm();
      loadPatients();
    } catch (err) {
      setError("Failed to save patient. Check the fields and try again.");
    }
  }

  function handleEdit(patient) {
    setEditingId(patient.patient_id);
    setForm({
      patient_name: patient.patient_name,
      age: patient.age || "",
      gender: patient.gender || "",
      phone: patient.phone || "",
      email: patient.email || "",
      address: patient.address || "",
      blood_group: patient.blood_group || "",
    });
  }

  async function handleDelete(id) {
    if (!confirm("Remove this patient?")) return;
    try {
      await deletePatient(id);
      loadPatients();
    } catch (err) {
      setError("Failed to delete patient.");
    }
  }

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Patients</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: "30px", border: "1px solid #ccc", padding: "16px" }}>
        <h3>{editingId ? "Edit Patient" : "Register Patient"}</h3>
        <div style={{ marginBottom: "8px" }}>
          <input name="patient_name" placeholder="Patient Name" value={form.patient_name} onChange={handleChange} required style={{ width: "100%", padding: "8px" }} />
        </div>
        <div style={{ marginBottom: "8px" }}>
          <input name="age" placeholder="Age" type="number" value={form.age} onChange={handleChange} style={{ width: "100%", padding: "8px" }} />
        </div>
        <div style={{ marginBottom: "8px" }}>
          <input name="gender" placeholder="Gender" value={form.gender} onChange={handleChange} style={{ width: "100%", padding: "8px" }} />
        </div>
        <div style={{ marginBottom: "8px" }}>
          <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} style={{ width: "100%", padding: "8px" }} />
        </div>
        <div style={{ marginBottom: "8px" }}>
          <input name="email" placeholder="Email" value={form.email} onChange={handleChange} style={{ width: "100%", padding: "8px" }} />
        </div>
        <div style={{ marginBottom: "8px" }}>
          <input name="address" placeholder="Address" value={form.address} onChange={handleChange} style={{ width: "100%", padding: "8px" }} />
        </div>
        <div style={{ marginBottom: "8px" }}>
          <input name="blood_group" placeholder="Blood Group" value={form.blood_group} onChange={handleChange} style={{ width: "100%", padding: "8px" }} />
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

      <h3>Patient List</h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #333", textAlign: "left" }}>
            <th>Name</th>
            <th>Age</th>
            <th>Gender</th>
            <th>Phone</th>
            <th>Blood Group</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {patients.map((p) => (
            <tr key={p.patient_id} style={{ borderBottom: "1px solid #ddd" }}>
              <td>{p.patient_name}</td>
              <td>{p.age}</td>
              <td>{p.gender}</td>
              <td>{p.phone}</td>
              <td>{p.blood_group}</td>
              <td>
                <button onClick={() => handleEdit(p)} style={{ marginRight: "8px" }}>Edit</button>
                <button onClick={() => handleDelete(p.patient_id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Patients;