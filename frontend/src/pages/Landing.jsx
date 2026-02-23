import { ArrowRight, Zap, Search, Database, FileText, GitBranch, Cpu } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useRef } from 'react';

/* ------------------------------------------------------------------ */
/*  Animated grid background                                          */
/* ------------------------------------------------------------------ */
const GridBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Grid lines */}
    <div className="absolute inset-0 grid-bg opacity-40" />
    {/* Radial glow */}
    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-accent/5 rounded-full blur-[150px]" />
    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent/3 rounded-full blur-[120px]" />
    {/* Scan line */}
    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
  </div>
);

/* ------------------------------------------------------------------ */
/*  Stat counter pill                                                 */
/* ------------------------------------------------------------------ */
const StatPill = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <span className="font-display text-3xl md:text-4xl font-bold text-white">{value}</span>
    <span className="text-xs uppercase tracking-[0.2em] text-white/30 mt-1">{label}</span>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Feature card                                                      */
/* ------------------------------------------------------------------ */
const FeatureCard = ({ icon, title, desc, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.6, delay: index * 0.12 }}
    whileHover={{ y: -4 }}
    className="group relative p-8 rounded-2xl bg-dark-50/50 border border-white/5 hover:border-accent/20 transition-all duration-500"
  >
    {/* Hover glow */}
    <div className="absolute inset-0 rounded-2xl bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative z-10">
      <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors duration-300">
        {icon}
      </div>
      <h3 className="font-display text-xl font-semibold mb-3 text-white">{title}</h3>
      <p className="text-white/40 leading-relaxed text-sm">{desc}</p>
    </div>
  </motion.div>
);

/* ------------------------------------------------------------------ */
/*  How it works step                                                 */
/* ------------------------------------------------------------------ */
const Step = ({ number, title, desc, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -30 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay: index * 0.15 }}
    className="flex gap-6 items-start"
  >
    <div className="flex-shrink-0 w-12 h-12 rounded-full border border-accent/30 bg-accent/5 flex items-center justify-center">
      <span className="font-display font-bold text-accent text-lg">{number}</span>
    </div>
    <div>
      <h4 className="font-display font-semibold text-lg text-white mb-1">{title}</h4>
      <p className="text-white/35 text-sm leading-relaxed">{desc}</p>
    </div>
  </motion.div>
);

/* ================================================================== */
/*  LANDING PAGE                                                      */
/* ================================================================== */
const Landing = () => {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);

  const features = [
    {
      icon: <Zap className="w-5 h-5 text-accent" />,
      title: 'Sub-Second Retrieval',
      desc: 'FAISS vector indexing with cosine similarity delivers answers in milliseconds, not minutes.',
    },
    {
      icon: <Search className="w-5 h-5 text-accent" />,
      title: 'Semantic Search',
      desc: 'Powered by all-MiniLM sentence transformers. Understands context, not just keywords.',
    },
    {
      icon: <Database className="w-5 h-5 text-accent" />,
      title: 'Modular Architecture',
      desc: 'Swap embedding models, vector stores, or LLMs. Every component is independently configurable.',
    },
    {
      icon: <FileText className="w-5 h-5 text-accent" />,
      title: 'Multi-Format Ingest',
      desc: 'Upload .txt, .md, .html, .docx — or clone entire GitHub repos. All processed and indexed automatically.',
    },
    {
      icon: <GitBranch className="w-5 h-5 text-accent" />,
      title: 'GitHub Integration',
      desc: 'Point at any repository. DocSeek clones, parses, chunks, and indexes the entire codebase.',
    },
    {
      icon: <Cpu className="w-5 h-5 text-accent" />,
      title: 'Local & Private',
      desc: 'Everything runs on your machine. No data leaves your network. Full control, zero compromise.',
    },
  ];

  return (
    <div className="noise-bg">
      <GridBackground />

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-16">
        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 max-w-5xl mx-auto px-6 text-center"
        >
          {/* Status badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/20 bg-accent/5 mb-10"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent/60"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            <span className="text-xs font-medium tracking-wider uppercase text-accent/80">
              RAG Engine Online
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7 }}
            className="font-display text-6xl sm:text-7xl md:text-8xl font-bold tracking-tight leading-[0.9] mb-8"
          >
            <span className="text-white">Search.</span>
            <br />
            <span className="text-white">Understand.</span>
            <br />
            <span className="text-glow text-accent">Extract.</span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="text-lg md:text-xl text-white/35 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            A modular RAG system that turns your documents into an
            instantly searchable knowledge base. Upload, embed, retrieve — in seconds.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/dashboard">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="group flex items-center gap-3 px-8 py-4 bg-accent text-black font-bold text-sm rounded-xl hover:shadow-lg hover:shadow-accent/20 transition-all duration-300"
              >
                Launch DocSeek
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </motion.button>
            </Link>
            <a
              href="https://github.com/K1NGS1LVER/docSeek---Modular-RAG-system-"
              target="_blank"
              rel="noopener noreferrer"
            >
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-3 px-8 py-4 border border-white/10 text-white/60 hover:text-white hover:border-white/20 font-medium text-sm rounded-xl transition-all duration-300"
              >
                View on GitHub
              </motion.button>
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex items-center justify-center gap-12 md:gap-20 mt-20 pt-10 border-t border-white/5"
          >
            <StatPill value="768" label="Embedding Dim" />
            <div className="w-px h-10 bg-white/10" />
            <StatPill value="<50ms" label="Query Speed" />
            <div className="w-px h-10 bg-white/10" />
            <StatPill value="100%" label="Local" />
          </motion.div>
        </motion.div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-dark to-transparent" />
      </section>

      {/* ── FEATURES ── */}
      <section className="relative py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-xs uppercase tracking-[0.3em] text-accent/60 font-medium">Capabilities</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold mt-4 text-white">
              Built for Speed & Precision
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <FeatureCard key={i} index={i} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="relative py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-xs uppercase tracking-[0.3em] text-accent/60 font-medium">Pipeline</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold mt-4 text-white">
              How It Works
            </h2>
          </motion.div>

          <div className="space-y-10">
            <Step index={0} number="01" title="Upload Documents" desc="Drop your .txt, .md, .html, or .docx files — or paste a GitHub repo URL. Files are parsed and cleaned automatically." />
            <Step index={1} number="02" title="Chunk & Embed" desc="Text is split into optimized chunks (300 chars, 50 overlap) and transformed into 768-dimensional vectors using sentence transformers." />
            <Step index={2} number="03" title="Index in FAISS" desc="Vectors are stored in a FAISS IndexIDMap with inner-product similarity for blazing-fast nearest-neighbor retrieval." />
            <Step index={3} number="04" title="Search & Retrieve" desc="Ask natural language questions. DocSeek finds the most semantically similar chunks and returns them with source citations and confidence scores." />
          </div>
        </div>
      </section>

      {/* ── CTA FOOTER ── */}
      <section className="relative py-32 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-4xl md:text-6xl font-bold text-white mb-6">
              Ready to <span className="text-accent">Extract</span>?
            </h2>
            <p className="text-white/30 mb-10 text-lg">
              Your documents are waiting. Start searching in seconds.
            </p>
            <Link to="/dashboard">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="group inline-flex items-center gap-3 px-10 py-5 bg-accent text-black font-bold rounded-xl text-lg hover:shadow-xl hover:shadow-accent/20 transition-all duration-300"
              >
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer bar */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-white/20">
          <span className="font-display">DocSeek</span>
          <span>Modular RAG System</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
