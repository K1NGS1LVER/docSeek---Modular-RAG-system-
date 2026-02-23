import { useSystem } from '../lib/SystemContext';
import { Activity, Cpu, Database, Clock } from 'lucide-react';

export default function StatusBar() {
  const { health, stats, lastLatency } = useSystem();

  const statusColor = {
    READY: 'bg-success',
    INDEXING: 'bg-accent',
    ERROR: 'bg-caution',
    CONNECTING: 'bg-text-muted',
  }[health] || 'bg-text-muted';

  const statusLabel = {
    READY: 'SYSTEM READY',
    INDEXING: 'INDEXING',
    ERROR: 'ERROR',
    CONNECTING: 'CONNECTING',
  }[health] || 'UNKNOWN';

  return (
    <header className="h-10 bg-panel border-b border-border flex items-center px-4 gap-6 text-[11px] font-mono tracking-wider select-none flex-shrink-0">
      {/* Status indicator */}
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${statusColor} ${health === 'INDEXING' ? 'animate-pulse-dot' : ''}`} />
        <span className="text-text-dim uppercase">{statusLabel}</span>
      </div>

      <div className="w-px h-4 bg-border" />

      {/* Model */}
      <div className="flex items-center gap-1.5 text-text-muted">
        <Cpu className="w-3 h-3" />
        <span>{stats?.model || '—'}</span>
      </div>

      <div className="w-px h-4 bg-border" />

      {/* Vectors */}
      <div className="flex items-center gap-1.5 text-text-muted">
        <Database className="w-3 h-3" />
        <span>{stats?.total_vectors ?? '—'} vectors</span>
      </div>

      <div className="w-px h-4 bg-border" />

      {/* Dimension */}
      <div className="flex items-center gap-1.5 text-text-muted">
        <Activity className="w-3 h-3" />
        <span>{stats?.dimension ?? '—'}d</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Latency */}
      <div className="flex items-center gap-1.5 text-text-muted">
        <Clock className="w-3 h-3" />
        <span>{lastLatency != null ? `${lastLatency}ms` : '—'}</span>
      </div>

      {/* Index type */}
      <div className="text-text-muted hidden lg:block">
        {stats?.index_type || ''}
      </div>
    </header>
  );
}
