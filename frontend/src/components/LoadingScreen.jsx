import { motion } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';

const LoadingScreen = () => {
    return (
        <div className="fixed inset-0 bg-dark flex items-center justify-center z-[100]">
            <div className="relative flex flex-col items-center">
                {/* Pulse Effect */}
                <motion.div
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 0, 0.3],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl"
                />

                {/* Logo Container */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative flex items-center justify-center w-24 h-24 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-lg shadow-2xl mb-6"
                >
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-40"></div>
                    <div className="relative z-10 w-full h-full bg-slate-900/90 rounded-2xl flex items-center justify-center border border-white/10">
                        <Bot className="w-12 h-12 text-indigo-400" />
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="absolute -top-2 -right-2"
                        >
                            <Sparkles className="w-5 h-5 text-purple-400" />
                        </motion.div>
                    </div>
                </motion.div>

                {/* Text Logo */}
                <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="text-4xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-slate-400 font-sans"
                >
                    docSeek
                </motion.span>
            </div>
        </div>
    );
};

export default LoadingScreen;
