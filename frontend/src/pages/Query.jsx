import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  FileText,
  ExternalLink,
  Zap,
  Loader2,
  ChevronDown,
  Terminal,
  Eye,
  EyeOff,
  Hash,
} from 'lucide-react';
import { search, getDocumentViewUrl } from '../lib/api';
import { useSystem } from '../lib/SystemContext';

/* ── Score bar ─────────────────────────────────────── */
function ScoreBar({ score }) {
  const pct = Math.round(score * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-border overflow-hidden">
        <div
          className="h-full bg-accent transition-all"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="text-[10px] font-mono text-accent">{pct}%</span>
    </div>
  );
}

/* ── Result chunk card ─────────────────────────────── */
function ChunkCard({ result, index, showRaw }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-carbon border border-border p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-text-muted">#{result.id}</span>
          <ScoreBar score={result.score} />
        </div>
        {result.id && (
          <a
            href={getDocumentViewUrl(result.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] font-mono text-text-muted hover:text-accent transition-colors"
          >
            VIEW <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      <p className="text-sm text-text-dim leading-relaxed">{result.content}</p>

      <div className="flex items-center gap-4 text-[10px] font-mono text-text-muted">
        {result.source?.filename && (
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            {result.source.filename}
          </span>
        )}
        {result.source?.chunk_index != null && (
          <span>chunk {result.source.chunk_index}/{result.source.total_chunks}</span>
        )}
      </div>

      {/* Raw JSON data */}
      {showRaw && (
        <details className="mt-2">
          <summary className="text-[10px] font-mono text-text-muted cursor-pointer hover:text-text-dim">
            RAW DATA
          </summary>
          <pre className="mt-2 text-[10px] font-mono text-text-muted bg-panel p-3 overflow-x-auto border border-border">
            {JSON.stringify(result, null, 2)}
          </pre>
        </details>
      )}
    </motion.div>
  );
}

/* ================================================================== */
export default function Query() {
  const { stats, addLog } = useSystem();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [topK, setTopK] = useState(5);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isSearching) return;

    const query = input.trim();
    setMessages((prev) => [...prev, { type: 'query', text: query, ts: Date.now() }]);
    setInput('');
    setIsSearching(true);
    addLog(`Query: "${query}" (k=${topK})`);

    try {
      const { data, latency } = await search(query, topK);
      setMessages((prev) => [
        ...prev,
        { type: 'result', results: data, latency, query, ts: Date.now() },
      ]);
      addLog(`Results: ${data.length} chunks in ${latency}ms`);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { type: 'error', text: err.message, ts: Date.now() },
      ]);
      addLog(`Search error: ${err.message}`, 'ERROR');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Controls bar */}
      <div className="h-10 border-b border-border flex items-center px-4 gap-4 flex-shrink-0 bg-panel">
        <Terminal className="w-4 h-4 text-text-muted" />
        <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
          Query Engine
        </span>
        <div className="w-px h-4 bg-border" />
        <span className="text-[10px] font-mono text-text-muted">
          {stats?.total_vectors ?? 0} vectors searchable
        </span>
        <div className="flex-1" />

        {/* Top K selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-text-muted">K=</span>
          <select
            value={topK}
            onChange={(e) => setTopK(Number(e.target.value))}
            className="bg-carbon border border-border px-2 py-0.5 text-[11px] font-mono text-text-dim focus:outline-none focus:border-accent/30"
          >
            {[1, 3, 5, 10].map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>

        <div className="w-px h-4 bg-border" />

        {/* Raw toggle */}
        <button
          onClick={() => setShowRaw(!showRaw)}
          className={`flex items-center gap-1.5 text-[10px] font-mono transition-colors ${
            showRaw ? 'text-accent' : 'text-text-muted hover:text-text-dim'
          }`}
        >
          {showRaw ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          RAW
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <Zap className="w-8 h-8 text-border-bright mx-auto" />
              <p className="text-sm text-text-muted">Enter a query to search your documents</p>
              <p className="text-[10px] font-mono text-text-muted/50">
                Semantic similarity powered by FAISS + sentence-transformers
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => {
          if (msg.type === 'query') {
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3"
              >
                <span className="text-accent font-mono text-sm font-bold flex-shrink-0 mt-0.5">$</span>
                <div>
                  <p className="text-sm text-text font-mono">{msg.text}</p>
                  <p className="text-[10px] text-text-muted font-mono mt-0.5">
                    {new Date(msg.ts).toLocaleTimeString('en-US', { hour12: false })}
                  </p>
                </div>
              </motion.div>
            );
          }

          if (msg.type === 'result') {
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-3 text-[10px] font-mono text-text-muted">
                  <span className="text-success">→</span>
                  <span>
                    {msg.results.length} result{msg.results.length !== 1 ? 's' : ''} in {msg.latency}ms
                  </span>
                </div>

                {msg.results.length === 0 ? (
                  <div className="bg-carbon border border-border p-4">
                    <p className="text-sm text-text-muted font-mono">
                      No results above similarity threshold (0.20). Documents may not contain relevant information.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-px">
                    {msg.results.map((r, i) => (
                      <ChunkCard key={i} result={r} index={i} showRaw={showRaw} />
                    ))}
                  </div>
                )}
              </motion.div>
            );
          }

          if (msg.type === 'error') {
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-caution/5 border border-caution/20 p-3 flex items-center gap-2"
              >
                <span className="text-caution font-mono text-sm font-bold">!</span>
                <span className="text-sm text-caution/80 font-mono">{msg.text}</span>
              </motion.div>
            );
          }
          return null;
        })}

        {isSearching && (
          <div className="flex items-center gap-2 text-accent text-xs font-mono">
            <Loader2 className="w-3 h-3 animate-spin" />
            Searching {stats?.total_vectors ?? 0} vectors...
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-4 bg-panel flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <span className="text-accent font-mono text-sm font-bold">$</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="search query..."
            disabled={isSearching}
            className="flex-1 bg-transparent text-sm font-mono text-text placeholder:text-text-muted/40 focus:outline-none"
          />
          <span className="text-[10px] font-mono text-text-muted hidden sm:block">k={topK}</span>
          <button
            type="submit"
            disabled={isSearching || !input.trim()}
            className="w-8 h-8 flex items-center justify-center bg-accent/10 text-accent hover:bg-accent hover:text-carbon disabled:opacity-20 transition-colors"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
