import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Database,
  ShieldCheck,
  BarChart3,
  Search,
  ArrowRight,
  CheckCircle,
  FileSpreadsheet,
  Lock,
  Layers
} from 'lucide-react';
import Navbar from '../components/Navbar';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-16 pb-20 max-w-6xl mx-auto text-center flex-1">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-400 mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Autonomous SQL Analytics for Indian Public Datasets</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Ask questions in natural language. Get <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-teal-300">verified SQL, real data & charts</span>.
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Bridging public policy inquiries with relational databases. Translates complex queries against MoSPI, Census of India, and NFHS-5 data into safe, AST-validated SQL executed on a read-only PostgreSQL instance.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/workspace"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition"
          >
            <span>Launch Query Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/datasets"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-sm transition"
          >
            Explore Public Datasets
          </Link>
        </div>

        {/* 9-Stage Analytical Architecture Flow */}
        <div className="mt-16 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-left shadow-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Autonomous Pipeline Workflow</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
              <span className="text-[10px] text-blue-400 font-bold block mb-1">STAGE 1 & 2</span>
              <p className="font-semibold text-slate-200">Intent & Schema</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Semantic parsing, temporal dimension & schema discovery.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
              <span className="text-[10px] text-indigo-400 font-bold block mb-1">STAGE 3 & 4</span>
              <p className="font-semibold text-slate-200">SQL & AST Safety</p>
              <p className="text-[11px] text-slate-400 mt-0.5">SQLGlot AST validation, DDL/DML rejection & row limits.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
              <span className="text-[10px] text-emerald-400 font-bold block mb-1">STAGE 5</span>
              <p className="font-semibold text-slate-200">Safe Execution</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Dedicated read-only role with statement timeouts.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
              <span className="text-[10px] text-amber-400 font-bold block mb-1">STAGE 6 & 7</span>
              <p className="font-semibold text-slate-200">Result Audit</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Pandas null audit, division-by-zero check & % differences.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
              <span className="text-[10px] text-purple-400 font-bold block mb-1">STAGE 8 & 9</span>
              <p className="font-semibold text-slate-200">Visual Insights</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Interactive Recharts & evidence-grounded findings.</p>
            </div>
          </div>
        </div>

        {/* Core Capabilities Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Genuine Indian Datasets</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Real district-level statistics from MoSPI (Periodic Labour Force Survey), Census of India (Population & Literacy), and NFHS-5 (Health Indicators). No fabricated fixtures.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Database-Level Enforcement</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Two layers of security: SQLGlot AST allowlisting blocks mutations before execution, and PostgreSQL role <code className="text-emerald-400">analyst_readonly</code> independently enforces read-only access.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Zero Hallucinations</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Explanations strictly cite returned PostgreSQL rows and deterministic calculations (absolute differences and relative percentages). Formula-safe CSV export included.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 px-4 text-center text-xs text-slate-500">
        <p>Autonomous SQL Database Analyst — Built for Indian Public Policy Intelligence. Licensed under OGDL-India.</p>
      </footer>
    </div>
  );
}
