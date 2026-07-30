import api from "./api";

export async function getDashboardSummary() {
  const response = await api.get("/dashboard/");
  return response.data;
}

export async function getTodayStats() {
  const response = await api.get("/dashboard/today");
  return response.data;
}