import { motion } from 'framer-motion';

export default function SuccessModal({ total, onReset }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
      onClick={onReset}
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="bg-surface border border-border p-12 text-center max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-accent text-6xl mb-6">&#10003;</div>
        <h2 className="font-mono text-2xl text-white mb-2">Complete</h2>
        <p className="text-muted font-sans mb-8">
          Link opened {total.toLocaleString()} time{total !== 1 ? 's' : ''} successfully
        </p>
        <button
          onClick={onReset}
          className="bg-accent text-bg font-mono text-sm uppercase tracking-widest px-8 py-4 hover:opacity-80 transition-opacity"
        >
          Run Again
        </button>
      </motion.div>
    </motion.div>
  );
}