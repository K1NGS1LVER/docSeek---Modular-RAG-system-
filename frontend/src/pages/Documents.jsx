import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  RotateCcw,
  Github,
  X,
  FolderOpen,
  ArrowUpFromLine,
} from 'lucide-react';
import { uploadFile, ingestGithub } from '../lib/api';
import { useSystem } from '../lib/SystemContext';

/* ── File status config ───────────────────────────── */
const STATUS = {
  queued: { label: 'QUEUED', color: 'text-text-muted', icon: FileText },
  uploading: { label: 'UPLOADING', color: 'text-info', icon: Loader2 },
  chunking: { label: 'CHUNKING', color: 'text-accent', icon: Loader2 },
  embedding: { label: 'EMBEDDING', color: 'text-accent', icon: Loader2 },
  indexed: { label: 'INDEXED', color: 'text-success', icon: CheckCircle2 },
  error: { label: 'ERROR', color: 'text-caution', icon: XCircle },
};

/* ── Single file row ──────────────────────────────── */
function FileRow({ item, onRemove, onRetry }) {
  const cfg = STATUS[item.status];
  const Icon = cfg.icon;
  const spinning = ['uploading', 'chunking', 'embedding'].includes(item.status);

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      className="flex items-center gap-3 px-4 py-3 bg-panel border border-border hover:border-border-bright transition-colors"
    >
      <FileText className="w-4 h-4 text-text-muted flex-shrink-0" />
      <span className="text-sm text-text flex-1 truncate font-mono">{item.file.name}</span>
      <span className="text-[10px] text-text-muted font-mono">
        {(item.file.size / 1024).toFixed(1)}KB
      </span>
      <div className="w-px h-4 bg-border" />
      <div className={`flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider ${cfg.color}`}>
        <Icon className={`w-3 h-3 ${spinning ? 'animate-spin' : ''}`} />
        {cfg.label}
      </div>
      {item.chunks != null && (
        <span className="text-[10px] font-mono text-text-dim">{item.chunks} chunks</span>
      )}
      {item.latency != null && (
        <span className="text-[10px] font-mono text-text-muted">{item.latency}ms</span>
      )}
      <div className="flex items-center gap-1 ml-1">
        {item.status === 'error' && (
          <button onClick={() => onRetry(item.id)} className="p-1 text-text-muted hover:text-accent transition-colors">
            <RotateCcw className="w-3 h-3" />
          </button>
        )}
        <button onClick={() => onRemove(item.id)} className="p-1 text-text-muted hover:text-caution transition-colors">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}

