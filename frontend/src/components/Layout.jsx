import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Stethoscope,
  Users,
  CalendarClock,
  BarChart3,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/doctors", label: "Doctors", icon: Stethoscope },
  { to: "/patients", label: "Patients", icon: Users },
  { to: "/appointments", label: "Appointments", icon: CalendarClock },
  { to: "/reports", label: "Reports", icon: BarChart3 },
];

const TITLES = {
  "/dashboard": ["Dashboard", "Today's clinic activity at a glance"],
  "/doctors": ["Doctors", "Manage the clinicians on staff"],
  "/patients": ["Patients", "Records for everyone registered at the desk"],
  "/appointments": ["Appointments", "Book, reschedule, and track visits"],
  "/reports": ["Reports", "Performance across doctors and patients"],
};

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [title, subtitle] = TITLES[location.pathname] || ["Clinic Desk", ""];

  return (
    <div className="min-h-screen bg-paper flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-ink-900/40 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static z-40 h-screen w-64 shrink-0 bg-ink-900 text-ink-100 flex flex-col transition-transform duration-200
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex items-center gap-2.5 px-6 h-20 border-b border-white/10">
          <div className="h-8 w-8 rounded-lg bg-teal-500 flex items-center justify-center shrink-0">
            <Stethoscope size={17} className="text-white" />
          </div>
          <div>
            <p className="font-display text-[17px] leading-none text-white">Clinic Desk</p>
            <p className="text-[11px] text-ink-300 mt-1 tracking-wide">Patient &amp; Appointment Suite</p>
          </div>
          <button
            className="ml-auto lg:hidden text-ink-300"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                ${
                  isActive
                    ? "bg-white/[0.07] text-white"
                    : "text-ink-300 hover:text-white hover:bg-white/[0.04]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full transition-colors ${
                      isActive ? "bg-teal-400" : "bg-transparent"
                    }`}
                  />
                  <Icon size={18} strokeWidth={2} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="h-9 w-9 rounded-full bg-teal-500/20 text-teal-200 border border-teal-400/30 flex items-center justify-center text-xs font-semibold shrink-0">
              {initials(user?.full_name) || "U"}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-white truncate">{user?.full_name}</p>
              <p className="text-[11px] text-ink-300 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-2 w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-300 hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-20 shrink-0 flex items-center gap-4 px-5 lg:px-8 border-b border-ink-100 bg-white/80 backdrop-blur sticky top-0 z-20">
          <button
            className="lg:hidden text-ink-500"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-ink-900 truncate">{title}</h1>
            {subtitle && <p className="text-sm text-ink-400 truncate">{subtitle}</p>}
          </div>
        </header>

        <main className="flex-1 p-5 lg:p-8 animate-fade-in">
          <div className="max-w-6xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
