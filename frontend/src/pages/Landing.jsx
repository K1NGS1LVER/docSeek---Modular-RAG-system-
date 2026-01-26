import { ArrowRight, Zap, Shield, Database } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Landing = () => {
    return (
        <div className="relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/20 rounded-full blur-[120px] -z-10" />
            <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-secondary/10 rounded-full blur-[100px] -z-10" />

            {/* Hero Section */}
            <main className="max-w-7xl mx-auto px-6 py-24 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="inline-flex items-center px-4 py-2 border border-white/10 rounded-full bg-white/5 backdrop-blur-sm mb-8">
                        <span className="flex h-2 w-2 rounded-full bg-green-400 mr-2"></span>
                        <span className="text-sm text-slate-300">RAG System v1.0 Online</span>
                    </div>

                    <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-8">
                        Chat with your <span className="text-primary">Documents</span>
                    </h1>

                    <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
                        Experience the power of modular RAG. Upload documents, ask complex questions,
                        and get instant, accurate citations from your proprietary data.
                    </p>

                    <div className="flex items-center justify-center gap-4">
                        <Link
                            to="/dashboard"
                            className="px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-full font-semibold transition-all duration-200 flex items-center group"
                        >
                            Get Started
                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </motion.div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-8 mt-32">
                    {[
                        {
                            icon: <Zap className="w-8 h-8 text-yellow-400" />,
                            title: "Lightning Fast",
                            desc: "Optimized vector retrieval ensures your queries are answered in milliseconds."
                        },
                        {
                            icon: <Shield className="w-8 h-8 text-green-400" />,
                            title: "Secure by Design",
                            desc: "Your documents are processed locally or in secure silos. Your data never leaves your control."
                        },
                        {
                            icon: <Database className="w-8 h-8 text-blue-400" />,
                            title: "Modular Backends",
                            desc: "Switch between different LLMs and vector stores with ease. Built for flexibility."
                        }
                    ].map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.2 }}
                            className="p-8 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                        >
                            <div className="mb-6 p-4 bg-white/5 rounded-xl inline-block">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                            <p className="text-slate-400 leading-relaxed">
                                {feature.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default Landing;
