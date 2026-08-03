import api from "./api";

export async function login(username, password) {
  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);

  const response = await api.post("/login", formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  localStorage.setItem("token", response.data.access_token);
  return response.data;
}

export async function logout() {
  try {
    await api.post("/logout");
  } catch {
    // best-effort - always clear the local token regardless
  } finally {
    localStorage.removeItem("token");
  }
}

export async function getProfile() {
  const response = await api.get("/profile");
  return response.data;
}