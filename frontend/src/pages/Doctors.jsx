import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Stethoscope, Phone, Mail, CalendarDays } from "lucide-react";
import { getDoctors, createDoctor, updateDoctor, deleteDoctor } from "../services/doctorService";
import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import { SearchInput, Field, inputClass, PrimaryButton, SecondaryButton, IconButton, TableSkeleton } from "../components/ui";

const EMPTY_FORM = { doctor_name: "", specialization: "", phone: "", email: "", experience: "" };

function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

export default function Doctors() {
  const [searchParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [specFilter, setSpecFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const { notify } = useToast();

  async function loadDoctors() {
    try {
      const data = await getDoctors();
      setDoctors(data);
    } catch {
      notify("Failed to load doctors. Are you logged in?", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const specializations = useMemo(() => {
    const set = new Set(doctors.map((d) => d.specialization).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [doctors]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return doctors
      .filter((d) => specFilter === "All" || d.specialization === specFilter)
      .filter((d) => {
        if (!q) return true;
        return (
          d.doctor_name?.toLowerCase().includes(q) ||
          d.specialization?.toLowerCase().includes(q) ||
          d.email?.toLowerCase().includes(q)
        );
      });
  }, [doctors, query, specFilter]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function openAddModal() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setModalOpen(true);
  }

  function openEditModal(doctor) {
    setEditingId(doctor.doctor_id);
    setForm({
      doctor_name: doctor.doctor_name,
      specialization: doctor.specialization,
      phone: doctor.phone || "",
      email: doctor.email || "",
      experience: doctor.experience || "",
    });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, experience: form.experience ? parseInt(form.experience) : null };
    try {
      if (editingId) {
        await updateDoctor(editingId, payload);
        notify("Doctor profile updated.", "success");
      } else {
        await createDoctor(payload);
        notify("Doctor added to staff.", "success");
      }
      setModalOpen(false);
      loadDoctors();
    } catch {
      notify("Couldn't save this doctor. Check the fields and try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const id = confirmTarget;
    setConfirmTarget(null);
    try {
      await deleteDoctor(id);
      notify("Doctor removed.", "success");
      loadDoctors();
    } catch {
      notify("Couldn't remove this doctor.", "error");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <SearchInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, specialty, or email" />
          {specializations.length > 1 && (
            <select
              value={specFilter}
              onChange={(e) => setSpecFilter(e.target.value)}
              className="rounded-lg border border-ink-100 bg-white px-3 py-2.5 text-sm text-ink-600 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400"
            >
              {specializations.map((s) => (
                <option key={s} value={s}>{s === "All" ? "All specializations" : s}</option>
              ))}
            </select>
          )}
        </div>
        <PrimaryButton onClick={openAddModal}>
          <Plus size={16} /> Add doctor
        </PrimaryButton>
      </div>

      <div className="bg-white rounded-xl2 border border-ink-100 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-400 uppercase tracking-wide border-b border-ink-100">
                <th className="py-3 px-4 font-medium">Doctor</th>
                <th className="py-3 px-4 font-medium">Specialization</th>
                <th className="py-3 px-4 font-medium">Contact</th>
                <th className="py-3 px-4 font-medium">Experience</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            {loading ? (
              <TableSkeleton cols={5} />
            ) : (
              <tbody>
                {filtered.map((doc) => (
                  <tr key={doc.doctor_id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center text-xs font-semibold shrink-0">
                          {initials(doc.doctor_name)}
                        </div>
                        <span className="font-medium text-ink-800">{doc.doctor_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-50 text-ink-500 px-2.5 py-1 text-xs">
                        <Stethoscope size={12} /> {doc.specialization}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-ink-500">
                      <div className="flex flex-col gap-0.5 text-xs">
                        {doc.phone && <span className="flex items-center gap-1.5"><Phone size={12} /> {doc.phone}</span>}
                        {doc.email && <span className="flex items-center gap-1.5"><Mail size={12} /> {doc.email}</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-ink-500">{doc.experience ? `${doc.experience} yrs` : "—"}</td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/schedule?doctor=${doc.doctor_id}`}
                          className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors text-ink-400 hover:text-teal-600 hover:bg-teal-50"
                          aria-label="View schedule"
                        >
                          <CalendarDays size={15} />
                        </Link>
                        <IconButton onClick={() => openEditModal(doc)} aria-label="Edit doctor"><Pencil size={15} /></IconButton>
                        <IconButton tone="clay" onClick={() => setConfirmTarget(doc.doctor_id)} aria-label="Delete doctor"><Trash2 size={15} /></IconButton>
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
            icon={Stethoscope}
            title={query ? "No doctors match your search" : "No doctors yet"}
            message={query ? "Try a different name, specialty, or email." : "Add your first doctor to start scheduling appointments."}
            action={!query && <PrimaryButton onClick={openAddModal}><Plus size={16} /> Add doctor</PrimaryButton>}
          />
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit doctor" : "Add doctor"}
      >
        <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
          <Field label="Doctor name" span>
            <input name="doctor_name" value={form.doctor_name} onChange={handleChange} required className={inputClass} placeholder="Dr. Asha Rao" />
          </Field>
          <Field label="Specialization" span>
            <input name="specialization" value={form.specialization} onChange={handleChange} required className={inputClass} placeholder="Cardiology" />
          </Field>
          <Field label="Phone">
            <input name="phone" value={form.phone} onChange={handleChange} className={inputClass} placeholder="9876543210" />
          </Field>
          <Field label="Email">
            <input name="email" type="email" value={form.email} onChange={handleChange} className={inputClass} placeholder="doctor@clinic.com" />
          </Field>
          <Field label="Experience (years)">
            <input name="experience" type="number" min="0" value={form.experience} onChange={handleChange} className={inputClass} placeholder="8" />
          </Field>
          <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
            <SecondaryButton type="button" onClick={() => setModalOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton type="submit" disabled={saving}>{saving ? "Saving…" : editingId ? "Save changes" : "Add doctor"}</PrimaryButton>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmTarget !== null}
        title="Remove doctor"
        message="This doctor will no longer appear when booking new appointments. Existing appointment history stays intact."
        confirmLabel="Remove doctor"
        onConfirm={handleDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
