import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Pencil, Trash2, Users, Phone, Droplet, History, CalendarClock, Clock, Stethoscope } from "lucide-react";
import { getPatients, createPatient, updatePatient, deletePatient } from "../services/patientService";
import { getAppointments } from "../services/appointmentService";
import { getDoctors } from "../services/doctorService";
import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import { SearchInput, Field, inputClass, PrimaryButton, SecondaryButton, IconButton, TableSkeleton } from "../components/ui";
import { getErrorMessage } from "../utils/errors";

const EMPTY_FORM = { patient_name: "", age: "", gender: "", phone: "", email: "", address: "", blood_group: "" };

function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

export default function Patients() {
  const [searchParams] = useSearchParams();
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [historyTarget, setHistoryTarget] = useState(null);
  const { notify } = useToast();

  async function loadPatients() {
    try {
      const [pats, appts, docs] = await Promise.all([getPatients(), getAppointments(), getDoctors()]);
      setPatients(pats);
      setAppointments(appts);
      setDoctors(docs);
    } catch {
      notify("Failed to load patients. Are you logged in?", "error");
    } finally {
      setLoading(false);
    }
  }

  function doctorName(id) {
    return doctors.find((d) => d.doctor_id === id)?.doctor_name || "Unknown doctor";
  }

  const patientVisits = useMemo(() => {
    if (!historyTarget) return [];
    return appointments
      .filter((a) => a.patient_id === historyTarget.patient_id)
      .sort((a, b) => `${b.appointment_date}${b.appointment_time}`.localeCompare(`${a.appointment_date}${a.appointment_time}`));
  }, [appointments, historyTarget]);

  useEffect(() => {
    loadPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        p.patient_name?.toLowerCase().includes(q) ||
        p.phone?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q)
    );
  }, [patients, query]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function openAddModal() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setModalOpen(true);
  }

  function openEditModal(patient) {
    setEditingId(patient.patient_id);
    setForm({
      patient_name: patient.patient_name,
      age: patient.age || "",
      gender: patient.gender || "",
      phone: patient.phone || "",
      email: patient.email || "",
      address: patient.address || "",
      blood_group: patient.blood_group || "",
    });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, age: form.age ? parseInt(form.age) : null };
    try {
      if (editingId) {
        await updatePatient(editingId, payload);
        notify("Patient record updated.", "success");
      } else {
        await createPatient(payload);
        notify("Patient registered.", "success");
      }
      setModalOpen(false);
      loadPatients();
    } catch {
      notify("Couldn't save this patient. Check the fields and try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const id = confirmTarget;
    setDeleting(true);
    try {
      await deletePatient(id);
      notify("Patient record removed.", "success");
      setConfirmTarget(null);
      loadPatients();
    } catch (err) {
      notify(getErrorMessage(err, "Couldn't remove this patient."), "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <SearchInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, phone, or email" />
        <PrimaryButton onClick={openAddModal}>
          <Plus size={16} /> Register patient
        </PrimaryButton>
      </div>

      <div className="bg-white rounded-xl2 border border-ink-100 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-400 uppercase tracking-wide border-b border-ink-100">
                <th className="py-3 px-4 font-medium">Patient</th>
                <th className="py-3 px-4 font-medium">Age / Gender</th>
                <th className="py-3 px-4 font-medium">Contact</th>
                <th className="py-3 px-4 font-medium">Blood group</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            {loading ? (
              <TableSkeleton cols={5} />
            ) : (
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.patient_id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-ink-100 text-ink-600 flex items-center justify-center text-xs font-semibold shrink-0">
                          {initials(p.patient_name)}
                        </div>
                        <span className="font-medium text-ink-800">{p.patient_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-ink-500">
                      {p.age ? `${p.age} yrs` : "-"}{p.gender ? ` - ${p.gender}` : ""}
                    </td>
                    <td className="py-3 px-4 text-ink-500">
                      <div className="flex flex-col gap-0.5 text-xs">
                        {p.phone && <span className="flex items-center gap-1.5"><Phone size={12} /> {p.phone}</span>}
                        {!p.phone && !p.email && "-"}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {p.blood_group ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-clay-50 text-clay-500 px-2.5 py-1 text-xs">
                          <Droplet size={12} /> {p.blood_group}
                        </span>
                      ) : (
                        <span className="text-ink-300">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-1">
                        <IconButton tone="teal" onClick={() => setHistoryTarget(p)} aria-label="View visit history"><History size={15} /></IconButton>
                        <IconButton onClick={() => openEditModal(p)} aria-label="Edit patient"><Pencil size={15} /></IconButton>
                        <IconButton tone="clay" onClick={() => setConfirmTarget(p.patient_id)} aria-label="Delete patient"><Trash2 size={15} /></IconButton>
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
            icon={Users}
            title={query ? "No patients match your search" : "No patients yet"}
            message={query ? "Try a different name, phone, or email." : "Register your first patient to start booking visits."}
            action={!query && <PrimaryButton onClick={openAddModal}><Plus size={16} /> Register patient</PrimaryButton>}
          />
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit patient" : "Register patient"}
      >
        <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
          <Field label="Full name" span>
            <input name="patient_name" value={form.patient_name} onChange={handleChange} required className={inputClass} placeholder="Full name" />
          </Field>
          <Field label="Age">
            <input name="age" type="number" min="0" value={form.age} onChange={handleChange} className={inputClass} placeholder="34" />
          </Field>
          <Field label="Gender">
            <select name="gender" value={form.gender} onChange={handleChange} className={inputClass}>
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </Field>
          <Field label="Phone">
            <input name="phone" value={form.phone} onChange={handleChange} className={inputClass} placeholder="9876543210" />
          </Field>
          <Field label="Blood group">
            <select name="blood_group" value={form.blood_group} onChange={handleChange} className={inputClass}>
              <option value="">Unknown</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </Field>
          <Field label="Email" span>
            <input name="email" type="email" value={form.email} onChange={handleChange} className={inputClass} placeholder="patient@email.com" />
          </Field>
          <Field label="Address" span>
            <textarea name="address" value={form.address} onChange={handleChange} rows={2} className={inputClass} placeholder="Street, city" />
          </Field>
          <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
            <SecondaryButton type="button" onClick={() => setModalOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton type="submit" disabled={saving}>{saving ? "Saving..." : editingId ? "Save changes" : "Register patient"}</PrimaryButton>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmTarget !== null}
        title="Remove patient"
        message="This will remove the patient's record. Past appointment history tied to this patient may be affected."
        confirmLabel="Remove patient"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmTarget(null)}
      />

      <Modal
        open={historyTarget !== null}
        onClose={() => setHistoryTarget(null)}
        title={historyTarget ? `Visit history - ${historyTarget.patient_name}` : "Visit history"}
        width="max-w-xl"
      >
        {patientVisits.length === 0 ? (
          <EmptyState icon={CalendarClock} title="No visits recorded yet" message="Appointments booked for this patient will show up here." />
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {patientVisits.map((v) => (
              <div key={v.appointment_id} className="rounded-lg border border-ink-100 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3 text-xs text-ink-500">
                    <span className="flex items-center gap-1.5"><CalendarClock size={12} /> {v.appointment_date}</span>
                    <span className="flex items-center gap-1.5"><Clock size={12} /> {v.appointment_time}</span>
                    <span className="flex items-center gap-1.5"><Stethoscope size={12} /> {doctorName(v.doctor_id)}</span>
                  </div>
                  <StatusBadge status={v.status} />
                </div>
                {v.reason && <p className="text-sm text-ink-700"><span className="text-ink-400">Reason: </span>{v.reason}</p>}
                {v.remarks && <p className="text-sm text-ink-700 mt-1"><span className="text-ink-400">Notes: </span>{v.remarks}</p>}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
