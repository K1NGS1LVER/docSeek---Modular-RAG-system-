import { useSystem } from '../lib/SystemContext';
import { motion } from 'framer-motion';
import {
  FileText,
  Scissors,
  Binary,
  Database,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Zap,
} from 'lucide-react';

/* ── Pipeline stage ────────────────────────────────── */
function Stage({ icon: Icon, label, description, value, active = false, complete = false, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`flex-1 p-5 bg-panel border ${
        active ? 'border-accent/40' : 'border-border'
      } relative`}
    >
      {active && (
        <div className="absolute top-0 left-0 right-0 h-px bg-accent" />
      )}
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-5 h-5 ${active ? 'text-accent' : complete ? 'text-success' : 'text-text-muted'}`} />
        <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">{label}</span>
        {complete && <CheckCircle2 className="w-3 h-3 text-success ml-auto" />}
        {active && <Loader2 className="w-3 h-3 text-accent ml-auto animate-spin" />}
      </div>
      <p className="text-2xl font-display font-bold text-text mb-1">{value}</p>
      <p className="text-[11px] text-text-muted leading-snug">{description}</p>
    </motion.div>
  );
}

/* ── Arrow connector ───────────────────────────────── */
function Connector() {
  return (
    <div className="flex items-center justify-center w-8 flex-shrink-0">
      <ArrowRight className="w-4 h-4 text-border-bright" />
    </div>
  );
}

/* ================================================================== */
export default function Pipeline() {
  const { stats, ingestStatus } = useSystem();
  const isIngesting = ingestStatus?.is_ingesting;

  const totalDocs = stats?.total_documents ?? 0;
  const totalVectors = stats?.total_vectors ?? 0;
  const dim = stats?.dimension ?? 768;
  const avgChunks = totalDocs > 0 ? Math.round(totalVectors / Math.max(1, totalDocs)) : 0;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full telemetry-grid">
      {/* Header */}
      <div>
        <h1 className="font-display text-xl font-bold text-text tracking-tight">Index Pipeline</h1>
        <p className="text-xs text-text-muted mt-0.5 font-mono">Document → Chunk → Embed → Index</p>
      </div>

      {/* Pipeline stages */}
      <div className="flex items-stretch gap-0">
        <Stage
          icon={FileText}
          label="Ingest"
          description="Documents received and parsed into raw text"
          value={totalDocs}
          complete={totalDocs > 0}
          index={0}
        />
        <Connector />
        <Stage
          icon={Scissors}
          label="Chunk"
          description={`Split into ~300 char segments with 50 char overlap`}
          value={totalVectors}
          complete={totalVectors > 0}
          active={isIngesting}
          index={1}
        />
        <Connector />
        <Stage
          icon={Binary}
          label="Embed"
          description={`${dim}-dimensional vectors via sentence-transformers`}
          value={`${dim}d`}
          complete={totalVectors > 0}
          active={isIngesting}
          index={2}
        />
        <Connector />
        <Stage
          icon={Database}
          label="Index"
          description="FAISS IndexIDMap with inner-product similarity"
          value={totalVectors}
          complete={totalVectors > 0}
          active={isIngesting}
          index={3}
        />
      </div>

      {/* Detailed stats grid */}
      <div className="grid grid-cols-3 gap-px bg-border">
        <div className="p-4 bg-panel">
          <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-1">Avg Chunks / Doc</div>
          <div className="text-xl font-display font-bold text-text">{avgChunks || '—'}</div>
        </div>
        <div className="p-4 bg-panel">
          <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-1">Chunk Size</div>
          <div className="text-xl font-display font-bold text-text">300 chars</div>
        </div>
        <div className="p-4 bg-panel">
          <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-1">Overlap</div>
          <div className="text-xl font-display font-bold text-text">50 chars</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-px bg-border">
        <div className="p-4 bg-panel">
          <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-1">Model</div>
          <div className="text-sm font-mono text-text">{stats?.model || '—'}</div>
        </div>
        <div className="p-4 bg-panel">
          <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-1">Index Type</div>
          <div className="text-sm font-mono text-text">{stats?.index_type || '—'}</div>
        </div>
        <div className="p-4 bg-panel">
          <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-1">Similarity Metric</div>
          <div className="text-sm font-mono text-text">Inner Product (Cosine)</div>
        </div>
      </div>

      {/* Live ingest status */}
      {isIngesting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-panel border border-accent/20 p-5 space-y-3"
        >
          <div className="flex items-center gap-2 text-accent text-xs font-mono">
            <Zap className="w-4 h-4" />
            LIVE PIPELINE — {ingestStatus.progress}/{ingestStatus.total} files processed
          </div>
          <div className="h-2 bg-border overflow-hidden">
            <motion.div
              className="h-full bg-accent"
              animate={{
                width: `${ingestStatus.total ? (ingestStatus.progress / ingestStatus.total) * 100 : 0}%`,
              }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-[11px] font-mono text-text-muted">{ingestStatus.message}</p>
          {ingestStatus.current_file && (
            <p className="text-[11px] font-mono text-text-dim">
              Current: {ingestStatus.current_file}
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}
