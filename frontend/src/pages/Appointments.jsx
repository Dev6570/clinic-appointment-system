import { useState, useEffect, useMemo } from "react";
import { Plus, Pencil, XCircle, CalendarClock, Clock } from "lucide-react";
import { getAppointments, createAppointment, updateAppointment, deleteAppointment } from "../services/appointmentService";
import { getDoctors } from "../services/doctorService";
import { getPatients } from "../services/patientService";
import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import { SearchInput, Field, inputClass, PrimaryButton, SecondaryButton, IconButton, TableSkeleton } from "../components/ui";

const EMPTY_FORM = { patient_id: "", doctor_id: "", appointment_date: "", appointment_time: "", reason: "", status: "Scheduled", remarks: "" };
const STATUS_FILTERS = ["All", "Scheduled", "Completed", "Cancelled"];

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const { notify } = useToast();

  async function loadAll() {
    try {
      const [appts, docs, pats] = await Promise.all([getAppointments(), getDoctors(), getPatients()]);
      setAppointments(appts);
      setDoctors(docs);
      setPatients(pats);
    } catch {
      notify("Failed to load appointments. Are you logged in?", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function doctorName(id) {
    return doctors.find((d) => d.doctor_id === id)?.doctor_name || "Unknown";
  }
  function patientName(id) {
    return patients.find((p) => p.patient_id === id)?.patient_name || "Unknown";
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return appointments
      .filter((a) => statusFilter === "All" || a.status === statusFilter)
      .filter((a) => {
        if (!q) return true;
        return (
          patientName(a.patient_id).toLowerCase().includes(q) ||
          doctorName(a.doctor_id).toLowerCase().includes(q) ||
          a.reason?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => `${b.appointment_date}${b.appointment_time}`.localeCompare(`${a.appointment_date}${a.appointment_time}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments, query, statusFilter, doctors, patients]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function openAddModal() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setModalOpen(true);
  }

  function openEditModal(appt) {
    setEditingId(appt.appointment_id);
    setForm({
      patient_id: appt.patient_id,
      doctor_id: appt.doctor_id,
      appointment_date: appt.appointment_date,
      appointment_time: appt.appointment_time,
      reason: appt.reason || "",
      status: appt.status || "Scheduled",
      remarks: appt.remarks || "",
    });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, patient_id: parseInt(form.patient_id), doctor_id: parseInt(form.doctor_id) };
    try {
      if (editingId) {
        await updateAppointment(editingId, payload);
        notify("Appointment updated.", "success");
      } else {
        await createAppointment(payload);
        notify("Appointment booked.", "success");
      }
      setModalOpen(false);
      loadAll();
    } catch (err) {
      if (err.response && err.response.status === 409) {
        notify("This doctor is already booked at that date and time.", "error");
      } else {
        notify("Couldn't save this appointment. Check the fields and try again.", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const id = confirmTarget;
    setConfirmTarget(null);
    try {
      await deleteAppointment(id);
      notify("Appointment cancelled.", "success");
      loadAll();
    } catch {
      notify("Couldn't cancel this appointment.", "error");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <SearchInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search patient, doctor, or reason" />
          <div className="flex gap-1.5 bg-white border border-ink-100 rounded-lg p-1 w-fit">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === s ? "bg-teal-500 text-white" : "text-ink-500 hover:bg-ink-50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <PrimaryButton onClick={openAddModal} className="shrink-0">
          <Plus size={16} /> Book appointment
        </PrimaryButton>
      </div>

      <div className="bg-white rounded-xl2 border border-ink-100 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-400 uppercase tracking-wide border-b border-ink-100">
                <th className="py-3 px-4 font-medium">Patient</th>
                <th className="py-3 px-4 font-medium">Doctor</th>
                <th className="py-3 px-4 font-medium">When</th>
                <th className="py-3 px-4 font-medium">Reason</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            {loading ? (
              <TableSkeleton cols={6} />
            ) : (
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.appointment_id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-ink-800">{patientName(a.patient_id)}</td>
                    <td className="py-3 px-4 text-ink-500">{doctorName(a.doctor_id)}</td>
                    <td className="py-3 px-4 text-ink-500">
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span className="flex items-center gap-1.5"><CalendarClock size={12} /> {a.appointment_date}</span>
                        <span className="flex items-center gap-1.5"><Clock size={12} /> {a.appointment_time}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-ink-500 max-w-[200px] truncate">{a.reason || "—"}</td>
                    <td className="py-3 px-4"><StatusBadge status={a.status} /></td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-1">
                        <IconButton onClick={() => openEditModal(a)} aria-label="Edit appointment"><Pencil size={15} /></IconButton>
                        <IconButton tone="clay" onClick={() => setConfirmTarget(a.appointment_id)} aria-label="Cancel appointment"><XCircle size={15} /></IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
        {!loading && filtered.length === 0 && (
          <EmptyState
            icon={CalendarClock}
            title={query || statusFilter !== "All" ? "No appointments match" : "No appointments yet"}
            message={query || statusFilter !== "All" ? "Try a different search or status filter." : "Book the first visit to get the day started."}
            action={!query && statusFilter === "All" && <PrimaryButton onClick={openAddModal}><Plus size={16} /> Book appointment</PrimaryButton>}
          />
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit appointment" : "Book appointment"}
      >
        <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
          <Field label="Patient" span>
            <select name="patient_id" value={form.patient_id} onChange={handleChange} required className={inputClass}>
              <option value="">Select patient</option>
              {patients.map((p) => (
                <option key={p.patient_id} value={p.patient_id}>{p.patient_name}</option>
              ))}
            </select>
          </Field>
          <Field label="Doctor" span>
            <select name="doctor_id" value={form.doctor_id} onChange={handleChange} required className={inputClass}>
              <option value="">Select doctor</option>
              {doctors.map((d) => (
                <option key={d.doctor_id} value={d.doctor_id}>{d.doctor_name} ({d.specialization})</option>
              ))}
            </select>
          </Field>
          <Field label="Date">
            <input name="appointment_date" type="date" value={form.appointment_date} onChange={handleChange} required className={inputClass} />
          </Field>
          <Field label="Time">
            <input name="appointment_time" type="time" value={form.appointment_time} onChange={handleChange} required className={inputClass} />
          </Field>
          <Field label="Reason for visit" span>
            <input name="reason" value={form.reason} onChange={handleChange} className={inputClass} placeholder="Follow-up, check-up, etc." />
          </Field>
          {editingId && (
            <Field label="Status" span>
              <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </Field>
          )}
          {editingId && (
            <Field label="Visit notes" span hint="Diagnosis, findings, or follow-up instructions for this visit.">
              <textarea name="remarks" value={form.remarks} onChange={handleChange} rows={3} className={inputClass} placeholder="e.g. BP 120/80, prescribed rest and fluids, review in 1 week." />
            </Field>
          )}
          <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
            <SecondaryButton type="button" onClick={() => setModalOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton type="submit" disabled={saving}>{saving ? "Saving…" : editingId ? "Save changes" : "Book appointment"}</PrimaryButton>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmTarget !== null}
        title="Cancel appointment"
        message="This appointment will be cancelled. The patient and doctor will need to rebook if the visit is still needed."
        confirmLabel="Cancel appointment"
        onConfirm={handleDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
