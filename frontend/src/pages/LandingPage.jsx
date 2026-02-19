import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const TERMINAL_LINES = [
    { delay: 800, text: '$ curl -X POST http://localhost:8000/search \\', type: 'cmd' },
    { delay: 1100, text: '       -d \'{"query": "dependency injection", "k": 3}\'', type: 'cmd' },
    { delay: 1700, text: '', type: 'gap' },
    { delay: 2000, text: '[0.94]  "FastAPI uses Depends() for dependency injection..."', type: 'result-high' },
    { delay: 2500, text: '[0.91]  "Declare shared logic once, inject anywhere..."', type: 'result-mid' },
    { delay: 3000, text: '[0.87]  "Dependencies can be cached per request scope."', type: 'result-low' },
]

const STACK_ITEMS = ['FastAPI', 'FAISS', 'Sentence Transformers', 'SQLite', 'mpnet-base-v2', 'Python 3.11']

const STEPS = [
    {
        num: '01',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
        ),
        title: 'Ingest Documents',
        body: 'Feed text via the API or CLI tool. Content is chunked by paragraph and stored in SQLite with its vector embedding.',
        mono: 'POST /ingest  ·  { text, metadata? }',
    },
    {
        num: '02',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
        ),
        title: 'FAISS Indexes Vectors',
        body: 'Each chunk is embedded into a 768-dimensional vector using all-mpnet-base-v2. FAISS builds an inner-product index for cosine similarity.',
        mono: 'dim: 768  ·  IndexFlatIP  ·  cosine sim',
    },
    {
        num: '03',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
        ),
        title: 'Query in Plain Language',
        body: 'Type any question. Your query is embedded and compared against all vectors. Top-k most similar chunks are returned with cosine scores.',
        mono: 'POST /search  ·  returns ranked results',
    },
]

// Architecture pipeline nodes
const PIPELINE = [
    { label: 'Document', sub: 'raw text' },
    { label: 'Chunker', sub: 'paragraphs' },
    { label: 'Embedder', sub: 'mpnet-v2' },
    { label: 'FAISS', sub: '768-dim index' },
]
const PIPELINE_QUERY = [
    { label: 'Query', sub: 'plain text' },
    { label: 'Embedder', sub: 'mpnet-v2' },
    { label: 'Similarity', sub: 'cosine score' },
    { label: 'Top-K', sub: 'ranked results' },
]

