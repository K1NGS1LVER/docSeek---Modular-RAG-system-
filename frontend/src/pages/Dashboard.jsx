import { useState, useRef, useEffect } from 'react';
import {
  Send,
  FileText,
  Upload,
  Bot,
  User,
  RotateCcw,
  Github,
  AlertCircle,
  ExternalLink,
  Search,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const API_URL = "/api";

const Dashboard = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hello! Upload a document to get started. I can help you find specific information within your files.'
    }
  ]);
  const [input, setInput] = useState('');
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [mode, setMode] = useState('ask'); // 'ask' (default) or 'search'
  const [showGithubForm, setShowGithubForm] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const [githubSubpath, setGithubSubpath] = useState('');
  const [ingestStatus, setIngestStatus] = useState({
    is_ingesting: false,
    message: '',
    progress: 0,
    total: 0,
    error: null
  });

  const chatEndRef = useRef(null);

  /* ------------------------------------------------------------------
   * FETCH DOCUMENTS & STATUS (UNCHANGED)
   * ------------------------------------------------------------------ */

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_URL}/documents`);
      if (res.ok) {
        setFiles(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch documents", e);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/ingest/status`);
      if (res.ok) {
        const status = await res.json();
        setIngestStatus(status);

        if (!status.is_ingesting && (status.progress > 0 || status.error)) {
          fetchDocuments();
        }
      }
    } catch (e) {
      console.error("Failed to fetch ingest status", e);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchStatus();
  }, []);

  useEffect(() => {
    let interval;
    if (ingestStatus.is_ingesting) {
      interval = setInterval(fetchStatus, 1000);
    }
    return () => clearInterval(interval);
  }, [ingestStatus.is_ingesting]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  /* ------------------------------------------------------------------
   * ASK HANDLER (LLM-POWERED STREAMING)
   * ------------------------------------------------------------------ */

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const query = input;
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setInput('');
    setIsSearching(true);

    // Add an empty assistant message that we'll stream into
    const assistantIdx = messages.length + 1; // +1 for the user message we just added
    setMessages(prev => [...prev, { role: 'assistant', content: '', isStreaming: true }]);

    try {
      const res = await fetch(`${API_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, k: 3 })
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      // Read the SSE stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            accumulated += data;

            // Update the last assistant message with accumulated text
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: 'assistant',
                content: accumulated,
                isStreaming: true
              };
              return updated;
            });
          }
        }
      }

      // Mark streaming as complete
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: accumulated || "No response received from the LLM.",
          isStreaming: false
        };
        return updated;
      });

    } catch (error) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: `Error: ${error.message}. Is the server and Ollama running?`,
          isStreaming: false
        };
        return updated;
      });
    } finally {
      setIsSearching(false);
    }
  };

  /* ------------------------------------------------------------------
   * SEARCH HANDLER (ORIGINAL — UNCHANGED)
   * ------------------------------------------------------------------ */

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');
    setIsSearching(true);

    try {
      const res = await fetch(`${API_URL}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input, k: 3 })
      });

      const results = await res.json();

      if (results.length === 0) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content:
              "No relevant information found in the uploaded documents. The content doesn't seem to contain data about this topic."
          }
        ]);
      } else {
        // 🔑 KEEP RESULTS STRUCTURED
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: "Here's what I found:",
            results
          }
        ]);
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "Error connecting to the server. Is it running?"
        }
      ]);
    } finally {
      setIsSearching(false);
    }
  };

  /* ------------------------------------------------------------------
   * FILE UPLOAD, RESET, GITHUB INGEST (UNCHANGED)
   * ------------------------------------------------------------------ */

  const handleFileUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    const startTime = Date.now();

    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch(`${API_URL}/upload`, {
          method: "POST",
          body: formData
        });
        
        if (!res.ok) throw new Error("Upload failed");
        
        const result = await res.json();
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log(`✅ ${file.name}: ${result.chunks} chunks in ${result.time_seconds}s`);
        
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: `✅ Uploaded "${file.name}"\n📦 ${result.chunks} chunks in ${result.time_seconds}s\n⚡ ${(result.chunks / result.time_seconds).toFixed(0)} chunks/sec`
          }
        ]);
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: `❌ Failed to upload "${file.name}": ${error.message || 'Unknown error'}`
          }
        ]);
      }
    }

    await fetchDocuments();
    setIsUploading(false);
  };

  const handleReset = async () => {
    if (!confirm("Are you sure? This will delete all documents.")) return;
    await fetch(`${API_URL}/reset`, { method: "DELETE" });
    setFiles([]);
    setMessages([
      { role: 'assistant', content: 'System reset. All documents cleared.' }
    ]);
  };

  /* ------------------------------------------------------------------
   * FORM SUBMIT — routes to ask or search based on mode
   * ------------------------------------------------------------------ */

  const handleSubmit = (e) => {
    if (mode === 'ask') {
      handleAsk(e);
    } else {
      handleSearch(e);
    }
  };

  /* ------------------------------------------------------------------
   * RENDER
   * ------------------------------------------------------------------ */

  return (
    <div className="flex h-[calc(100vh-64px)] max-w-7xl mx-auto p-4 gap-6">
      {/* SIDEBAR */}
      <aside className="w-80 bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
        {/* Upload Section */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Upload Files
          </h2>
          <label className="block w-full p-4 border-2 border-dashed border-white/20 rounded-xl hover:border-primary transition cursor-pointer text-center">
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
              accept=".txt,.md,.markdown,.html,.htm,.docx"
            />
            {isUploading ? (
              <div className="space-y-2">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <span className="text-sm">Processing...</span>
              </div>
            ) : (
              <div className="space-y-2">
                <FileText className="w-8 h-8 text-primary mx-auto" />
                <p className="text-sm text-slate-300">
                  Click to upload documents
                </p>
                <p className="text-xs text-slate-500">
                  .txt, .md, .html, .docx supported
                </p>
              </div>
            )}
          </label>
        </div>

        {/* Documents List */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Documents</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {files.length === 0 ? (
              <p className="text-sm text-slate-400">No documents uploaded</p>
            ) : (
              files.map((file, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white/5 rounded-lg flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-sm truncate">{file}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ingest Status */}
        {ingestStatus.is_ingesting && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <p className="text-sm text-yellow-300 mb-2">
              Ingesting: {ingestStatus.progress}/{ingestStatus.total}
            </p>
            <p className="text-xs text-slate-300">{ingestStatus.message}</p>
          </div>
        )}

        {ingestStatus.error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{ingestStatus.error}</p>
          </div>
        )}

        {/* GitHub Ingestion */}
        <div>
          <button
            onClick={() => setShowGithubForm(!showGithubForm)}
            className="w-full flex items-center justify-center gap-2 p-3 bg-secondary/20 hover:bg-secondary/30 rounded-xl transition"
          >
            <Github className="w-5 h-5" />
            <span>Ingest from GitHub</span>
          </button>

          <AnimatePresence>
            {showGithubForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-3"
              >
                <input
                  type="text"
                  placeholder="GitHub URL"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  placeholder="Subpath (optional)"
                  value={githubSubpath}
                  onChange={(e) => setGithubSubpath(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
                />
                <button
                  onClick={async () => {
                    if (!githubUrl) return;
                    try {
                      const res = await fetch(`${API_URL}/ingest/github`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          repo_url: githubUrl,
                          subpath: githubSubpath || null
                        })
                      });
                      if (res.ok) {
                        setShowGithubForm(false);
                        setGithubUrl('');
                        setGithubSubpath('');
                      } else {
                        alert("Failed to start GitHub ingestion");
                      }
                    } catch (error) {
                      alert("Error: " + error.message);
                    }
                  }}
                  className="w-full bg-primary hover:bg-primary/80 text-white py-2 rounded-lg text-sm transition"
                >
                  Start Ingestion
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reset Button */}
        <button
          onClick={handleReset}
          className="w-full flex items-center justify-center gap-2 p-3 bg-red-500/20 hover:bg-red-500/30 rounded-xl transition text-red-300"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset All</span>
        </button>
      </aside>

      {/* MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
              )}

              <div
                className={`p-4 rounded-2xl max-w-[80%] ${
                  msg.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-white/10 text-slate-200'
                }`}
              >
                {/* NORMAL TEXT — render as Markdown for assistant messages */}
                {msg.content && msg.role === 'assistant' && !msg.results && (
                  <div className="prose prose-invert prose-sm max-w-none leading-relaxed">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                    {msg.isStreaming && (
                      <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5 align-text-bottom" />
                    )}
                  </div>
                )}

                {/* USER TEXT */}
                {msg.content && msg.role === 'user' && (
                  <p className="leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                )}

                {/* SEARCH RESULTS WITH VIEW SOURCE LINKS */}
                {msg.results &&
                  msg.results.map((r, i) => {
                    return (
                      <div
                        key={i}
                        className="mt-4 p-3 rounded-xl bg-black/30 border border-white/10"
                      >
                        <p className="text-sm mb-2 leading-relaxed">
                          {r.content}
                        </p>
                        <div className="flex justify-between items-center text-xs text-slate-400">
                          <div className="flex items-center gap-3">
                            <span>Score: {r.score.toFixed(2)}</span>
                            {r.source?.filename && (
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                {r.source.filename}
                              </span>
                            )}
                          </div>
                          {r.source?.source_file && (
                            <a
                              href={`${API_URL}/document/view?id=${r.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-primary hover:underline"
                            >
                              View source
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-secondary" />
                </div>
              )}
            </motion.div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* INPUT + MODE TOGGLE */}
        <div className="border-t border-white/10">
          {/* Mode Toggle */}
          <div className="flex items-center gap-2 px-4 pt-3">
            <button
              onClick={() => setMode('ask')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mode === 'ask'
                  ? 'bg-primary text-white shadow-sm shadow-primary/30'
                  : 'bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Ask AI
            </button>
            <button
              onClick={() => setMode('search')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mode === 'search'
                  ? 'bg-primary text-white shadow-sm shadow-primary/30'
                  : 'bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              Search
            </button>
            <span className="text-xs text-slate-500 ml-2">
              {mode === 'ask' ? 'AI will answer using your documents' : 'Raw semantic search results'}
            </span>
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="p-4 flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === 'ask' ? "Ask anything about your documents..." : "Search your documents..."}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="bg-primary text-white px-4 rounded-xl disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
