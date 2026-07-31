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
import { useToast } from "../context/ToastContext";
import StatCard from "../components/StatCard";

const STATUS_COLORS = { Scheduled: "#e2a63b", Completed: "#3fa262", Cancelled: "#c1502e" };

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [today, setToday] = useState(null);
  const [loading, setLoading] = useState(true);
  const { notify } = useToast();

  useEffect(() => {
    async function loadStats() {
      try {
        const [summaryData, todayData] = await Promise.all([getDashboardSummary(), getTodayStats()]);
        setSummary(summaryData);
        setToday(todayData);
      } catch {
        notify("Couldn't load dashboard stats. Try refreshing.", "error");
      } finally {
        setLoading(false);
      }
    }
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                        {d.name} · {d.value}
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ModuleCard to="/doctors" icon={Stethoscope} title="Doctors" desc="Add and manage clinicians" />
          <ModuleCard to="/patients" icon={Users} title="Patients" desc="Register and search records" />
          <ModuleCard to="/appointments" icon={CalendarClock} title="Appointments" desc="Book and update visits" />
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
