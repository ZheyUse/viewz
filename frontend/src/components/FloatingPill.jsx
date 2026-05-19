import { motion, AnimatePresence } from 'framer-motion';

export default function FloatingPill({ current, total, status, onRestore }) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <AnimatePresence>
      <motion.button
        initial={{ opacity: 0, y: 20, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.8 }}
        onClick={onRestore}
        className="fixed bottom-6 right-6 bg-surface border border-border px-4 py-3 flex items-center gap-4 hover:border-accent transition-colors cursor-pointer z-40"
      >
        {/* Status indicator */}
        <div className={`w-2 h-2 rounded-full ${
          status === 'running' ? 'bg-accent animate-pulse' :
          status === 'done' ? 'bg-accent' :
          status === 'error' ? 'bg-error' : 'bg-muted'
        }`} />

        {/* Progress text */}
        <div className="text-left">
          <div className="font-mono text-lg text-white">
            <span className="font-bold">{current.toLocaleString()}</span>
            <span className="text-muted"> / {total.toLocaleString()}</span>
          </div>
          <div className="text-xs text-muted font-mono">{percentage}%</div>
        </div>

        {/* Mini progress bar */}
        <div className="w-24 h-1 bg-border overflow-hidden">
          <motion.div
            className="h-full bg-accent"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ width: { duration: 0.2 } }}
          />
        </div>

        {/* Label */}
        <span className="font-mono text-xs text-muted uppercase">
          {status === 'running' ? 'Processing' : status}
        </span>
      </motion.button>
    </AnimatePresence>
  );
}