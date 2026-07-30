import api from "./api";

export async function getPatients() {
  const response = await api.get("/patients/");
  return response.data;
}

export async function createPatient(patient) {
  const response = await api.post("/patients/", patient);
  return response.data;
}

export async function updatePatient(id, patient) {
  const response = await api.put(`/patients/${id}`, patient);
  return response.data;
}

export async function deletePatient(id) {
  const response = await api.delete(`/patients/${id}`);
  return response.data;
}