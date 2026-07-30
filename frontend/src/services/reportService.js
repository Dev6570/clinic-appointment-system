import api from "./api";

export async function getDailyReport(reportDate) {
  const params = reportDate ? { report_date: reportDate } : {};
  const response = await api.get("/reports/daily", { params });
  return response.data;
}

export async function getDoctorReport() {
  const response = await api.get("/reports/doctors");
  return response.data;
}

export async function getPatientReport() {
  const response = await api.get("/reports/patients");
  return response.data;
}