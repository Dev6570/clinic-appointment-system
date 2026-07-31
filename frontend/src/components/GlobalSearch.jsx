import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users, Stethoscope, CalendarClock, X } from "lucide-react";
import { getPatients } from "../services/patientService";
import { getDoctors } from "../services/doctorService";
import { getAppointments } from "../services/appointmentService";

const MAX_PER_GROUP = 4;

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ patients: [], doctors: [], appointments: [] });
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function ensureLoaded() {
    if (loaded) return;
    try {
      const [patients, doctors, appointments] = await Promise.all([
        getPatients(),
        getDoctors(),
        getAppointments(),
      ]);
      setData({ patients, doctors, appointments });
      setLoaded(true);
    } catch {
      // silent — search just won't have results if this fails
    }
  }

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { patients: [], doctors: [], appointments: [] };

    const patients = data.patients
      .filter((p) => p.patient_name?.toLowerCase().includes(q) || p.phone?.includes(q))
      .slice(0, MAX_PER_GROUP);

    const doctors = data.doctors
      .filter((d) => d.doctor_name?.toLowerCase().includes(q) || d.specialization?.toLowerCase().includes(q))
      .slice(0, MAX_PER_GROUP);

    const doctorName = (id) => data.doctors.find((d) => d.doctor_id === id)?.doctor_name || "";
    const patientName = (id) => data.patients.find((p) => p.patient_id === id)?.patient_name || "";
    const appointments = data.appointments
      .filter(
        (a) =>
          patientName(a.patient_id).toLowerCase().includes(q) ||
          doctorName(a.doctor_id).toLowerCase().includes(q)
      )
      .slice(0, MAX_PER_GROUP)
      .map((a) => ({ ...a, _patientName: patientName(a.patient_id), _doctorName: doctorName(a.doctor_id) }));

    return { patients, doctors, appointments };
  }, [query, data]);

  const hasResults = results.patients.length + results.doctors.length + results.appointments.length > 0;

  function go(path, name) {
    navigate(`${path}?q=${encodeURIComponent(name)}`);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
        <input
          value={query}
          onFocus={() => {
            setOpen(true);
            ensureLoaded();
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          placeholder="Search patients, doctors, appointments..."
          className="w-full pl-9 pr-8 py-2.5 rounded-lg border border-ink-100 bg-ink-50/60 text-sm text-ink-800 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 focus:bg-white transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-600"
            aria-label="Clear search"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {open && query.trim() && (
        <div className="absolute mt-2 w-full sm:w-96 max-w-[90vw] bg-white rounded-xl2 border border-ink-100 shadow-pop overflow-hidden z-30 max-h-[70vh] overflow-y-auto">
          {!hasResults ? (
            <p className="text-sm text-ink-300 px-4 py-6 text-center">No matches for "{query}"</p>
          ) : (
            <>
              {results.patients.length > 0 && (
                <ResultGroup icon={Users} label="Patients">
                  {results.patients.map((p) => (
                    <ResultRow
                      key={`p-${p.patient_id}`}
                      title={p.patient_name}
                      subtitle={p.phone || "No phone on file"}
                      onClick={() => go("/patients", p.patient_name)}
                    />
                  ))}
                </ResultGroup>
              )}
              {results.doctors.length > 0 && (
                <ResultGroup icon={Stethoscope} label="Doctors">
                  {results.doctors.map((d) => (
                    <ResultRow
                      key={`d-${d.doctor_id}`}
                      title={d.doctor_name}
                      subtitle={d.specialization}
                      onClick={() => go("/doctors", d.doctor_name)}
                    />
                  ))}
                </ResultGroup>
              )}
              {results.appointments.length > 0 && (
                <ResultGroup icon={CalendarClock} label="Appointments">
                  {results.appointments.map((a) => (
                    <ResultRow
                      key={`a-${a.appointment_id}`}
                      title={`${a._patientName} with ${a._doctorName}`}
                      subtitle={`${a.appointment_date} · ${a.appointment_time} · ${a.status}`}
                      onClick={() => go("/appointments", a._patientName)}
                    />
                  ))}
                </ResultGroup>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ResultGroup({ icon: Icon, label, children }) {
  return (
    <div className="py-1.5 first:pt-2 last:pb-2">
      <p className="px-4 py-1 text-[11px] font-semibold text-ink-300 uppercase tracking-wide flex items-center gap-1.5">
        <Icon size={11} /> {label}
      </p>
      {children}
    </div>
  );
}

function ResultRow({ title, subtitle, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-2 hover:bg-teal-50 transition-colors flex flex-col"
    >
      <span className="text-sm text-ink-800 font-medium truncate">{title}</span>
      <span className="text-xs text-ink-400 truncate">{subtitle}</span>
    </button>
  );
}
