import { useState, useCallback, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import { startSession as apiStartSession } from '../lib/api.js';

export function useViewZSocket() {
  const [status, setStatus] = useState('idle');
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);

  const socketRef = useRef(null);
  const sessionIdRef = useRef(null);

  const startSession = useCallback(async (url, count, delay) => {
    try {
      const { sessionId } = await apiStartSession(url, count, delay);
      sessionIdRef.current = sessionId;
      setTotal(count);
      setCurrent(0);
      setError(null);
      setLogs([]);

      const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3001';
      const socket = io(wsUrl, {
        transports: ['websocket', 'polling'],
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('join', { sessionId });
      });

      socket.on('progress', ({ current: curr, total: tot }) => {
        setStatus('running');
        setCurrent(curr);
        setTotal(tot);
        setLogs((prev) => [
          ...prev.slice(-99),
          { time: new Date().toISOString(), current: curr },
        ]);
      });

      socket.on('done', ({ sessionId: doneId, total: doneTotal }) => {
        if (doneId === sessionIdRef.current) {
          setStatus('done');
          setCurrent(doneTotal);
          socket.disconnect();
        }
      });

      socket.on('error', ({ sessionId: errorId, message }) => {
        if (errorId === sessionIdRef.current) {
          setStatus('error');
          setError(message);
          socket.disconnect();
        }
      });

      setStatus('running');
    } catch (err) {
      setStatus('error');
      setError(err.response?.data?.error || err.message);
    }
  }, []);

  const reset = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    setStatus('idle');
    setCurrent(0);
    setTotal(0);
    setError(null);
    setLogs([]);
    sessionIdRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return { status, current, total, error, logs, startSession, reset };
}