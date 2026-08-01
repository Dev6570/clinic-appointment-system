import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CalendarClock, ChevronLeft, ChevronRight, Plus, Stethoscope } from "lucide-react";
import { getDoctors } from "../services/doctorService";
import { getAppointments } from "../services/appointmentService";
import { getPatients } from "../services/patientService";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import StatusBadge from "../components/StatusBadge";
import { inputClass, TableSkeleton } from "../components/ui";

const SLOT_HOURS = Array.from({ length: 9 }, (_, i) => 9 + i); // 9am – 5pm inclusive

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatSlotLabel(hour) {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:00 ${hour < 12 ? "AM" : "PM"}`;
}

function toSlotKey(timeStr) {
  // normalizes "09:00:00" or "09:00" to "09:00"
  return timeStr?.slice(0, 5);
}

export default function Schedule() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { notify } = useToast();
  const { user } = useAuth();
  const isDoctorSelf = user?.role === "Doctor";

  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  const [doctorId, setDoctorId] = useState(isDoctorSelf ? String(user.doctor_id) : searchParams.get("doctor") || "");
  const [date, setDate] = useState(searchParams.get("date") || todayISO());

  useEffect(() => {
    async function load() {
      try {
        const [docs, appts, pats] = await Promise.all([getDoctors(), getAppointments(), getPatients()]);
        setDoctors(docs);
        setAppointments(appts);
        setPatients(pats);
        if (!isDoctorSelf && !searchParams.get("doctor") && docs.length > 0) {
          setDoctorId(String(docs[0].doctor_id));
        }
      } catch {
        notify("Couldn't load schedule data.", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const params = {};
    if (doctorId) params.doctor = doctorId;
    if (date) params.date = date;
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId, date]);

  function patientName(id) {
    return patients.find((p) => p.patient_id === id)?.patient_name || "Unknown patient";
  }

  const dayAppointments = useMemo(() => {
    if (!doctorId) return [];
    return appointments.filter(
      (a) => String(a.doctor_id) === String(doctorId) && a.appointment_date === date && a.status !== "Cancelled"
    );
  }, [appointments, doctorId, date]);

  const slotMap = useMemo(() => {
    const map = {};
    dayAppointments.forEach((a) => {
      map[toSlotKey(a.appointment_time)] = a;
    });
    return map;
  }, [dayAppointments]);

  function shiftDate(days) {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().slice(0, 10));
  }

  function bookSlot(hour) {
    if (isDoctorSelf) return;
    const time = `${String(hour).padStart(2, "0")}:00`;
    navigate(`/appointments?book=1&doctor=${doctorId}&date=${date}&time=${time}`);
  }

  const selectedDoctor = doctors.find((d) => String(d.doctor_id) === String(doctorId));
  const isPast = date < todayISO();

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {!isDoctorSelf && (
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className={inputClass + " sm:w-64"}
            >
              {doctors.length === 0 && <option value="">No doctors yet</option>}
              {doctors.map((d) => (
                <option key={d.doctor_id} value={d.doctor_id}>
                  {d.doctor_name} · {d.specialization}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => shiftDate(-1)}
              className="h-10 w-10 shrink-0 rounded-lg border border-ink-100 bg-white flex items-center justify-center text-ink-400 hover:text-ink-700 hover:bg-ink-50 transition-colors"
              aria-label="Previous day"
            >
              <ChevronLeft size={16} />
            </button>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
            <button
              onClick={() => shiftDate(1)}
              className="h-10 w-10 shrink-0 rounded-lg border border-ink-100 bg-white flex items-center justify-center text-ink-400 hover:text-ink-700 hover:bg-ink-50 transition-colors"
              aria-label="Next day"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl2 border border-ink-100 shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <TableSkeleton rows={6} cols={2} />
          </table>
        </div>
      ) : !doctorId ? (
        <div className="bg-white rounded-xl2 border border-ink-100 shadow-card p-10 text-center text-ink-400">
          Add a doctor first to see their schedule.
        </div>
      ) : (
        <div className="bg-white rounded-xl2 border border-ink-100 shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-ink-100 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <Stethoscope size={16} />
            </div>
            <div>
              <p className="font-medium text-ink-900">{selectedDoctor?.doctor_name}</p>
              <p className="text-xs text-ink-400">
                {dayAppointments.length} visit{dayAppointments.length === 1 ? "" : "s"} on{" "}
                {new Date(date + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
              </p>
            </div>
          </div>

          <div className="divide-y divide-ink-50">
            {SLOT_HOURS.map((hour) => {
              const key = `${String(hour).padStart(2, "0")}:00`;
              const appt = slotMap[key];
              return (
                <div key={hour} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-20 shrink-0 text-xs font-medium text-ink-400 flex items-center gap-1.5">
                    <CalendarClock size={12} />
                    {formatSlotLabel(hour)}
                  </div>
                  {appt ? (
                    <div className="flex-1 flex items-center justify-between gap-3 min-w-0">
                      <div className="min-w-0">
                        <p className="text-sm text-ink-800 font-medium truncate">{patientName(appt.patient_id)}</p>
                        {appt.reason && <p className="text-xs text-ink-400 truncate">{appt.reason}</p>}
                      </div>
                      <StatusBadge status={appt.status} />
                    </div>
                  ) : (
                    <button
                      onClick={() => bookSlot(hour)}
                      disabled={isPast || isDoctorSelf}
                      className="flex-1 text-left text-sm text-ink-300 hover:text-teal-600 disabled:hover:text-ink-300 disabled:cursor-not-allowed flex items-center gap-1.5 py-0.5 group"
                    >
                      <Plus size={13} className={`opacity-0 transition-opacity ${isDoctorSelf ? "" : "group-hover:opacity-100"}`} />
                      {isPast ? "Unavailable" : isDoctorSelf ? "Open" : "Open — click to book"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