/* ================================================================== */
export default function Documents() {
  const { refreshDocuments, refreshStats, addLog, ingestStatus, refreshIngestStatus, documents } = useSystem();
  const [queue, setQueue] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showGithub, setShowGithub] = useState(false);
  const [ghUrl, setGhUrl] = useState('');
  const [ghSub, setGhSub] = useState('');
  const fileRef = useRef(null);
  let nextId = useRef(0);

  /* add files to queue */
  const addFiles = useCallback((fileList) => {
    const items = Array.from(fileList).map((f) => ({
      id: nextId.current++,
      file: f,
      status: 'queued',
      chunks: null,
      latency: null,
      error: null,
    }));
    setQueue((prev) => [...prev, ...items]);
  }, []);

  const removeItem = (id) => setQueue((q) => q.filter((i) => i.id !== id));

  const updateItem = (id, patch) =>
    setQueue((q) => q.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  /* Process the queue sequentially */
  const processQueue = async () => {
    setIsProcessing(true);
    const pending = queue.filter((i) => i.status === 'queued' || i.status === 'error');

    for (const item of pending) {
      updateItem(item.id, { status: 'uploading' });
      addLog(`Uploading ${item.file.name}...`);

      try {
        // Simulate stage transitions
        await new Promise((r) => setTimeout(r, 100));
        updateItem(item.id, { status: 'chunking' });

        const { data, latency } = await uploadFile(item.file);

        updateItem(item.id, { status: 'embedding' });
        await new Promise((r) => setTimeout(r, 200));

        updateItem(item.id, {
          status: 'indexed',
          chunks: data.chunks,
          latency,
        });
        addLog(`Indexed ${item.file.name}: ${data.chunks} chunks in ${data.time_seconds}s`);
      } catch (e) {
        updateItem(item.id, { status: 'error', error: e.message });
        addLog(`Failed ${item.file.name}: ${e.message}`, 'ERROR');
      }
    }

    await refreshDocuments();
    await refreshStats();
    setIsProcessing(false);
  };

  const retryItem = (id) => {
    updateItem(id, { status: 'queued', error: null });
  };

  /* GitHub ingest */
  const handleGithub = async () => {
    if (!ghUrl) return;
    try {
      await ingestGithub(ghUrl, ghSub || null);
      addLog(`GitHub ingestion started: ${ghUrl}`);
      setShowGithub(false);
      setGhUrl('');
      setGhSub('');
      refreshIngestStatus();
    } catch (e) {
      addLog(`GitHub ingest failed: ${e.message}`, 'ERROR');
    }
  };

  const queuedCount = queue.filter((i) => i.status === 'queued').length;
  const indexedCount = queue.filter((i) => i.status === 'indexed').length;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-text tracking-tight">Document Ingestion</h1>
          <p className="text-xs text-text-muted mt-0.5 font-mono">Upload, chunk, embed, index</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGithub(!showGithub)}
            className="flex items-center gap-2 px-3 py-1.5 border border-border text-xs font-mono text-text-dim hover:text-text hover:border-border-bright transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
            GITHUB
          </button>
        </div>
      </div>

      {/* GitHub form */}
      <AnimatePresence>
        {showGithub && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-panel border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-text-dim uppercase tracking-wider">Clone & Ingest Repository</span>
                <button onClick={() => setShowGithub(false)} className="text-text-muted hover:text-text">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                value={ghUrl}
                onChange={(e) => setGhUrl(e.target.value)}
                placeholder="https://github.com/user/repo"
                className="w-full bg-carbon border border-border px-3 py-2 text-sm font-mono text-text placeholder:text-text-muted/50 focus:outline-none focus:border-accent/30"
              />
              <div className="flex gap-3">
                <input
                  type="text"
                  value={ghSub}
                  onChange={(e) => setGhSub(e.target.value)}
                  placeholder="subpath (optional)"
                  className="flex-1 bg-carbon border border-border px-3 py-2 text-sm font-mono text-text placeholder:text-text-muted/50 focus:outline-none focus:border-accent/30"
                />
                <button
                  onClick={handleGithub}
                  disabled={!ghUrl}
                  className="px-4 py-2 bg-accent text-carbon text-xs font-bold font-mono uppercase tracking-wider hover:bg-accent-dim disabled:opacity-30 transition-colors"
                >
                  INGEST
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ingest progress bar */}
      {ingestStatus?.is_ingesting && (
        <div className="bg-panel border border-accent/20 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-accent">
              <Loader2 className="w-3 h-3 animate-spin" />
              GITHUB INGEST
            </div>
            <span className="text-text-muted">{ingestStatus.progress}/{ingestStatus.total}</span>
          </div>
          <div className="h-1 bg-border overflow-hidden">
            <motion.div
              className="h-full bg-accent"
              animate={{ width: `${ingestStatus.total ? (ingestStatus.progress / ingestStatus.total) * 100 : 0}%` }}
            />
          </div>
          <p className="text-[10px] font-mono text-text-muted truncate">{ingestStatus.message}</p>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        onClick={() => fileRef.current?.click()}
        className={`relative cursor-pointer border-2 border-dashed p-10 text-center transition-all duration-200 ${
          dragOver ? 'border-accent bg-accent/5' : 'border-border hover:border-border-bright'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".txt,.md,.markdown,.html,.htm,.docx"
          onChange={(e) => addFiles(e.target.files)}
          className="hidden"
        />
        <ArrowUpFromLine className={`w-8 h-8 mx-auto mb-3 ${dragOver ? 'text-accent' : 'text-text-muted'}`} />
        <p className="text-sm text-text-dim">
          Drop files here or <span className="text-accent">browse</span>
        </p>
        <p className="text-[10px] text-text-muted mt-1 font-mono">.txt .md .html .docx supported</p>
      </div>

      {/* Queue controls */}
      {queue.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-text-muted">
            {queue.length} file{queue.length > 1 ? 's' : ''} · {indexedCount} indexed · {queuedCount} pending
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQueue([])}
              className="px-3 py-1.5 border border-border text-xs font-mono text-text-muted hover:text-caution hover:border-caution/30 transition-colors"
            >
              CLEAR
            </button>
            <button
              onClick={processQueue}
              disabled={isProcessing || queuedCount === 0}
              className="px-4 py-1.5 bg-accent text-carbon text-xs font-bold font-mono uppercase tracking-wider hover:bg-accent-dim disabled:opacity-30 transition-colors"
            >
              {isProcessing ? 'PROCESSING...' : `INGEST ${queuedCount}`}
            </button>
          </div>
        </div>
      )}

      {/* File queue */}
      <div className="space-y-px">
        <AnimatePresence>
          {queue.map((item) => (
            <FileRow key={item.id} item={item} onRemove={removeItem} onRetry={retryItem} />
          ))}
        </AnimatePresence>
      </div>

      {/* Indexed documents */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FolderOpen className="w-4 h-4 text-text-muted" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
            Indexed Documents ({documents.length})
          </span>
        </div>
        {documents.length === 0 ? (
          <div className="bg-panel border border-border p-8 text-center">
            <p className="text-sm text-text-muted">No documents in index</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-px bg-border">
            {documents.map((doc, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 bg-panel">
                <FileText className="w-3.5 h-3.5 text-accent/50 flex-shrink-0" />
                <span className="text-xs font-mono text-text-dim truncate">{doc}</span>
                <CheckCircle2 className="w-3 h-3 text-success ml-auto flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
