const STATUS_CONFIG = {
  idle: { label: 'Idle', dotClass: 'bg-muted' },
  running: { label: 'Running', dotClass: 'bg-accent animate-pulse' },
  done: { label: 'Done', dotClass: 'bg-success' },
  error: { label: 'Error', dotClass: 'bg-error' },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.idle;

  return (
    <div className="inline-flex items-center gap-2 bg-surface border border-border px-3 py-1">
      <span className={`w-2 h-2 rounded-full ${config.dotClass}`} />
      <span className="font-mono text-xs text-muted uppercase tracking-wider">
        {config.label}
      </span>
    </div>
  );
}