import React from 'react';
import { Bot, Cpu, Database, FileText, Globe, Key, HelpCircle, GitMerge } from 'lucide-react';

function About() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-dark-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-900 dark:text-white">
            System Architecture & Tech Stack
          </h1>
          <p className="text-md text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            AegisAI utilizes Retrieval-Augmented Generation (RAG) to build a robust context-injected AI customer service agent.
          </p>
        </div>

        {/* Visual Flowchart (HTML/CSS) */}
        <div className="glass-card p-6 md:p-8 space-y-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <GitMerge className="h-5 w-5 text-brand-600" />
            Information Flow Diagram
          </h3>
          
          <div className="flex flex-col space-y-6 md:space-y-0 md:flex-row md:items-center md:justify-between py-6">
            
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center p-3 rounded-xl border border-slate-200/50 bg-white/40 dark:border-dark-850 dark:bg-dark-900/30 flex-1 mx-2">
              <FileText className="h-8 w-8 text-brand-500 mb-2" />
              <div className="text-xs font-bold text-slate-700 dark:text-slate-350">1. Upload Files</div>
              <div className="text-[10px] text-slate-400 mt-1">PDF / DOCX / TXT parsed on disk</div>
            </div>

            <div className="hidden md:block text-slate-300 dark:text-dark-750 font-bold text-lg">➔</div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center p-3 rounded-xl border border-slate-200/50 bg-white/40 dark:border-dark-850 dark:bg-dark-900/30 flex-1 mx-2">
              <Cpu className="h-8 w-8 text-violet-500 mb-2" />
              <div className="text-xs font-bold text-slate-700 dark:text-slate-350">2. Vectorize</div>
              <div className="text-[10px] text-slate-400 mt-1">Chunk & Embed text with Gemini API</div>
            </div>

            <div className="hidden md:block text-slate-300 dark:text-dark-750 font-bold text-lg">➔</div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center p-3 rounded-xl border border-slate-200/50 bg-white/40 dark:border-dark-850 dark:bg-dark-900/30 flex-1 mx-2">
              <Database className="h-8 w-8 text-indigo-500 mb-2" />
              <div className="text-xs font-bold text-slate-700 dark:text-slate-350">3. Vector Store</div>
              <div className="text-[10px] text-slate-400 mt-1">Save vectors & text in MongoDB chunks</div>
            </div>

            <div className="hidden md:block text-slate-300 dark:text-dark-750 font-bold text-lg">➔</div>

            {/* Step 4 */}
            <div className="flex flex-col items-center text-center p-3 rounded-xl border border-slate-200/50 bg-white/40 dark:border-dark-850 dark:bg-dark-900/30 flex-1 mx-2">
              <Bot className="h-8 w-8 text-emerald-500 mb-2" />
              <div className="text-xs font-bold text-slate-700 dark:text-slate-350">4. Grounded Response</div>
              <div className="text-[10px] text-slate-400 mt-1">Retrieve similarity context & generate via LLM</div>
            </div>

          </div>
        </div>

        {/* Technical Explanations */}
        <div className="grid gap-6 md:grid-cols-2">
          
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <HelpCircle className="h-4.5 w-4.5 text-brand-600" />
              How does RAG work?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Standard Large Language Models (LLMs) are frozen in time and have no access to private company handbooks or documents. 
              <strong> Retrieval-Augmented Generation (RAG)</strong> solves this:
            </p>
            <ol className="text-xs text-slate-500 dark:text-slate-400 list-decimal pl-4 space-y-1.5 leading-relaxed">
              <li>When you ask a question, we first generate its embedding vector.</li>
              <li>We search the database for text chunks whose vectors are mathematically closest (Cosine Similarity) to your question.</li>
              <li>We insert those matching chunks directly into the prompt as the <em>grounding context</em>.</li>
              <li>Gemini reads the context and answers the question utilizing only those facts.</li>
            </ol>
          </div>

          <div className="glass-card p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Key className="h-4.5 w-4.5 text-indigo-600" />
              Security & JWT Controls
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              The platform utilizes standard JSON Web Token (JWT) verification:
            </p>
            <ul className="text-xs text-slate-500 dark:text-slate-400 list-disc pl-4 space-y-1.5 leading-relaxed">
              <li><strong>Access Token:</strong> Expiring JWT (15 min) checked on every request, verifying the user's ID and role.</li>
              <li><strong>Refresh Token:</strong> Long-lived token (7 days) saved by the client, used to automatically request a new access token behind-the-scenes on expiration.</li>
              <li><strong>RBAC:</strong> Endpoints are secured. Only admins can query analytics, view all files, or suspend/delete users.</li>
              <li><strong>Account Suspension:</strong> Suspended users are immediately denied access on authorization verification.</li>
            </ul>
          </div>

        </div>

        {/* Stack Details */}
        <div className="glass-card p-6 md:p-8 space-y-6">
          <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Globe className="h-4.5 w-4.5 text-brand-600" />
            Core Stack Details
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-100/50 dark:bg-dark-900/30">
              <span className="font-bold text-slate-700 dark:text-slate-300">Frontend:</span> React.js, Vite, Tailwind CSS, React Router, TanStack Query, Lucide Icons, Chart.js.
            </div>
            <div className="p-3.5 rounded-xl bg-slate-100/50 dark:bg-dark-900/30">
              <span className="font-bold text-slate-700 dark:text-slate-300">Backend:</span> Node.js, Express.js, Mongoose ORM, Multer, pdf-parse, mammoth (DOCX parser), ws (WebSockets).
            </div>
            <div className="p-3.5 rounded-xl bg-slate-100/50 dark:bg-dark-900/30">
              <span className="font-bold text-slate-700 dark:text-slate-300">Database:</span> MongoDB local database or MongoDB Atlas Cloud.
            </div>
            <div className="p-3.5 rounded-xl bg-slate-100/50 dark:bg-dark-900/30">
              <span className="font-bold text-slate-700 dark:text-slate-300">AI / LLM API:</span> Google Gemini API free-tier (`gemini-1.5-flash` & `text-embedding-004`).
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default About;
