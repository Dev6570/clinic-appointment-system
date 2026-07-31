const STYLES = {
  Scheduled: "bg-amber-50 text-amber-600 border-amber-200",
  Completed: "bg-sage-50 text-sage-500 border-sage-200",
  Cancelled: "bg-clay-50 text-clay-500 border-clay-200",
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] || "bg-ink-50 text-ink-500 border-ink-200";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${style}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
