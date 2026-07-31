import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";

export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  danger = true,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal open={open} title={title} onClose={onCancel} width="max-w-sm">
      <div className="flex gap-3">
        <div
          className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
            danger ? "bg-clay-50 text-clay-400" : "bg-teal-50 text-teal-500"
          }`}
        >
          <AlertTriangle size={18} />
        </div>
        <p className="text-sm text-ink-500 leading-relaxed pt-1.5">{message}</p>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium rounded-lg text-ink-500 hover:bg-ink-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className={`px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors ${
            danger ? "bg-clay-400 hover:bg-clay-500" : "bg-teal-500 hover:bg-teal-600"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
