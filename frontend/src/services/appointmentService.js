import api from "./api";

export async function getAppointments() {
  const response = await api.get("/appointments/");
  return response.data;
}

export async function createAppointment(appointment) {
  const response = await api.post("/appointments/", appointment);
  return response.data;
}

export async function updateAppointment(id, appointment) {
  const response = await api.put(`/appointments/${id}`, appointment);
  return response.data;
}

export async function deleteAppointment(id) {
  const response = await api.delete(`/appointments/${id}`);
  return response.data;
}