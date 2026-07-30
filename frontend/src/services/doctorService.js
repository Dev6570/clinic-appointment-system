import api from "./api";

export async function getDoctors() {
  const response = await api.get("/doctors/");
  return response.data;
}

export async function createDoctor(doctor) {
  const response = await api.post("/doctors/", doctor);
  return response.data;
}

export async function updateDoctor(id, doctor) {
  const response = await api.put(`/doctors/${id}`, doctor);
  return response.data;
}

export async function deleteDoctor(id) {
  const response = await api.delete(`/doctors/${id}`);
  return response.data;
}