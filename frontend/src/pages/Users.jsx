import { useState, useEffect, useMemo } from "react";
import { Plus, Pencil, UserX, ShieldCheck, Stethoscope, Users as UsersIcon, ClipboardList, UserCog } from "lucide-react";
import { getUsers, createUser, updateUser, deactivateUser } from "../services/userService";
import { getDoctors } from "../services/doctorService";
import { getPatients } from "../services/patientService";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import { SearchInput, Field, inputClass, PrimaryButton, SecondaryButton, IconButton, TableSkeleton } from "../components/ui";
import { getErrorMessage } from "../utils/errors";

const ROLES = ["Admin", "Receptionist", "Doctor", "Patient"];
const ROLE_ICON = { Admin: ShieldCheck, Receptionist: ClipboardList, Doctor: Stethoscope, Patient: UsersIcon };
const ROLE_TONE = {
  Admin: "bg-clay-50 text-clay-500 border-clay-200",
  Receptionist: "bg-amber-50 text-amber-600 border-amber-200",
  Doctor: "bg-teal-50 text-teal-600 border-teal-200",
  Patient: "bg-ink-50 text-ink-500 border-ink-200",
};

const EMPTY_FORM = {
  username: "",
  password: "",
  full_name: "",
  role: "Receptionist",
  email: "",
  phone: "",
  doctor_id: "",
  patient_id: "",
  is_active: true,
};

function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

function daysUntilPurge(deactivatedAt) {
  const deactivated = new Date(deactivatedAt.endsWith("Z") ? deactivatedAt : deactivatedAt + "Z");
  const purgeDate = new Date(deactivated.getTime() + 30 * 24 * 60 * 60 * 1000);
  const daysLeft = Math.ceil((purgeDate - new Date()) / (24 * 60 * 60 * 1000));
  if (daysLeft <= 0) return "Removed on next login by anyone";
  if (daysLeft === 1) return "Auto-deleted tomorrow";
  return `Auto-deleted in ${daysLeft} days`;
}

