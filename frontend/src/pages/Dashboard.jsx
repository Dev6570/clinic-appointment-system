import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Stethoscope,
  Users,
  CalendarClock,
  Clock3,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { getDashboardSummary, getTodayStats } from "../services/dashboardService";
import { getAppointments, updateAppointment, deleteAppointment } from "../services/appointmentService";
import { getDoctors } from "../services/doctorService";
import { getPatients } from "../services/patientService";
import { useToast } from "../context/ToastContext";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { IconButton } from "../components/ui";

const STATUS_COLORS = { Scheduled: "#e2a63b", Completed: "#3fa262", Cancelled: "#c1502e" };

// toISOString() converts to UTC first, which silently shifts the date for
// timezones ahead of UTC (e.g. IST) - most noticeable between midnight and
// the UTC offset each day, when it would report "today" as still being
// yesterday. Building from local date parts avoids that.
function todayISO() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [today, setToday] = useState(null);
  const [todayAppts, setTodayAppts] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const { notify } = useToast();

  async function loadStats() {
    try {
      const [summaryData, todayData, appts, docs, pats] = await Promise.all([
        getDashboardSummary(),
        getTodayStats(),
        getAppointments(),
        getDoctors(),
        getPatients(),
      ]);
      setSummary(summaryData);
      setToday(todayData);
      setDoctors(docs);
      setPatients(pats);
      setTodayAppts(
        appts
          .filter((a) => a.appointment_date === todayISO())
          .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
      );
    } catch {
      notify("Couldn't load dashboard stats. Try refreshing.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function doctorName(id) {
    return doctors.find((d) => d.doctor_id === id)?.doctor_name || "Unknown doctor";
  }
  function patientName(id) {
    return patients.find((p) => p.patient_id === id)?.patient_name || "Unknown patient";
  }

  async function markCompleted(appt) {
    setActingId(appt.appointment_id);
    try {
      await updateAppointment(appt.appointment_id, { ...appt, status: "Completed" });
      notify("Marked as completed.", "success");
      loadStats();
    } catch {
      notify("Couldn't update that appointment.", "error");
    } finally {
      setActingId(null);
    }
  }

  async function cancelAppt(appt) {
    setActingId(appt.appointment_id);
    try {
      await deleteAppointment(appt.appointment_id);
      notify("Appointment cancelled.", "success");
      loadStats();
    } catch {
      notify("Couldn't cancel that appointment.", "error");
    } finally {
      setActingId(null);
    }
  }

  const pieData = summary
    ? [
        { name: "Scheduled", value: summary.scheduled_appointments },
        { name: "Completed", value: summary.completed_appointments },
        { name: "Cancelled", value: summary.cancelled_appointments },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="space-y-8">
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl2 bg-white border border-ink-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <section>
            <h2 className="text-sm font-semibold text-ink-400 uppercase tracking-wide mb-3">
              Overall summary
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Doctors on staff" value={summary?.total_doctors ?? 0} icon={Stethoscope} tone="teal" />
              <StatCard label="Registered patients" value={summary?.total_patients ?? 0} icon={Users} tone="ink" />
              <StatCard label="Total appointments" value={summary?.total_appointments ?? 0} icon={CalendarClock} tone="amber" />
              <StatCard label="Completed to date" value={summary?.completed_appointments ?? 0} icon={CheckCircle2} tone="sage" />
            </div>
          </section>

          <section className="grid lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3 bg-white rounded-xl2 border border-ink-100 shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display text-lg text-ink-900">Today, {today?.date}</h2>
                  <p className="text-sm text-ink-400">A quick read on the day's desk activity</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MiniStat icon={CalendarClock} label="Today's visits" value={today?.appointments_today} tone="ink" />
                <MiniStat icon={Clock3} label="Scheduled" value={today?.scheduled_today} tone="amber" />
                <MiniStat icon={CheckCircle2} label="Completed" value={today?.completed_today} tone="sage" />
                <MiniStat icon={XCircle} label="Cancelled" value={today?.cancelled_today} tone="clay" />
              </div>

              <div className="mt-5 pt-5 border-t border-ink-50">
                {todayAppts.length === 0 ? (
                  <p className="text-sm text-ink-300 text-center py-4">No appointments booked for today.</p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {todayAppts.map((a) => (
                      <div
                        key={a.appointment_id}
                        className="flex items-center gap-3 rounded-lg border border-ink-50 px-3 py-2.5"
                      >
                        <span className="text-xs font-medium text-ink-400 w-14 shrink-0">{a.appointment_time?.slice(0, 5)}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-ink-800 font-medium truncate">{patientName(a.patient_id)}</p>
                          <p className="text-xs text-ink-400 truncate">{doctorName(a.doctor_id)}</p>
                        </div>
                        <StatusBadge status={a.status} />
                        {a.status === "Scheduled" && (
                          <div className="flex items-center gap-0.5 shrink-0">
                            <IconButton
                              tone="teal"
                              onClick={() => markCompleted(a)}
                              disabled={actingId === a.appointment_id}
                              aria-label="Mark completed"
                            >
                              <CheckCircle2 size={15} />
                            </IconButton>
                            <IconButton
                              tone="clay"
                              onClick={() => cancelAppt(a)}
                              disabled={actingId === a.appointment_id}
                              aria-label="Cancel appointment"
                            >
                              <XCircle size={15} />
                            </IconButton>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-xl2 border border-ink-100 shadow-card p-6 flex flex-col">
              <h2 className="font-display text-lg text-ink-900 mb-1">Appointment mix</h2>
              <p className="text-sm text-ink-400 mb-2">All-time status breakdown</p>
              {pieData.length > 0 ? (
                <div className="flex-1 min-h-[180px]">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={3}>
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-1">
                    {pieData.map((d) => (
                      <span key={d.name} className="flex items-center gap-1.5 text-xs text-ink-500">
                        <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[d.name] }} />
                        {d.name} - {d.value}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-ink-300 flex-1 flex items-center justify-center">No appointments booked yet.</p>
              )}
            </div>
          </section>
        </>
      )}

      <section>
        <h2 className="text-sm font-semibold text-ink-400 uppercase tracking-wide mb-3">Modules</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <ModuleCard to="/doctors" icon={Stethoscope} title="Doctors" desc="Add and manage clinicians" />
          <ModuleCard to="/patients" icon={Users} title="Patients" desc="Register and search records" />
          <ModuleCard to="/appointments" icon={CalendarClock} title="Appointments" desc="Book and update visits" />
          <ModuleCard to="/schedule" icon={Clock3} title="Schedule" desc="Doctor calendars, open slots" />
          <ModuleCard to="/reports" icon={ArrowUpRight} title="Reports" desc="Doctor and patient performance" />
        </div>
      </section>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, tone }) {
  const tones = {
    ink: "text-ink-500 bg-ink-50",
    amber: "text-amber-600 bg-amber-50",
    sage: "text-sage-500 bg-sage-50",
    clay: "text-clay-500 bg-clay-50",
  };
  return (
    <div className="rounded-lg border border-ink-50 p-3">
      <div className={`h-7 w-7 rounded-md flex items-center justify-center mb-2 ${tones[tone]}`}>
        <Icon size={14} />
      </div>
      <p className="text-lg font-semibold text-ink-900 leading-none">{value ?? 0}</p>
      <p className="text-[11px] text-ink-400 mt-1">{label}</p>
    </div>
  );
}

function ModuleCard({ to, icon: Icon, title, desc }) {
  return (
    <Link
      to={to}
      className="group bg-white rounded-xl2 border border-ink-100 shadow-card p-5 hover:border-teal-300 hover:shadow-pop transition-all"
    >
      <div className="h-10 w-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
        <Icon size={18} />
      </div>
      <p className="font-medium text-ink-900 flex items-center gap-1">
        {title}
        <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-teal-500" />
      </p>
      <p className="text-xs text-ink-400 mt-1">{desc}</p>
    </Link>
  );
}
