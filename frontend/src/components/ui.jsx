import { Search } from "lucide-react";

export function SearchInput({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="relative w-full sm:w-72">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-ink-100 bg-white text-sm text-ink-800 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition-shadow"
      />
    </div>
  );
}

export function Field({ label, children, hint, span }) {
  return (
    <label className={`block ${span ? "sm:col-span-2" : ""}`}>
      <span className="block text-xs font-medium text-ink-500 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-ink-300 mt-1">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-ink-100 bg-white px-3 py-2.5 text-sm text-ink-800 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition-shadow";

export function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-lg bg-teal-500 text-white text-sm font-medium px-4 py-2.5 hover:bg-teal-600 active:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = "", ...props }) {
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-lg border border-ink-100 bg-white text-ink-600 text-sm font-medium px-4 py-2.5 hover:bg-ink-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconButton({ children, tone = "ink", className = "", ...props }) {
  const tones = {
    ink: "text-ink-400 hover:text-ink-700 hover:bg-ink-50",
    clay: "text-ink-400 hover:text-clay-500 hover:bg-clay-50",
    teal: "text-ink-400 hover:text-teal-600 hover:bg-teal-50",
  };
  return (
    <button
      className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${tones[tone]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-ink-50 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="py-4 px-4">
              <div className="h-3.5 rounded bg-ink-50 animate-pulse" style={{ width: `${60 + ((r + c) % 3) * 15}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
