import { useState, useEffect, useMemo } from "react";
import { CalendarClock, CheckCircle2, XCircle, Clock3, Stethoscope, Users, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getDailyReport, getDoctorReport, getPatientReport } from "../services/reportService";
import { useToast } from "../context/ToastContext";
import StatCard from "../components/StatCard";
import { SearchInput, TableSkeleton, SecondaryButton } from "../components/ui";
import EmptyState from "../components/EmptyState";

function exportCsv(filename, headers, rows) {
  const escape = (val) => {
    const s = String(val ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [daily, setDaily] = useState(null);
  const [doctorReport, setDoctorReport] = useState([]);
  const [patientReport, setPatientReport] = useState([]);
  const [reportDate, setReportDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [patientQuery, setPatientQuery] = useState("");
  const { notify } = useToast();

  async function loadDaily(dateValue) {
    try {
      const data = await getDailyReport(dateValue || undefined);
      setDaily(data);
    } catch {
      notify("Failed to load the daily report.", "error");
    }
  }

  async function loadAll() {
    try {
      const [docs, pats] = await Promise.all([getDoctorReport(), getPatientReport()]);
      setDoctorReport(docs.report);
      setPatientReport(pats.report);
    } catch {
      notify("Failed to load reports.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDaily();
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleDateChange(e) {
    setReportDate(e.target.value);
    loadDaily(e.target.value);
  }

  const doctorChartData = useMemo(
    () =>
      doctorReport
        .slice()
        .sort((a, b) => b.total_appointments - a.total_appointments)
        .slice(0, 8)
        .map((d) => ({ name: d.doctor_name, Completed: d.completed, Cancelled: d.cancelled })),
    [doctorReport]
  );

  const filteredPatients = useMemo(() => {
    const q = patientQuery.trim().toLowerCase();
    if (!q) return patientReport;
    return patientReport.filter((p) => p.patient_name?.toLowerCase().includes(q));
  }, [patientReport, patientQuery]);

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-xl2 border border-ink-100 shadow-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-display text-lg text-ink-900">Daily report</h2>
            <p className="text-sm text-ink-400">Pick a date to see how the desk performed</p>
          </div>
          <input
            type="date"
            value={reportDate}
            onChange={handleDateChange}
            className="rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm text-ink-800 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400"
          />
        </div>
        {daily && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label={`Total · ${daily.date}`} value={daily.total_appointments} icon={CalendarClock} tone="ink" />
            <StatCard label="Scheduled" value={daily.scheduled} icon={Clock3} tone="amber" />
            <StatCard label="Completed" value={daily.completed} icon={CheckCircle2} tone="sage" />
            <StatCard label="Cancelled" value={daily.cancelled} icon={XCircle} tone="clay" />
          </div>
        )}
      </section>

      <section className="bg-white rounded-xl2 border border-ink-100 shadow-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
          <div>
            <h2 className="font-display text-lg text-ink-900">Doctor performance</h2>
            <p className="text-sm text-ink-400 mb-4">Completed vs. cancelled visits, busiest doctors first</p>
          </div>
          {doctorReport.length > 0 && (
            <SecondaryButton
              onClick={() =>
                exportCsv(
                  "doctor-report.csv",
                  ["Doctor", "Specialization", "Total appointments", "Completed", "Cancelled"],
                  doctorReport.map((d) => [d.doctor_name, d.specialization, d.total_appointments, d.completed, d.cancelled])
                )
              }
            >
              <Download size={15} /> Export CSV
            </SecondaryButton>
          )}
        </div>
        {loading ? (
          <div className="h-64 rounded-lg bg-ink-50 animate-pulse" />
        ) : doctorChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={doctorChartData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4eaea" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#5f7c7f" }} interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 12, fill: "#5f7c7f" }} allowDecimals={false} />
              <Tooltip cursor={{ fill: "#f4f7f7" }} />
              <Bar dataKey="Completed" fill="#3fa262" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Cancelled" fill="#c1502e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState icon={Stethoscope} title="No doctor activity yet" message="Completed and cancelled visits will show up here." />
        )}
      </section>

      <section className="bg-white rounded-xl2 border border-ink-100 shadow-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-6 pb-4">
          <div>
            <h2 className="font-display text-lg text-ink-900">Patient history</h2>
            <p className="text-sm text-ink-400">Visit totals per patient</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <SearchInput value={patientQuery} onChange={(e) => setPatientQuery(e.target.value)} placeholder="Search patient" />
            {patientReport.length > 0 && (
              <SecondaryButton
                onClick={() =>
                  exportCsv(
                    "patient-report.csv",
                    ["Patient", "Total appointments", "Completed", "Cancelled"],
                    filteredPatients.map((p) => [p.patient_name, p.total_appointments, p.completed, p.cancelled])
                  )
                }
              >
                <Download size={15} /> Export CSV
              </SecondaryButton>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-400 uppercase tracking-wide border-b border-ink-100">
                <th className="py-3 px-6 font-medium">Patient</th>
                <th className="py-3 px-4 font-medium">Total visits</th>
                <th className="py-3 px-4 font-medium">Completed</th>
                <th className="py-3 px-4 font-medium">Cancelled</th>
              </tr>
            </thead>
            {loading ? (
              <TableSkeleton cols={4} />
            ) : (
              <tbody>
                {filteredPatients.map((p) => (
                  <tr key={p.patient_id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/50 transition-colors">
                    <td className="py-3 px-6 font-medium text-ink-800">{p.patient_name}</td>
                    <td className="py-3 px-4 text-ink-500">{p.total_appointments}</td>
                    <td className="py-3 px-4 text-sage-500">{p.completed}</td>
                    <td className="py-3 px-4 text-clay-500">{p.cancelled}</td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
        {!loading && filteredPatients.length === 0 && (
          <EmptyState icon={Users} title="No matching patients" message="Try a different search term." />
        )}
      </section>
    </div>
  );
}
