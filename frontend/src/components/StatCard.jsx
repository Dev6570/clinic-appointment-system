export default function StatCard({ label, value, icon: Icon, tone = "teal" }) {
  const tones = {
    teal: "bg-teal-50 text-teal-600",
    amber: "bg-amber-50 text-amber-600",
    sage: "bg-sage-50 text-sage-500",
    clay: "bg-clay-50 text-clay-500",
    ink: "bg-ink-100 text-ink-600",
  };
  return (
    <div className="bg-white rounded-xl2 border border-ink-100 shadow-card p-5 flex items-center gap-4">
      <div className={`h-11 w-11 rounded-lg flex items-center justify-center shrink-0 ${tones[tone]}`}>
        {Icon && <Icon size={20} />}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-semibold text-ink-900 font-display leading-none">{value}</p>
        <p className="text-xs text-ink-400 mt-1.5 truncate">{label}</p>
      </div>
    </div>
  );
}
