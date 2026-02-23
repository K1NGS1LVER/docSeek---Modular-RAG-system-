import { useSystem } from '../lib/SystemContext';
import { motion } from 'framer-motion';
import {
  Activity,
  Database,
  Cpu,
  HardDrive,
  FileText,
  Layers,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

/* ── Metric tile ───────────────────────────────────── */
function Tile({ icon: Icon, label, value, accent = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 bg-panel border ${accent ? 'border-accent/20' : 'border-border'} flex flex-col gap-3`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${accent ? 'text-accent' : 'text-text-muted'}`} />
        <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">{label}</span>
      </div>
      <span className={`text-2xl font-display font-bold ${accent ? 'text-accent' : 'text-text'}`}>
        {value ?? '—'}
      </span>
    </motion.div>
  );
}

/* ── System state badge ────────────────────────────── */
function StateBadge({ health }) {
  const config = {
    READY: { icon: CheckCircle2, color: 'text-success border-success/30 bg-success/5', label: 'READY' },
    INDEXING: { icon: Loader2, color: 'text-accent border-accent/30 bg-accent/5', label: 'INDEXING' },
    ERROR: { icon: AlertTriangle, color: 'text-caution border-caution/30 bg-caution/5', label: 'ERROR' },
    CONNECTING: { icon: Loader2, color: 'text-text-muted border-border bg-surface', label: 'CONNECTING' },
  }[health] || { icon: Activity, color: 'text-text-muted border-border', label: health };

  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 border font-mono text-sm ${config.color}`}>
      <Icon className={`w-4 h-4 ${health === 'INDEXING' || health === 'CONNECTING' ? 'animate-spin' : ''}`} />
      {config.label}
    </div>
  );
}

/* ── Log viewer ────────────────────────────────────── */
function LogStream({ logs }) {
  return (
    <div className="bg-carbon border border-border p-3 font-mono text-[11px] h-52 overflow-y-auto flex flex-col-reverse">
      <div>
        {logs.length === 0 && (
          <div className="text-text-muted py-4 text-center">No log entries</div>
        )}
        {logs.map((log, i) => (
          <div key={i} className="flex gap-3 py-0.5 leading-snug">
            <span className="text-text-muted flex-shrink-0">{log.ts}</span>
            <span className={
              log.level === 'ERROR' ? 'text-caution' :
              log.level === 'WARN' ? 'text-accent' : 'text-text-dim'
            }>
              [{log.level}]
            </span>
            <span className="text-text-dim">{log.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
export default function Overview() {
  const { stats, health, lastLatency, logs, ingestStatus, error } = useSystem();

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full telemetry-grid">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-text tracking-tight">System Overview</h1>
          <p className="text-xs text-text-muted mt-0.5 font-mono">Real-time engine telemetry</p>
        </div>
        <StateBadge health={health} />
      </div>

      {/* Primary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border">
        <Tile icon={FileText} label="Documents" value={stats?.total_documents} accent />
        <Tile icon={Layers} label="Vectors" value={stats?.total_vectors} accent />
        <Tile icon={Cpu} label="Model" value={stats?.model?.replace('all-', '')} />
        <Tile icon={Zap} label="Latency" value={lastLatency != null ? `${lastLatency}ms` : '—'} />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border">
        <Tile icon={Activity} label="Embedding Dim" value={stats?.dimension} />
        <Tile icon={HardDrive} label="Index Type" value={stats?.index_type?.split(' ')[0]} />
        <Tile icon={Database} label="Similarity" value="Cosine (IP)" />
        <Tile icon={Activity} label="Threshold" value="0.20" />
      </div>

      {/* Ingest status */}
      {ingestStatus?.is_ingesting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-panel border border-accent/20 p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-accent text-sm font-mono">
              <Loader2 className="w-4 h-4 animate-spin" />
              INGESTING
            </div>
            <span className="text-xs text-text-muted font-mono">
              {ingestStatus.progress}/{ingestStatus.total}
            </span>
          </div>
          <div className="h-1 bg-border overflow-hidden">
            <motion.div
              className="h-full bg-accent"
              animate={{
                width: `${ingestStatus.total > 0 ? (ingestStatus.progress / ingestStatus.total) * 100 : 0}%`,
              }}
            />
          </div>
          <p className="text-[11px] text-text-muted mt-2 font-mono truncate">{ingestStatus.message}</p>
        </motion.div>
      )}

      {/* Error display */}
      {error && (
        <div className="bg-caution/5 border border-caution/20 p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-caution flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-caution font-medium">System Error</p>
            <p className="text-xs text-text-muted mt-1 font-mono">{error}</p>
          </div>
        </div>
      )}

      {/* Log stream */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">System Log</span>
          <span className="text-[10px] font-mono text-text-muted/50">{logs.length} entries</span>
        </div>
        <LogStream logs={logs} />
      </div>
    </div>
  );
}
