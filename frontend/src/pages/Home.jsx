import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bot, FileText, Database, ShieldCheck, ArrowRight, Sparkles, Cpu, Zap } from 'lucide-react';

function Home() {
  const { user } = useAuth();

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between overflow-hidden dark:bg-dark-950">
      
      {/* Background Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl -z-10 animate-pulse-subtle"></div>
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse-subtle" style={{ animationDelay: '1.5s' }}></div>

      {/* Hero Section */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-20 flex-1 flex flex-col justify-center">
        <div className="text-center space-y-8 max-w-4xl mx-auto animate-slide-up">
          
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900/40 px-3 py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400">
            <Sparkles className="h-3.5 w-3.5" />
            Empowering Companies with Context-Grounded AI Support
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-slate-900 dark:text-white leading-[1.15]">
            Instant Support Powered by{' '}
            <span className="bg-gradient-to-r from-brand-500 via-brand-600 to-indigo-500 bg-clip-text text-transparent">
              Your Company's Data
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Upload policies, documentations, or manuals. AegisAI compiles vectors and uses the Google Gemini API to answer client questions with absolute precision, zero hallucination, and clear citations.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/register'}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-500 hover:shadow-brand-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] btn-glow"
            >
              Get Started for Free
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/about"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-md px-8 py-4 text-base font-semibold text-slate-700 hover:bg-slate-50 dark:border-dark-800 dark:bg-dark-900/40 dark:text-slate-300 dark:hover:bg-dark-900 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Explore Architecture
            </Link>
          </div>
        </div>

        {/* Feature Cards Section */}
        <div className="mt-24 grid gap-8 md:grid-cols-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          
          {/* Feature 1 */}
          <div className="glass-card p-8 flex flex-col justify-between hover:border-brand-500/30 hover:shadow-md transition-all duration-300 group">
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Document Ingestion</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Drag and drop PDF, DOCX, or TXT files. The platform parses them on upload, chunks text, and converts content into multidimensional embeddings.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="glass-card p-8 flex flex-col justify-between hover:border-indigo-500/30 hover:shadow-md transition-all duration-300 group">
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                <Database className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Custom Vector Search</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Uses local in-memory cosine similarity matching over MongoDB. No paid API integrations or vector cloud accounts required for setup.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="glass-card p-8 flex flex-col justify-between hover:border-emerald-500/30 hover:shadow-md transition-all duration-300 group">
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Grounded AI Responses</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                System prompts explicitly restrict Gemini to answer *only* from the uploaded context. If it's not in the document, AegisAI declines to answer.
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200/50 bg-slate-100/50 dark:border-dark-850 dark:bg-[#08090d] py-6 transition-all duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 space-y-4 sm:space-y-0">
          <div>
            &copy; 2026 AegisAI Platform. Developed with MERN & Gemini API.
          </div>
          <div className="flex space-x-6">
            <span className="flex items-center gap-1"><Cpu className="h-3.5 w-3.5" /> High-Performance RAG</span>
            <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5" /> Gemini 1.5 Flash Enabled</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default Home;
