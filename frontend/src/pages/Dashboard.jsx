import { useState, useRef, useEffect } from 'react';
import { Send, FileText, Upload, Trash2, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello! Upload a document to get started. I can help you find specific information within your files.' }
    ]);
    const [input, setInput] = useState('');
    const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'files'
    const chatEndRef = useRef(null);

    const [mockFiles, setMockFiles] = useState([
        { name: 'architecture_v2.pdf', size: '2.4 MB', status: 'indexed' },
        { name: 'q1_financials.xlsx', size: '1.1 MB', status: 'processing' },
    ]);

    const handleDelete = (indexToDelete) => {
        setMockFiles(prev => prev.filter((_, idx) => idx !== indexToDelete));
    };

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        setMessages(prev => [...prev, { role: 'user', content: input }]);
        setInput('');

        // Mock response
        setTimeout(() => {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I'm looking into that for you. This functionality will be connected to the backend soon."
            }]);
        }, 1000);
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Mock upload logic
        files.forEach(file => {
            alert(`File "${file.name}" selected! (Upload simulation)`);
        });
    };

    return (
        <div className="flex h-[calc(100vh-64px)] max-w-7xl mx-auto p-4 gap-6">
            {/* Sidebar - File Manager (Desktop) */}
            <aside className="hidden md:flex flex-col w-80 bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="font-semibold text-slate-200 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        Documents
                    </h2>
                    <label className="p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
                        <Upload className="w-4 h-4" />
                        <input type="file" className="hidden" multiple onChange={handleFileUpload} />
                    </label>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3">
                    {mockFiles.map((file, idx) => (
                        <div key={idx} className="group p-3 rounded-xl bg-white/5 border border-transparent hover:border-white/10 transition-all">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium truncate">{file.name}</span>
                                <button
                                    onClick={() => handleDelete(idx)}
                                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-400">
                                <span>{file.size}</span>
                                <span className={`px-2 py-0.5 rounded-full ${file.status === 'indexed' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                                    {file.status}
                                </span>
                            </div>
                        </div>
                    ))}

                    <label className="block border-2 border-dashed border-white/10 rounded-xl p-6 text-center text-slate-400 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer">
                        <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Drop files here to upload</p>
                        <input type="file" className="hidden" multiple onChange={handleFileUpload} />
                    </label>
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
                                <p className="leading-relaxed">{msg.content}</p>
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

                {/* Input Area */}
                <div className="p-4 bg-dark/50 backdrop-blur-md border-t border-white/10">
                    <form onSubmit={handleSend} className="relative flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask anything about your documents..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all text-slate-200 placeholder:text-slate-500"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim()}
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
