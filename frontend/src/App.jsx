import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Doctors from "./pages/Doctors";
import Patients from "./pages/Patients";
import Appointments from "./pages/Appointments";
import Schedule from "./pages/Schedule";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import AuditLog from "./pages/AuditLog";
import MyPortal from "./pages/MyPortal";

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<ProtectedRoute roles={["Admin", "Receptionist"]}><Dashboard /></ProtectedRoute>} />
            <Route path="/doctors" element={<ProtectedRoute roles={["Admin", "Receptionist"]}><Doctors /></ProtectedRoute>} />
            <Route path="/patients" element={<ProtectedRoute roles={["Admin", "Receptionist"]}><Patients /></ProtectedRoute>} />
            <Route path="/appointments" element={<ProtectedRoute roles={["Admin", "Receptionist", "Doctor"]}><Appointments /></ProtectedRoute>} />
            <Route path="/schedule" element={<ProtectedRoute roles={["Admin", "Receptionist", "Doctor"]}><Schedule /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute roles={["Admin"]}><Reports /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute roles={["Admin"]}><Users /></ProtectedRoute>} />
            <Route path="/audit-log" element={<ProtectedRoute roles={["Admin"]}><AuditLog /></ProtectedRoute>} />
            <Route path="/my-portal" element={<ProtectedRoute roles={["Patient"]}><MyPortal /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
