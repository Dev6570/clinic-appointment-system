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

  // Guard against bad/unexpected role data (e.g. legacy accounts) causing a
  // silent redirect loop — show a clear message instead of a blank page.
  if (!DEFAULT_ROUTE[user.role]) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-paper px-6">
        <div className="max-w-sm text-center">
          <p className="text-ink-800 font-medium mb-1">Unrecognized account role</p>
          <p className="text-sm text-ink-400">
            This account's role ("{user.role}") isn't one this app knows how to route. Contact an administrator to fix it in User accounts.
          </p>
        </div>
      </div>
    );
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={DEFAULT_ROUTE[user.role] || "/dashboard"} replace />;
  }

  return <Layout>{children}</Layout>;
}
