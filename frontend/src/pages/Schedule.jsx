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
import { getErrorMessage } from "../utils/errors";

const SLOT_HOURS = Array.from({ length: 14 }, (_, i) => 7 + i); // 7am - 8pm inclusive

// toISOString() always converts to UTC first. For timezones ahead of UTC
// (e.g. IST, UTC+5:30), that silently shifts the date backward - this is
// what caused the Next/Previous day buttons to behave wrong. Building the
// string from local date parts instead avoids that entirely.
function toLocalISODate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayISO() {
  return toLocalISODate(new Date());
}

function formatSlotLabel(hour) {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:00 ${hour < 12 ? "AM" : "PM"}`;
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
      } catch (err) {
        notify(getErrorMessage(err, "Couldn't load schedule data."), "error");
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

  const { slotMap, outOfRangeAppointments } = useMemo(() => {
    // Appointments are booked with a free time picker (any HH:MM), not
    // fixed hourly slots, so a slot has to be matched by "falls within
    // this hour" rather than an exact "HH:00" string match - otherwise
    // anything booked off the hour (e.g. 8:05, 10:47) silently never
    // shows up here, even though it's a real appointment.
    const map = {};
    const outOfRange = [];
    dayAppointments.forEach((a) => {
      const hour = parseInt(a.appointment_time?.slice(0, 2), 10);
      if (SLOT_HOURS.includes(hour)) {
        if (!map[hour]) map[hour] = [];
        map[hour].push(a);
      } else {
        outOfRange.push(a);
      }
    });
    Object.values(map).forEach((list) => list.sort((a, b) => a.appointment_time.localeCompare(b.appointment_time)));
    outOfRange.sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
    return { slotMap: map, outOfRangeAppointments: outOfRange };
  }, [dayAppointments]);

  function shiftDate(days) {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + days);
    setDate(toLocalISODate(d));
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
                  {d.doctor_name} - {d.specialization}
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
              const apptsInHour = slotMap[hour] || [];
              return (
                <div key={hour} className="flex items-start gap-4 px-5 py-3.5">
                  <div className="w-20 shrink-0 pt-0.5 text-xs font-medium text-ink-400 flex items-center gap-1.5">
                    <CalendarClock size={12} />
                    {formatSlotLabel(hour)}
                  </div>
                  {apptsInHour.length > 0 ? (
                    <div className="flex-1 space-y-2 min-w-0">
                      {apptsInHour.map((appt) => (
                        <div key={appt.appointment_id} className="flex items-center justify-between gap-3 min-w-0">
                          <div className="min-w-0">
                            <p className="text-sm text-ink-800 font-medium truncate">
                              {patientName(appt.patient_id)}
                              <span className="ml-2 text-xs text-ink-400 font-normal">{appt.appointment_time?.slice(0, 5)}</span>
                            </p>
                            {appt.reason && <p className="text-xs text-ink-400 truncate">{appt.reason}</p>}
                          </div>
                          <StatusBadge status={appt.status} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <button
                      onClick={() => bookSlot(hour)}
                      disabled={isPast || isDoctorSelf}
                      className="flex-1 text-left text-sm text-ink-300 hover:text-teal-600 disabled:hover:text-ink-300 disabled:cursor-not-allowed flex items-center gap-1.5 py-0.5 group"
                    >
                      <Plus size={13} className={`opacity-0 transition-opacity ${isDoctorSelf ? "" : "group-hover:opacity-100"}`} />
                      {isPast ? "Unavailable" : isDoctorSelf ? "Open" : "Open - click to book"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {outOfRangeAppointments.length > 0 && (
            <div className="border-t border-ink-100 px-5 py-3.5 bg-ink-25">
              <p className="text-xs font-medium text-ink-400 mb-2">Outside standard hours (7 AM - 8 PM)</p>
              <div className="space-y-2">
                {outOfRangeAppointments.map((appt) => (
                  <div key={appt.appointment_id} className="flex items-center justify-between gap-3 min-w-0">
                    <div className="min-w-0 flex items-center gap-3">
                      <span className="text-xs font-medium text-ink-500 w-14 shrink-0">{appt.appointment_time?.slice(0, 5)}</span>
                      <p className="text-sm text-ink-800 font-medium truncate">{patientName(appt.patient_id)}</p>
                    </div>
                    <StatusBadge status={appt.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
