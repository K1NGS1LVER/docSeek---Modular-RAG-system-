import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, ArrowRight } from 'lucide-react';

export default function FrontPage() {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen bg-carbon flex items-center justify-center relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 telemetry-grid opacity-40" />

      {/* Radial glow */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-[0.07]"
        style={{
          background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)',
        }}
      />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 text-center space-y-8 px-6"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mx-auto w-16 h-16 bg-accent/10 border border-accent/20 flex items-center justify-center"
        >
          <Zap className="w-8 h-8 text-accent" />
        </motion.div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="font-display font-bold text-5xl md:text-6xl tracking-tight text-text">
            DOC<span className="text-accent">SEEK</span>
          </h1>
          <p className="text-text-dim text-base md:text-lg font-mono max-w-md mx-auto">
            Modular Retrieval-Augmented Generation System
          </p>
        </div>

        {/* Divider line */}
        <div className="w-16 h-px bg-border-bright mx-auto" />

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          onClick={() => navigate('/app')}
          className="group inline-flex items-center gap-3 px-8 py-3 bg-accent text-carbon font-mono font-bold text-sm uppercase tracking-wider hover:bg-accent-dim transition-colors"
        >
          Launch System
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </motion.button>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="text-[11px] font-mono text-text-muted/50 tracking-wider uppercase"
        >
          Semantic Search &bull; FAISS Indexing &bull; Document Intelligence
        </motion.p>
      </motion.div>
    </div>
  );
}
