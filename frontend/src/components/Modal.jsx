import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({ open, title, onClose, children, footer, width = "max-w-lg" }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-ink-900/50 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${width} bg-white rounded-2xl shadow-pop border border-ink-100 my-8 animate-fade-in`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-ink-100">
          <h2 className="text-lg font-semibold text-ink-900 font-display">{title}</h2>
          <button
            onClick={onClose}
            className="text-ink-300 hover:text-ink-600 rounded-lg p-1 hover:bg-ink-50 transition-colors"
            aria-label="Close dialog"
          >
            <X size={19} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="px-6 pb-6 pt-1 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
