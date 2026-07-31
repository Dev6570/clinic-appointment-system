export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {Icon && (
        <div className="h-12 w-12 rounded-full bg-ink-50 text-ink-300 flex items-center justify-center mb-4">
          <Icon size={22} />
        </div>
      )}
      <p className="text-ink-700 font-medium">{title}</p>
      {message && <p className="text-sm text-ink-400 mt-1 max-w-sm">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