export default function LandingPage({ theme, setTheme }) {
    const navigate = useNavigate()
    const [termLines, setTermLines] = useState([])
    const [pipelineStep, setPipelineStep] = useState(0)
    const revealRefs = useRef([])

    // Terminal animation
    useEffect(() => {
        TERMINAL_LINES.forEach((line) => {
            setTimeout(() => {
                setTermLines(prev => [...prev, line])
            }, line.delay)
        })
    }, [])

    // Pipeline loop animation
    useEffect(() => {
        const interval = setInterval(() => {
            setPipelineStep(s => (s + 1) % 4)
        }, 700)
        return () => clearInterval(interval)
    }, [])

    // Scroll reveal
    useEffect(() => {
        const obs = new IntersectionObserver(
            entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
        )
        revealRefs.current.forEach(el => el && obs.observe(el))
        return () => obs.disconnect()
    }, [])

    const addReveal = (i) => (el) => { revealRefs.current[i] = el }

    return (
        <div style={{ minHeight: '100vh' }}>
            <div className="landing-bloom" />

            {/* NAV */}
            <nav className="navbar anim-nav">
                <div className="nav-logo">
                    <div className="nav-logo-icon">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <rect x="1.5" y="1.5" width="13" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.4" />
                            <line x1="4" y1="5.5" x2="12" y2="5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                            <line x1="4" y1="8" x2="10" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                            <line x1="4" y1="10.5" x2="8" y2="10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                        </svg>
                    </div>
                    <span className="nav-wordmark">doc<span>Seek</span></span>
                </div>
                <div className="nav-right">
                    <a href="https://github.com/K1NGS1LVER/docSeek---Modular-RAG-system-" target="_blank" rel="noreferrer">
                        <button className="btn-icon" title="GitHub">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                            </svg>
                        </button>
                    </a>
                    <button className="btn-icon" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} title="Toggle theme">
                        {theme === 'dark' ? (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                            </svg>
                        ) : (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                            </svg>
                        )}
                    </button>
                    <button className="btn btn-primary btn-lg" onClick={() => navigate('/app')}>
                        Open App
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                </div>
            </nav>

            {/* HERO */}
            <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 80px', textAlign: 'center' }}>
                <div className="anim-1">
                    <span className="eyebrow">Semantic Document Retrieval</span>
                </div>

                <h1 className="anim-2" style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(52px, 8vw, 96px)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.02em', marginTop: 28, marginBottom: 24, maxWidth: 800 }}>
                    Find exactly what<br />
                    lives in your <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>documents.</em>
                </h1>

                <p className="anim-3" style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.75, maxWidth: 460, marginBottom: 40 }}>
                    Upload text, ask in plain language.<br />
                    FAISS retrieves the most semantically relevant chunks — with scores.
                </p>

                <div className="anim-4" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button className="btn btn-primary btn-lg" onClick={() => navigate('/app')}>
                        Open App
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    <span style={{ color: 'var(--text-3)', fontSize: 13 }}>·</span>
                    <a href="https://github.com/K1NGS1LVER/docSeek---Modular-RAG-system-" target="_blank" rel="noreferrer">
                        <button className="btn btn-ghost btn-lg">
                            View on GitHub
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 3h10v10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                        </button>
                    </a>
                </div>

                {/* Terminal */}
                <div className="anim-5" style={{ width: '100%', maxWidth: 640, marginTop: 64 }}>
                    <div style={{ background: '#0d0d0c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', textAlign: 'left', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
                        {/* titlebar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: '#111110' }}>
                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57', display: 'block' }} />
                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e', display: 'block' }} />
                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840', display: 'block' }} />
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 8 }}>docseek — bash</span>
                        </div>
                        {/* body */}
                        <div style={{ padding: '20px 22px', minHeight: 160, fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.8 }}>
                            {termLines.map((line, i) => (
                                <div key={i} style={{ color: line.type === 'cmd' ? 'rgba(255,255,255,0.7)' : line.type === 'result-high' ? '#d97706' : line.type === 'result-mid' ? '#a07030' : line.type === 'result-low' ? '#705830' : 'transparent', marginBottom: line.type === 'gap' ? 4 : 0 }}>
                                    {line.text || '\u00A0'}
                                </div>
                            ))}
                            {termLines.length < TERMINAL_LINES.length && (
                                <span style={{ display: 'inline-block', width: 8, height: 14, background: 'rgba(255,255,255,0.5)', animation: 'statusPulse 1s ease infinite', verticalAlign: 'text-bottom' }} />
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* TECH STRIP */}
            <div ref={addReveal(0)} className="reveal section-divider" />
            <div ref={addReveal(1)} className="reveal" style={{ padding: '28px 24px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '6px 16px' }}>
                    {STACK_ITEMS.map((item, i) => (
                        <span key={item}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{item}</span>
                            {i < STACK_ITEMS.length - 1 && <span style={{ marginLeft: 16, color: 'var(--text-3)', fontSize: 11 }}>·</span>}
                        </span>
                    ))}
                </div>
            </div>

            {/* HOW IT WORKS */}
            <section style={{ maxWidth: 1100, margin: '0 auto', padding: '100px 32px' }}>
                <div ref={addReveal(2)} className="reveal" style={{ marginBottom: 56 }}>
                    <div className="eyebrow" style={{ marginBottom: 16 }}>Process</div>
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 14 }}>
                        Three steps. No magic.
                    </h2>
                    <p style={{ fontSize: 14, color: 'var(--text-2)', maxWidth: 400, lineHeight: 1.7 }}>
                        Just embeddings, vector similarity search, and ranked results.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
                    {STEPS.map((step, i) => (
                        <div ref={addReveal(3 + i)} className={`reveal reveal-delay-${i}`} key={step.num}
                            style={{ background: 'var(--surface)', padding: '36px 32px', position: 'relative', transition: 'background var(--transition)', cursor: 'default' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
                        >
                            {/* ghost number */}
                            <div style={{ position: 'absolute', top: 12, right: 20, fontFamily: 'var(--font-mono)', fontSize: 72, fontWeight: 500, color: 'var(--border)', lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>{step.num}</div>

                            <div style={{ width: 42, height: 42, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', marginBottom: 18, transition: 'all var(--transition)' }}>
                                {step.icon}
                            </div>
                            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', letterSpacing: '0.08em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                                {step.num}
                                <span style={{ flex: 1, height: 1, background: 'var(--border)', display: 'inline-block' }} />
                            </div>
                            <h3 style={{ fontSize: 15, fontWeight: 500, letterSpacing: '-0.01em', marginBottom: 10, color: 'var(--text-1)' }}>{step.title}</h3>
                            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 18 }}>{step.body}</p>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.05em', padding: '6px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>{step.mono}</div>
                        </div>
                    ))}
                </div>
            </section>

            <div className="section-divider" />

            {/* ARCHITECTURE */}
            <section ref={addReveal(6)} className="reveal" style={{ maxWidth: 1100, margin: '0 auto', padding: '100px 32px' }}>
                <div style={{ marginBottom: 56 }}>
                    <div className="eyebrow" style={{ marginBottom: 16 }}>Architecture</div>
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 14 }}>
                        The retrieval pipeline
                    </h2>
                    <p style={{ fontSize: 14, color: 'var(--text-2)', maxWidth: 420, lineHeight: 1.7 }}>
                        How data flows from raw text into a ranked list of semantically matched results.
                    </p>
                </div>

                {/* Ingest pipeline */}
                <div style={{ marginBottom: 20 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Ingest path</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
                        {PIPELINE.map((node, i) => (
                            <div key={node.label} style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{ padding: '10px 18px', border: `1px solid ${pipelineStep === i ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--radius)', background: pipelineStep === i ? 'var(--accent-soft)' : 'var(--surface)', transition: 'all 0.4s ease', textAlign: 'center', minWidth: 110 }}>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500, color: pipelineStep === i ? 'var(--accent)' : 'var(--text-1)', transition: 'color 0.4s ease' }}>{node.label}</div>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{node.sub}</div>
                                </div>
                                {i < PIPELINE.length - 1 && (
                                    <div style={{ padding: '0 8px', color: 'var(--text-3)', fontSize: 16, fontFamily: 'var(--font-mono)' }}>→</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Query pipeline */}
                <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Query path</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
                        {PIPELINE_QUERY.map((node, i) => (
                            <div key={node.label} style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{ padding: '10px 18px', border: `1px solid ${pipelineStep === i ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--radius)', background: pipelineStep === i ? 'var(--accent-soft)' : 'var(--surface)', transition: 'all 0.4s ease', textAlign: 'center', minWidth: 110 }}>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500, color: pipelineStep === i ? 'var(--accent)' : 'var(--text-1)', transition: 'color 0.4s ease' }}>{node.label}</div>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{node.sub}</div>
                                </div>
                                {i < PIPELINE_QUERY.length - 1 && (
                                    <div style={{ padding: '0 8px', color: 'var(--text-3)', fontSize: 16, fontFamily: 'var(--font-mono)' }}>→</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <div className="section-divider" />

            {/* FOOTER */}
            <footer style={{ padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="nav-wordmark" style={{ fontSize: 13 }}>doc<span style={{ color: 'var(--accent)' }}>Seek</span></span>
                    <span style={{ color: 'var(--text-3)', fontSize: 12 }}>·</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>Modular RAG System</span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>
                    FastAPI · FAISS · Sentence Transformers
                </div>
                <a href="https://github.com/K1NGS1LVER/docSeek---Modular-RAG-system-" target="_blank" rel="noreferrer" style={{ color: 'var(--text-3)', transition: 'color var(--transition)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text-2)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                </a>
            </footer>
        </div>
    )
}
