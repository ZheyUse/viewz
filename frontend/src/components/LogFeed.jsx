export default function LogFeed({ logs }) {
  if (!logs || logs.length === 0) return null;

  return (
    <div className="border border-border p-2 h-32 overflow-y-auto bg-bg">
      {logs.map((log, i) => (
        <div key={i} className="font-mono text-xs text-muted py-0.5">
          <span className="text-accent">&#10003;</span>{' '}
          {new Date(log.time).toLocaleTimeString()} — hit {log.current}
        </div>
      ))}
    </div>
  );
}