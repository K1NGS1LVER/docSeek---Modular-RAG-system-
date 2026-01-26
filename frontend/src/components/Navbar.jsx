import { Link } from 'react-router-dom';
import { Sparkles, Github } from 'lucide-react';

const Navbar = () => {
    return (
        <nav className="sticky top-0 z-50 backdrop-blur-lg border-b border-white/10 bg-dark/50">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center space-x-2 group">
                    <div className="p-2 bg-gradient-to-tr from-primary to-secondary rounded-lg group-hover:scale-105 transition-transform duration-300">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                        docSeek
                    </span>
                </Link>

                <div className="flex items-center space-x-6">
                    <a
                        href="https://github.com/K1NGS1LVER/docSeek---Modular-RAG-system-"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:text-primary transition-colors duration-200"
                    >
                        <Github className="w-6 h-6" />
                    </a>
                    <Link
                        to="/dashboard"
                        className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-full shadow-lg hover:shadow-primary/25 transition-all duration-200"
                    >
                        Launch App
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
