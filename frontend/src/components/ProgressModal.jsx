import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function ProgressModal({ current, total, status, error, onStop, onMinimize, onClose, onReset }) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-surface border border-border w-96 p-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with buttons */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-mono text-lg text-white">
              {status === 'done' ? 'Complete' : status === 'error' ? 'Error' : 'Processing'}
            </h2>
            <div className="flex gap-2">
              {/* Minimize button */}
              <button
                onClick={onMinimize}
                className="w-8 h-8 flex items-center justify-center text-muted hover:text-white hover:bg-border transition-colors"
                title="Minimize to tray"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="2" y1="7" x2="12" y2="7" />
                </svg>
              </button>
              {/* Stop button */}
              {status === 'running' && (
                <button
                  onClick={onStop}
                  className="w-8 h-8 flex items-center justify-center text-error hover:text-white hover:bg-error/20 transition-colors"
                  title="Stop"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                    <rect x="2" y="2" width="10" height="10" />
                  </svg>
                </button>
              )}
              {/* Close button */}
              <button
                onClick={status === 'done' || status === 'error' ? onReset : onClose}
                className="w-8 h-8 flex items-center justify-center text-muted hover:text-white hover:bg-border transition-colors"
                title="Close"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="2" y1="2" x2="12" y2="12" />
                  <line x1="12" y1="2" x2="2" y2="12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Progress counter */}
          <div className="text-center mb-4">
            <motion.span
              key={current}
              initial={{ scale: 1 }}
              animate={{ scale: 1.05 }}
              transition={{ duration: 0.1 }}
              className="font-mono text-5xl font-bold text-white"
            >
              {current.toLocaleString()}
            </motion.span>
            <span className="font-mono text-3xl font-bold text-muted"> / {total.toLocaleString()}</span>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-border w-full mb-4 overflow-hidden">
            <motion.div
              className="h-full bg-accent"
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ width: { duration: 0.2, ease: 'easeOut' } }}
            />
          </div>

          {/* Percentage */}
          <div className="text-center font-mono text-sm text-muted mb-6">
            {percentage}%
          </div>

          {/* Error message */}
          {status === 'error' && (
            <div className="bg-error/10 border border-error p-3 mb-4">
              <p className="text-error font-mono text-sm">{error}</p>
            </div>
          )}

          {/* Done message */}
          {status === 'done' && (
            <div className="text-center">
              <p className="text-accent text-4xl mb-2">&#10003;</p>
              <p className="text-muted font-sans">
                Link opened {total.toLocaleString()} time{total !== 1 ? 's' : ''} successfully
              </p>
              <button
                onClick={onReset}
                className="mt-4 w-full bg-accent text-bg font-mono text-sm uppercase tracking-widest py-3 hover:opacity-80 transition-opacity"
              >
                Run Again
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}