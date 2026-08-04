import { useState, useEffect, useMemo } from "react";
import { ShieldCheck, LogIn, LogOut, UserPlus, UserCog, UserX, CalendarX, Trash2, ScrollText } from "lucide-react";
import { getAuditLogs } from "../services/auditLogService";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../utils/errors";
import EmptyState from "../components/EmptyState";
import { SearchInput, TableSkeleton } from "../components/ui";

const ACTION_META = {
  login_success: { label: "Login", icon: LogIn, tone: "text-sage-500 bg-sage-50" },
  login_failed: { label: "Failed login", icon: LogIn, tone: "text-clay-500 bg-clay-50" },
  logout: { label: "Logout", icon: LogOut, tone: "text-ink-400 bg-ink-50" },
  user_created: { label: "Account created", icon: UserPlus, tone: "text-teal-600 bg-teal-50" },
  user_updated: { label: "Account updated", icon: UserCog, tone: "text-amber-600 bg-amber-50" },
  user_deactivated: { label: "Account deactivated", icon: UserX, tone: "text-clay-500 bg-clay-50" },
  appointment_cancelled: { label: "Appointment cancelled", icon: CalendarX, tone: "text-clay-500 bg-clay-50" },
  account_purged: { label: "Account auto-deleted", icon: Trash2, tone: "text-ink-400 bg-ink-50" },
  appointments_purged: { label: "Appointments cleaned up", icon: Trash2, tone: "text-ink-400 bg-ink-50" },
};

function metaFor(action) {
  return ACTION_META[action] || { label: action, icon: ScrollText, tone: "text-ink-400 bg-ink-50" };
}

function formatTimestamp(ts) {
  if (!ts) return "";
  const d = new Date(ts.endsWith("Z") ? ts : ts + "Z");
  return d.toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const { notify } = useToast();

  async function load() {
    try {
      const data = await getAuditLogs();
      setLogs(data);
    } catch (err) {
      notify(getErrorMessage(err, "Couldn't load the audit log."), "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter(
      (l) =>
        l.actor_username?.toLowerCase().includes(q) ||
        metaFor(l.action).label.toLowerCase().includes(q) ||
        l.detail?.toLowerCase().includes(q)
    );
  }, [logs, query]);

  return (
    <div className="space-y-5">
      <SearchInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by user, action, or detail" />

      <div className="bg-white rounded-xl2 border border-ink-100 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-400 uppercase tracking-wide border-b border-ink-100">
                <th className="py-3 px-4 font-medium">When</th>
                <th className="py-3 px-4 font-medium">Action</th>
                <th className="py-3 px-4 font-medium">Who</th>
                <th className="py-3 px-4 font-medium">Detail</th>
                <th className="py-3 px-4 font-medium">IP</th>
              </tr>
            </thead>
            {loading ? (
              <TableSkeleton cols={5} />
            ) : (
              <tbody>
                {filtered.map((l) => {
                  const meta = metaFor(l.action);
                  const Icon = meta.icon;
                  return (
                    <tr key={l.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/50 transition-colors">
                      <td className="py-3 px-4 text-ink-500 text-xs whitespace-nowrap">{formatTimestamp(l.timestamp)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.tone}`}>
                          <Icon size={12} /> {meta.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-ink-700 font-medium">{l.actor_username || "-"}</td>
                      <td className="py-3 px-4 text-ink-500 text-xs">{l.detail || "-"}</td>
                      <td className="py-3 px-4 text-ink-400 text-xs">{l.ip_address || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            )}
          </table>
        </div>
        {!loading && filtered.length === 0 && (
          <EmptyState
            icon={ShieldCheck}
            title={query ? "No matching activity" : "No activity logged yet"}
            message={query ? "Try a different search." : "Logins, account changes, and cancellations will show up here as they happen."}
          />
        )}
      </div>
    </div>
  );
}