export default function Users() {
  const { user: me } = useAuth();
  const { notify } = useToast();

  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deactivating, setDeactivating] = useState(false);
  const [formError, setFormError] = useState("");

  async function loadAll() {
    try {
      const [u, d, p] = await Promise.all([getUsers(), getDoctors(), getPatients()]);
      setUsers(u);
      setDoctors(d);
      setPatients(p);
    } catch (err) {
      notify(getErrorMessage(err, "Failed to load accounts."), "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function doctorName(id) {
    return doctors.find((d) => d.doctor_id === id)?.doctor_name;
  }
  function patientName(id) {
    return patients.find((p) => p.patient_id === id)?.patient_name;
  }

  // Doctors/patients who already have a login account shouldn't show up again
  // in the linking dropdown, except the one currently assigned when editing.
  const linkedDoctorIds = useMemo(
    () => new Set(users.filter((u) => u.doctor_id && u.user_id !== editingId).map((u) => u.doctor_id)),
    [users, editingId]
  );
  const linkedPatientIds = useMemo(
    () => new Set(users.filter((u) => u.patient_id && u.user_id !== editingId).map((u) => u.patient_id)),
    [users, editingId]
  );
  const availableDoctors = doctors.filter((d) => !linkedDoctorIds.has(d.doctor_id));
  const availablePatients = patients.filter((p) => !linkedPatientIds.has(p.patient_id));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.full_name?.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [users, query]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value, ...(name === "role" ? { doctor_id: "", patient_id: "" } : {}) }));
  }

  function openAddModal() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(u) {
    setEditingId(u.user_id);
    setForm({
      username: u.username,
      password: "",
      full_name: u.full_name,
      role: u.role,
      email: u.email || "",
      phone: u.phone || "",
      doctor_id: u.doctor_id || "",
      patient_id: u.patient_id || "",
      is_active: u.is_active,
    });
    setFormError("");
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    if (form.role === "Doctor" && !form.doctor_id) {
      setFormError("Pick which doctor this account belongs to.");
      return;
    }
    if (form.role === "Patient" && !form.patient_id) {
      setFormError("Pick which patient this account belongs to.");
      return;
    }

    setSaving(true);
    try {
      const base = {
        full_name: form.full_name,
        role: form.role,
        email: form.email || null,
        phone: form.phone || null,
        doctor_id: form.role === "Doctor" ? parseInt(form.doctor_id) : null,
        patient_id: form.role === "Patient" ? parseInt(form.patient_id) : null,
      };
      if (editingId) {
        const payload = { ...base, is_active: form.is_active };
        if (form.password) payload.password = form.password;
        await updateUser(editingId, payload);
        notify("Account updated.", "success");
      } else {
        await createUser({ ...base, username: form.username, password: form.password });
        notify("Account created.", "success");
      }
      setModalOpen(false);
      loadAll();
    } catch (err) {
      setFormError(getErrorMessage(err, "Couldn't save this account. Check the fields and try again."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    const id = confirmTarget;
    setDeactivating(true);
    try {
      await deactivateUser(id);
      notify("Account deactivated.", "success");
      setConfirmTarget(null);
      loadAll();
    } catch (err) {
      notify(getErrorMessage(err, "Couldn't deactivate this account."), "error");
    } finally {
      setDeactivating(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <SearchInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, username, or role" />
        <PrimaryButton onClick={openAddModal}>
          <Plus size={16} /> New account
        </PrimaryButton>
      </div>

      <div className="bg-white rounded-xl2 border border-ink-100 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-400 uppercase tracking-wide border-b border-ink-100">
                <th className="py-3 px-4 font-medium">Account</th>
                <th className="py-3 px-4 font-medium">Role</th>
                <th className="py-3 px-4 font-medium">Linked record</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            {loading ? (
              <TableSkeleton cols={5} />
            ) : (
              <tbody>
                {filtered.map((u) => {
                  const RoleIcon = ROLE_ICON[u.role] || UserCog;
                  const linked = u.role === "Doctor" ? doctorName(u.doctor_id) : u.role === "Patient" ? patientName(u.patient_id) : null;
                  return (
                    <tr key={u.user_id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center text-xs font-semibold shrink-0">
                            {initials(u.full_name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-ink-800 truncate">{u.full_name}</p>
                            <p className="text-xs text-ink-400 truncate">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${ROLE_TONE[u.role] || ""}`}>
                          <RoleIcon size={12} /> {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-ink-500 text-xs">{linked || "-"}</td>
                      <td className="py-3 px-4">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-50 text-sage-500 border border-sage-200 px-2.5 py-1 text-xs font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-current" /> Active
                          </span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-50 text-ink-400 border border-ink-200 px-2.5 py-1 text-xs font-medium w-fit">
                              <span className="h-1.5 w-1.5 rounded-full bg-current" /> Deactivated
                            </span>
                            {u.deactivated_at && (
                              <span className="text-[11px] text-ink-300">{daysUntilPurge(u.deactivated_at)}</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-1">
                          <IconButton onClick={() => openEditModal(u)} aria-label="Edit account"><Pencil size={15} /></IconButton>
                          {u.is_active && u.user_id !== me?.user_id && (
                            <IconButton tone="clay" onClick={() => setConfirmTarget(u.user_id)} aria-label="Deactivate account">
                              <UserX size={15} />
                            </IconButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            )}
          </table>
        </div>
        {!loading && filtered.length === 0 && (
          <EmptyState
            icon={UserCog}
            title={query ? "No accounts match your search" : "No accounts yet"}
            message={query ? "Try a different name, username, or role." : "Create a login for your staff, doctors, or patients."}
            action={!query && <PrimaryButton onClick={openAddModal}><Plus size={16} /> New account</PrimaryButton>}
          />
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit account" : "New account"}>
        <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
          <Field label="Full name" span>
            <input name="full_name" value={form.full_name} onChange={handleChange} required className={inputClass} placeholder="Full name" />
          </Field>

          {!editingId && (
            <Field label="Username">
              <input name="username" value={form.username} onChange={handleChange} required minLength={3} className={inputClass} placeholder="Choose a username" />
            </Field>
          )}

          {editingId && (
            <Field label="Username" hint="Can't be changed after an account is created.">
              <input value={form.username} disabled className={inputClass + " bg-ink-50 text-ink-400 cursor-not-allowed"} />
            </Field>
          )}

          <Field label={editingId ? "New password (leave blank to keep current)" : "Password"} hint="At least 8 characters, with a letter and a number.">
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required={!editingId}
              minLength={8}
              className={inputClass}
              placeholder="********"
            />
          </Field>

          <Field label="Role" span>
            <select name="role" value={form.role} onChange={handleChange} className={inputClass}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </Field>

          {form.role === "Doctor" && (
            <Field label="Which doctor is this?" span hint={availableDoctors.length === 0 ? undefined : "Only doctors without an existing login are shown."}>
              {availableDoctors.length === 0 ? (
                <p className="text-sm text-clay-500 bg-clay-50 border border-clay-200 rounded-lg px-3 py-2.5">
                  Every doctor already has a login account. Add a new doctor on the Doctors page first, or edit an existing account instead of creating a new one.
                </p>
              ) : (
                <select name="doctor_id" value={form.doctor_id} onChange={handleChange} required className={inputClass}>
                  <option value="">Select a doctor...</option>
                  {availableDoctors.map((d) => (
                    <option key={d.doctor_id} value={d.doctor_id}>{d.doctor_name} - {d.specialization}</option>
                  ))}
                </select>
              )}
            </Field>
          )}

          {form.role === "Patient" && (
            <Field label="Which patient is this?" span hint={availablePatients.length === 0 ? undefined : "Only patients without an existing login are shown."}>
              {availablePatients.length === 0 ? (
                <p className="text-sm text-clay-500 bg-clay-50 border border-clay-200 rounded-lg px-3 py-2.5">
                  Every patient already has a login account. Register a new patient on the Patients page first, or edit an existing account instead of creating a new one.
                </p>
              ) : (
                <select name="patient_id" value={form.patient_id} onChange={handleChange} required className={inputClass}>
                  <option value="">Select a patient...</option>
                  {availablePatients.map((p) => (
                    <option key={p.patient_id} value={p.patient_id}>{p.patient_name}</option>
                  ))}
                </select>
              )}
            </Field>
          )}

          <Field label="Email">
            <input name="email" type="email" value={form.email} onChange={handleChange} className={inputClass} placeholder="name@clinic.com" />
          </Field>
          <Field label="Phone">
            <input name="phone" value={form.phone} onChange={handleChange} className={inputClass} placeholder="9876543210" />
          </Field>

          {editingId && editingId !== me?.user_id && (
            <Field label="Account status" span>
              <label className="flex items-center gap-2.5 text-sm text-ink-700">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded border-ink-200 text-teal-500 focus:ring-teal-300"
                />
                Active - can sign in
              </label>
            </Field>
          )}

          {formError && (
            <div className="sm:col-span-2 rounded-lg bg-clay-50 border border-clay-200 text-clay-500 text-sm px-3 py-2.5">
              {formError}
            </div>
          )}

          <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
            <SecondaryButton type="button" onClick={() => setModalOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton type="submit" disabled={saving}>{saving ? "Saving..." : editingId ? "Save changes" : "Create account"}</PrimaryButton>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmTarget !== null}
        title="Deactivate account"
        message="This person will no longer be able to sign in. You can reactivate their account later by editing it - but if it's left deactivated for 30 days, it's automatically and permanently deleted."
        confirmLabel="Deactivate account"
        loading={deactivating}
        onConfirm={handleDeactivate}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
