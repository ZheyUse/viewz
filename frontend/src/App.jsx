import { useState } from 'react';
import { useViewZSocket } from './hooks/useViewZSocket.js';
import InputPanel from './components/InputPanel.jsx';
import ProgressModal from './components/ProgressModal.jsx';
import FloatingPill from './components/FloatingPill.jsx';

function App() {
  const { status, current, total, error, startSession, reset } = useViewZSocket();
  const [isMinimized, setIsMinimized] = useState(false);

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleRestore = () => {
    setIsMinimized(false);
  };

  const handleClose = () => {
    setIsMinimized(true);
  };

  const handleStop = () => {
    reset();
    setIsMinimized(false);
  };

  const handleReset = () => {
    reset();
    setIsMinimized(false);
  };

  const isActive = status === 'running' || status === 'done' || status === 'error';

  return (
    <div className="min-h-screen bg-bg text-white font-sans">
      <header className="p-6 border-b border-border">
        <h1 className="font-mono text-2xl">
          VIEW<span className="text-accent">Z</span>
        </h1>
      </header>

      <main className="max-w-xl mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted text-sm">Headless link opener</p>
        </div>

        <InputPanel
          onSubmit={startSession}
          disabled={isActive}
        />
      </main>

      {/* Progress Modal */}
      {status !== 'idle' && !isMinimized && (
        <ProgressModal
          current={current}
          total={total}
          status={status}
          error={error}
          onStop={handleStop}
          onMinimize={handleMinimize}
          onClose={handleClose}
          onReset={handleReset}
        />
      )}

      {/* Floating Pill (when minimized) */}
      {isActive && isMinimized && (
        <FloatingPill
          current={current}
          total={total}
          status={status}
          onRestore={handleRestore}
        />
      )}
    </div>
  );
}

export default App;