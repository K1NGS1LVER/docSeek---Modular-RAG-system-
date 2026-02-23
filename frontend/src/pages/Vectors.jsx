import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Database,
  RotateCw,
  HardDrive,
  Cpu,
  Layers,
  Hash,
  Box,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { rebuildIndex } from '../lib/api';
import { useSystem } from '../lib/SystemContext';

/* ── Stat tile ────────────────────────────────────── */
function Tile({ label, value, unit, icon: Icon }) {
  return (
    <div className="bg-panel border border-border p-4 space-y-2">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-3 h-3 text-text-muted" />}
        <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-mono font-bold text-text">{value ?? '—'}</span>
        {unit && <span className="text-[10px] font-mono text-text-muted">{unit}</span>}
      </div>
    </div>
  );
}

/* ================================================================== */
export default function Vectors() {
  const { stats, health, addLog, refreshStats } = useSystem();
  const [rebuilding, setRebuilding] = useState(false);
  const [rebuildResult, setRebuildResult] = useState(null);

  const estimatedMemMB =
    stats?.total_vectors && stats?.embedding_dimension
      ? ((stats.total_vectors * stats.embedding_dimension * 4) / (1024 * 1024)).toFixed(2)
      : null;

  const handleRebuild = async () => {
    setRebuilding(true);
    setRebuildResult(null);
    addLog('Rebuild index triggered');
    try {
      const { data, latency } = await rebuildIndex();
      setRebuildResult({ success: true, latency, message: data?.message || 'Index rebuilt' });
      addLog(`Index rebuilt in ${latency}ms`);
      refreshStats();
    } catch (err) {
      setRebuildResult({ success: false, message: err.message });
      addLog(`Rebuild failed: ${err.message}`, 'ERROR');
    } finally {
      setRebuilding(false);
    }
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="w-4 h-4 text-accent" />
          <h1 className="text-sm font-mono font-bold uppercase tracking-wider text-text">
            Vector Store
          </h1>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-text-muted">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              health === 'READY' ? 'bg-success' : health === 'INDEXING' ? 'bg-accent animate-pulse' : 'bg-caution'
            }`}
          />
          {health}
        </div>
      </div>

      {/* Metric tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
        <Tile icon={Hash} label="Total Vectors" value={stats?.total_vectors ?? 0} />
        <Tile icon={Box} label="Dimension" value={stats?.embedding_dimension ?? '—'} unit="d" />
        <Tile icon={Layers} label="Index Type" value={stats?.index_type ?? '—'} />
        <Tile icon={HardDrive} label="Est. Memory" value={estimatedMemMB ?? '—'} unit="MB" />
      </div>

      {/* Index architecture */}
      <div className="bg-panel border border-border">
        <div className="h-8 border-b border-border flex items-center px-4 gap-2">
          <Cpu className="w-3 h-3 text-text-muted" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
            Index Architecture
          </span>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            {[
              { label: 'Engine', value: 'FAISS (Facebook AI Similarity Search)' },
              { label: 'Index Structure', value: 'IndexIDMap + IndexFlatIP' },
              { label: 'Metric', value: 'Inner Product (cosine via normalization)' },
              { label: 'ID Mapping', value: 'Explicit DB ID → FAISS position' },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-text-muted w-28 flex-shrink-0">
                  {row.label}
                </span>
                <span className="text-xs font-mono text-text-dim">{row.value}</span>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {[
              { label: 'Embedding Model', value: stats?.model ?? '—' },
              { label: 'Dimensions', value: stats?.embedding_dimension ?? '—' },
              { label: 'Total Docs', value: stats?.total_documents ?? '—' },
              { label: 'Storage', value: 'data/my_index.faiss' },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-text-muted w-28 flex-shrink-0">
                  {row.label}
                </span>
                <span className="text-xs font-mono text-text-dim">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rebuild action */}
      <div className="bg-panel border border-border">
        <div className="h-8 border-b border-border flex items-center px-4 gap-2">
          <RotateCw className="w-3 h-3 text-text-muted" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
            Index Operations
          </span>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-mono text-text-dim">Rebuild FAISS Index</p>
              <p className="text-[10px] font-mono text-text-muted">
                Re-reads all chunks from SQLite and rebuilds the vector index from scratch. Use after
                manual DB edits or corruption.
              </p>
            </div>
            <button
              onClick={handleRebuild}
              disabled={rebuilding}
              className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent text-[11px] font-mono font-bold uppercase tracking-wider hover:bg-accent hover:text-carbon transition-colors disabled:opacity-40"
            >
              {rebuilding ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" /> Rebuilding...
                </>
              ) : (
                <>
                  <RotateCw className="w-3 h-3" /> Rebuild
                </>
              )}
            </button>
          </div>

          {rebuildResult && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-2 p-3 border text-xs font-mono ${
                rebuildResult.success
                  ? 'border-success/20 bg-success/5 text-success'
                  : 'border-caution/20 bg-caution/5 text-caution'
              }`}
            >
              {rebuildResult.success ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <AlertTriangle className="w-3 h-3" />
              )}
              {rebuildResult.message}
              {rebuildResult.latency && (
                <span className="text-text-muted ml-auto">{rebuildResult.latency}ms</span>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Data flow diagram */}
      <div className="bg-panel border border-border">
        <div className="h-8 border-b border-border flex items-center px-4 gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
            Data Flow
          </span>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 text-[10px] font-mono text-text-muted overflow-x-auto">
            <span className="bg-surface border border-border px-3 py-1.5 text-text-dim whitespace-nowrap">
              Document
            </span>
            <span className="text-accent">→</span>
            <span className="bg-surface border border-border px-3 py-1.5 text-text-dim whitespace-nowrap">
              Chunker (300c/50ov)
            </span>
            <span className="text-accent">→</span>
            <span className="bg-surface border border-border px-3 py-1.5 text-text-dim whitespace-nowrap">
              Encoder ({stats?.model?.split('/').pop() ?? 'mpnet'})
            </span>
            <span className="text-accent">→</span>
            <span className="bg-surface border border-border px-3 py-1.5 text-text-dim whitespace-nowrap">
              FAISS IndexIDMap
            </span>
            <span className="text-accent">→</span>
            <span className="bg-surface border border-border px-3 py-1.5 text-text-dim whitespace-nowrap">
              Inner Product Search
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
