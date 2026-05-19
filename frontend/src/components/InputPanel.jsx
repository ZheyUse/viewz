import { useState } from 'react';

export default function InputPanel({ onSubmit, disabled }) {
  const [url, setUrl] = useState('');
  const [count, setCount] = useState(100);
  const [delay, setDelay] = useState(500);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(url, count, delay);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-border p-6 space-y-4">
      <div>
        <label className="block font-mono text-xs text-muted mb-2 uppercase tracking-wider">
          Target URL
        </label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          disabled={disabled}
          className="w-full bg-bg border border-border px-4 py-3 font-mono text-sm text-white placeholder-muted focus:border-accent focus:outline-none focus:shadow-[0_0_0_1px_#39ff14] transition-all"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-mono text-xs text-muted mb-2 uppercase tracking-wider">
            Count
          </label>
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value))}
            min={1}
            max={10000}
            disabled={disabled}
            className="w-full bg-bg border border-border px-4 py-3 font-sans text-sm text-white focus:border-accent focus:outline-none focus:shadow-[0_0_0_1px_#39ff14] transition-all"
          />
        </div>

        <div>
          <label className="block font-mono text-xs text-muted mb-2 uppercase tracking-wider">
            Delay (ms)
          </label>
          <input
            type="number"
            value={delay}
            onChange={(e) => setDelay(parseInt(e.target.value))}
            min={0}
            max={60000}
            step={100}
            disabled={disabled}
            className="w-full bg-bg border border-border px-4 py-3 font-sans text-sm text-white focus:border-accent focus:outline-none focus:shadow-[0_0_0_1px_#39ff14] transition-all"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={disabled || !url}
        className="w-full bg-accent text-bg font-mono text-sm uppercase tracking-widest py-4 mt-2 hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {disabled ? 'Running...' : 'Proceed'}
      </button>
    </form>
  );
}