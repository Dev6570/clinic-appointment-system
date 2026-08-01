import { useState, useEffect, useMemo } from "react";
import { CalendarClock, Clock, Stethoscope, Phone, Droplet, XCircle, User as UserIcon } from "lucide-react";
import { getPatient } from "../services/patientService";
import { getAppointments, deleteAppointment } from "../services/appointmentService";
import { getDoctors } from "../services/doctorService";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import StatusBadge from "../components/StatusBadge";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import { TableSkeleton, IconButton } from "../components/ui";

export default function MyPortal() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  async function load() {
    try {
      const [pat, appts, docs] = await Promise.all([
        getPatient(user.patient_id),
        getAppointments(),
        getDoctors(),
      ]);
      setPatient(pat);
      setAppointments(appts);
      setDoctors(docs);
    } catch (err) {
      notify(err?.response?.data?.detail || "Couldn't load your records. Please try again shortly.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.patient_id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.patient_id]);

  function doctorName(id) {
    return doctors.find((d) => d.doctor_id === id)?.doctor_name || "Unknown doctor";
  }

  const sortedVisits = useMemo(
    () =>
      [...appointments].sort((a, b) =>
        `${b.appointment_date}${b.appointment_time}`.localeCompare(`${a.appointment_date}${a.appointment_time}`)
      ),
    [appointments]
  );

  async function handleCancel() {
    setCancelling(true);
    try {
      await deleteAppointment(cancelTarget);
      notify("Appointment cancelled.", "success");
      setCancelTarget(null);
      load();
    } catch (err) {
      notify(err?.response?.data?.detail || "Couldn't cancel that appointment.", "error");
    } finally {
      setCancelling(false);
    }
  }

  if (!user?.patient_id) {
    return (
      <EmptyState
        icon={UserIcon}
        title="No patient record linked"
        message="Your account isn't linked to a patient record yet. Ask the front desk to connect your login to your file."
      />
    );
  }

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="bg-white rounded-xl2 border border-ink-100 shadow-card overflow-hidden">
          <table className="w-full text-sm"><TableSkeleton rows={5} cols={2} /></table>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl2 border border-ink-100 shadow-card p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 font-semibold">
                {patient?.patient_name?.[0]?.toUpperCase() || "P"}
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-lg text-ink-900">{patient?.patient_name}</h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-ink-400">
                  {patient?.phone && (
                    <span className="flex items-center gap-1.5"><Phone size={13} /> {patient.phone}</span>
                  )}
                  {patient?.blood_group && (
                    <span className="flex items-center gap-1.5"><Droplet size={13} /> {patient.blood_group}</span>
                  )}
                  {patient?.age && <span>{patient.age} years old</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl2 border border-ink-100 shadow-card p-6">
            <h2 className="font-display text-lg text-ink-900 mb-1">Your visits</h2>
            <p className="text-sm text-ink-400 mb-4">Upcoming and past appointments, most recent first</p>

            {sortedVisits.length === 0 ? (
              <EmptyState icon={CalendarClock} title="No visits yet" message="Once the front desk books an appointment for you, it'll show up here." />
            ) : (
              <div className="space-y-3">
                {sortedVisits.map((v) => (
                  <div key={v.appointment_id} className="rounded-lg border border-ink-100 p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-3 text-xs text-ink-500">
                        <span className="flex items-center gap-1.5"><CalendarClock size={12} /> {v.appointment_date}</span>
                        <span className="flex items-center gap-1.5"><Clock size={12} /> {v.appointment_time?.slice(0, 5)}</span>
                        <span className="flex items-center gap-1.5"><Stethoscope size={12} /> {doctorName(v.doctor_id)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={v.status} />
                        {v.status === "Scheduled" && (
                          <IconButton tone="clay" onClick={() => setCancelTarget(v.appointment_id)} aria-label="Cancel appointment">
                            <XCircle size={15} />
                          </IconButton>
                        )}
                      </div>
                    </div>
                    {v.reason && <p className="text-sm text-ink-700"><span className="text-ink-400">Reason: </span>{v.reason}</p>}
                    {v.remarks && <p className="text-sm text-ink-700 mt-1"><span className="text-ink-400">Doctor's notes: </span>{v.remarks}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <ConfirmDialog
        open={cancelTarget !== null}
        title="Cancel this appointment?"
        message="You won't be able to undo this. You can always ask the front desk to book a new one."
        confirmLabel="Cancel appointment"
        loading={cancelling}
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}
