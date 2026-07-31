import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const STYLES = {
  success: {
    icon: CheckCircle2,
    ring: "border-sage-200 bg-sage-50 text-sage-500",
    iconColor: "text-sage-500",
  },
  error: {
    icon: XCircle,
    ring: "border-clay-200 bg-clay-50 text-clay-500",
    iconColor: "text-clay-400",
  },
  info: {
    icon: Info,
    ring: "border-teal-200 bg-teal-50 text-teal-600",
    iconColor: "text-teal-500",
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (message, type = "info", duration = 3800) => {
      const id = ++counter.current;
      setToasts((prev) => [...prev, { id, message, type }]);
      if (duration) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed top-5 right-5 z-[100] flex flex-col gap-2 w-[min(360px,calc(100vw-2.5rem))]">
        {toasts.map((t) => {
          const style = STYLES[t.type] || STYLES.info;
          const Icon = style.icon;
          return (
            <div
              key={t.id}
              className={`animate-toast-in flex items-start gap-2.5 rounded-xl border ${style.ring} shadow-pop px-4 py-3`}
              role="status"
            >
              <Icon size={18} className={`mt-0.5 shrink-0 ${style.iconColor}`} />
              <p className="text-sm leading-snug flex-1 text-ink-800">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="text-ink-300 hover:text-ink-600 transition-colors"
                aria-label="Dismiss notification"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
