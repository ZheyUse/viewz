import { useViewZSocket } from './hooks/useViewZSocket.js';
import InputPanel from './components/InputPanel.jsx';
import ProgressDisplay from './components/ProgressDisplay.jsx';
import SuccessModal from './components/SuccessModal.jsx';
import StatusBadge from './components/StatusBadge.jsx';

function App() {
  const { status, current, total, error, logs, startSession, reset } = useViewZSocket();

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
          <StatusBadge status={status} />
        </div>

        <InputPanel
          onSubmit={startSession}
          disabled={status === 'running'}
        />

        {status !== 'idle' && (
          <ProgressDisplay
            current={current}
            total={total}
            status={status}
            error={error}
            logs={logs}
          />
        )}

        {status === 'done' && (
          <SuccessModal
            total={total}
            onReset={reset}
          />
        )}
      </main>
    </div>
  );
}

export default App;