import { useState, useRef, useEffect } from 'react';
import { Send, FileText, Upload, Trash2, Bot, User, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = "/api";

const Dashboard = () => {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello! Upload a document to get started. I can help you find specific information within your files.' }
    ]);
    const [input, setInput] = useState('');
    const [files, setFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const chatEndRef = useRef(null);

    const fetchDocuments = async () => {
        try {
            const res = await fetch(`${API_URL}/documents`);
            if (res.ok) {
                const data = await res.json();
                setFiles(data);
            }
        } catch (error) {
            console.error("Failed to fetch documents", error);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsSearching(true);

        try {
            const res = await fetch(`${API_URL}/search`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: input, k: 3 })
            });
            
            const results = await res.json();
            
            let assistantMessage;
            if (results.length === 0) {
                assistantMessage = { role: 'assistant', content: "I couldn't find any relevant information in the uploaded documents." };
            } else {
                // Simple formatting of search results
                const content = results.map((r, i) => `Result ${i+1} (Score: ${r.score.toFixed(2)}):\n"${r.content}"`).join("\n\n---\n\n");
                assistantMessage = { role: 'assistant', content: "Here is what I found:\n\n" + content };
            }
            setMessages(prev => [...prev, assistantMessage]);
            
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Error connecting to the server. Is it running?" }]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleFileUpload = async (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length === 0) return;

        setIsUploading(true);
        
        // Optimistic UI update or toast could go here
        
        for (const file of selectedFiles) {
             const formData = new FormData();
             formData.append("file", file);
             
             try {
                 const res = await fetch(`${API_URL}/upload`, {
                     method: "POST",
                     body: formData
                 });
                 if (!res.ok) throw new Error("Upload failed");
             } catch (error) {
                 console.error("Upload failed for", file.name, error);
                 alert(`Failed to upload ${file.name}. Check if the server is running.`);
                 setMessages(prev => [...prev, { role: 'assistant', content: `Failed to upload ${file.name}.` }]);
             }
        }
        
        await fetchDocuments();
        setIsUploading(false);
    };

    const handleReset = async () => {
        if(!confirm("Are you sure? This will delete all documents and index data.")) return;
        try {
            await fetch(`${API_URL}/reset`, { method: "DELETE" });
            setFiles([]);
            setMessages([{ role: 'assistant', content: 'System reset. All documents cleared.' }]);
        } catch (e) {
            alert("Failed to reset system");
        }
    }

    return (
        <div className="flex h-[calc(100vh-64px)] max-w-7xl mx-auto p-4 gap-6">
            {/* Sidebar - File Manager (Desktop) */}
            <aside className="hidden md:flex flex-col w-80 bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="font-semibold text-slate-200 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        Documents
                    </h2>
                    <label className={`p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        <Upload className="w-4 h-4" />
                        <input type="file" className="hidden" multiple onChange={handleFileUpload} disabled={isUploading} />
                    </label>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3">
                    {files.length === 0 && (
                        <div className="text-center text-slate-500 text-sm py-4">
                            No documents indexed.
                        </div>
                    )}
                    {files.map((file, idx) => (
                        <div key={idx} className="group p-3 rounded-xl bg-white/5 border border-transparent hover:border-white/10 transition-all">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium truncate" title={file.name}>{file.name}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-400">
                                <span>{file.chunks} chunks</span>
                                <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-300">
                                    {file.status}
                                </span>
                            </div>
                        </div>
                    ))}

                    <label className={`block border-2 border-dashed border-white/10 rounded-xl p-6 text-center text-slate-400 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">{isUploading ? "Uploading..." : "Drop files here to upload"}</p>
                        <input type="file" className="hidden" multiple onChange={handleFileUpload} disabled={isUploading} />
                    </label>
                </div>
                
                <div className="mt-4 pt-4 border-t border-white/10">
                    <button 
                        onClick={handleReset}
                        className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 w-full justify-center p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                        <RotateCcw className="w-3 h-3" />
                        Reset System
                    </button>
                </div>
            </aside>

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden relative">
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
                    {messages.map((msg, idx) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={idx}
                            className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-5 h-5 text-primary" />
                                </div>
                            )}

                            <div className={`p-4 rounded-2xl max-w-[80%] ${msg.role === 'user'
                                ? 'bg-primary text-white rounded-br-none'
                                : 'bg-white/10 text-slate-200 rounded-bl-none'
                                }`}>
                                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            </div>

                            {msg.role === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                                    <User className="w-5 h-5 text-secondary" />
                                </div>
                            )}
                        </motion.div>
                    ))}
                    {isSearching && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 justify-start">
                             <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-5 h-5 text-primary" />
                            </div>
                            <div className="p-4 rounded-2xl bg-white/10 text-slate-200 rounded-bl-none">
                                <p className="leading-relaxed italic text-slate-400">Searching documents...</p>
                            </div>
                        </motion.div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-dark/50 backdrop-blur-md border-t border-white/10">
                    <form onSubmit={handleSend} className="relative flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask anything about your documents..."
                            disabled={isSearching}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all text-slate-200 placeholder:text-slate-500 disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isSearching}
                            className="absolute right-2 p-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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