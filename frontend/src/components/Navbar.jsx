import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Github, ArrowRight } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-dark/80 backdrop-blur-xl"
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center group-hover:bg-accent/20 transition-all duration-300">
            <Zap className="w-4 h-4 text-accent" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">
            Doc<span className="text-accent">Seek</span>
          </span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-6">
          <a
            href="https://github.com/K1NGS1LVER/docSeek---Modular-RAG-system-"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/40 hover:text-white/80 transition-colors duration-200"
          >
            <Github className="w-5 h-5" />
          </a>

          {isDashboard ? (
            <Link
              to="/"
              className="text-sm text-white/50 hover:text-white transition-colors duration-200"
            >
              Home
            </Link>
          ) : (
            <Link to="/dashboard">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-5 py-2 bg-accent text-black font-semibold text-sm rounded-lg hover:bg-accent/90 transition-colors duration-200"
              >
                Launch App
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
