import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "./Layout";

const DEFAULT_ROUTE = {
  Admin: "/dashboard",
  Receptionist: "/dashboard",
  Doctor: "/schedule",
  Patient: "/my-portal",
};

// `roles`, if provided, restricts this route to those roles. This is a UX
// convenience only — the real enforcement lives in the backend on every
// endpoint. Hiding a page here just avoids showing staff-only screens to
// someone who couldn't fetch their data anyway.
export default function ProtectedRoute({ children, roles }) {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-paper">
        <div className="h-8 w-8 rounded-full border-2 border-teal-200 border-t-teal-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={DEFAULT_ROUTE[user.role] || "/dashboard"} replace />;
  }

  return <Layout>{children}</Layout>;
}
