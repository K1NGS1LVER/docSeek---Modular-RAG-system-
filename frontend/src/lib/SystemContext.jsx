import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { getStats, getIngestStatus, getDocuments } from '../lib/api';

const SystemContext = createContext(null);

export function useSystem() {
  return useContext(SystemContext);
}

export function SystemProvider({ children }) {
  const [stats, setStats] = useState(null);
  const [ingestStatus, setIngestStatus] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [health, setHealth] = useState('CONNECTING');
  const [lastLatency, setLastLatency] = useState(null);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = useCallback((msg, level = 'INFO') => {
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs((prev) => [...prev.slice(-200), { ts, msg, level }]);
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      const { data, latency } = await getStats();
      setStats(data);
      setLastLatency(latency);
      setHealth('READY');
      setError(null);
    } catch (e) {
      setHealth('ERROR');
      setError(e.message);
      addLog(`Stats fetch failed: ${e.message}`, 'ERROR');
    }
  }, [addLog]);

  const refreshDocuments = useCallback(async () => {
    try {
      const { data } = await getDocuments();
      setDocuments(data);
    } catch (e) {
      addLog(`Documents fetch failed: ${e.message}`, 'ERROR');
    }
  }, [addLog]);

  const refreshIngestStatus = useCallback(async () => {
    try {
      const { data } = await getIngestStatus();
      setIngestStatus(data);
      if (data.is_ingesting) {
        setHealth('INDEXING');
      }
    } catch (_) {}
  }, []);

  // Initial load + polling
  useEffect(() => {
    refreshStats();
    refreshDocuments();
    refreshIngestStatus();

    const id = setInterval(() => {
      refreshStats();
      refreshIngestStatus();
    }, 3000);

    return () => clearInterval(id);
  }, [refreshStats, refreshDocuments, refreshIngestStatus]);

  // Poll faster during ingestion
  useEffect(() => {
    if (!ingestStatus?.is_ingesting) return;
    const id = setInterval(() => {
      refreshIngestStatus();
      refreshDocuments();
      refreshStats();
    }, 1000);
    return () => clearInterval(id);
  }, [ingestStatus?.is_ingesting, refreshIngestStatus, refreshDocuments, refreshStats]);

  const value = {
    stats,
    ingestStatus,
    documents,
    health,
    lastLatency,
    error,
    logs,
    addLog,
    refreshStats,
    refreshDocuments,
    refreshIngestStatus,
  };

  return <SystemContext.Provider value={value}>{children}</SystemContext.Provider>;
}
