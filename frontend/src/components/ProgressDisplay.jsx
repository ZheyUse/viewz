import { motion } from 'framer-motion';
import LogFeed from './LogFeed.jsx';

export default function ProgressDisplay({ current, total, status, error, logs }) {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  if (status === 'error') {
    return (
      <div className="bg-surface border border-error p-4">
        <p className="text-error font-mono text-sm">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border p-6 space-y-4">
      <div className="text-center">
        <motion.span
          key={current}
          initial={{ scale: 1 }}
          animate={{ scale: 1.05 }}
          transition={{ duration: 0.1 }}
          className="font-mono text-6xl font-bold text-white"
        >
          {current.toLocaleString()}
        </motion.span>
        <span className="font-mono text-6xl font-bold text-muted"> / {total.toLocaleString()}</span>
      </div>

      <div className="h-1 bg-border w-full overflow-hidden">
        <motion.div
          className="h-full bg-accent"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ width: { duration: 0.2, ease: 'easeOut' } }}
        />
      </div>

      <LogFeed logs={logs} />
    </div>
  );
}