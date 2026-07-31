import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { login as loginRequest, logout as logoutRequest, getProfile } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const loadProfile = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setInitializing(false);
      return;
    }
    try {
      const profile = await getProfile();
      setUser(profile);
    } catch {
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setInitializing(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
    // Allow the axios interceptor to force a logout from anywhere in the app.
    function handleForceLogout() {
      setUser(null);
    }
    window.addEventListener("auth:logout", handleForceLogout);
    return () => window.removeEventListener("auth:logout", handleForceLogout);
  }, [loadProfile]);

  async function login(username, password) {
    await loginRequest(username, password);
    const profile = await getProfile();
    setUser(profile);
    return profile;
  }

  function logout() {
    logoutRequest();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, initializing, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
