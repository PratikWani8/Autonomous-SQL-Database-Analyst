import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Database,
  Search,
  Sparkles,
  BookmarkCheck,
  History,
  ArrowRight,
  TrendingUp,
  Clock,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { dashboardService } from '../services/dashboardService';
import { formatDate } from '../utils/formatters';
import { StatusBadge } from '../components/StatusBadge';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await dashboardService.getDashboardSummary();
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Failed to load dashboard metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const handleQuickQuestion = (item) => {
    navigate(`/workspace?q=${encodeURIComponent(item.question)}&datasetId=${encodeURIComponent(item.datasetId || '')}&table=${encodeURIComponent(item.tableName || '')}`);
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-xs">Gathering analytics dashboard summary...</p>
      </div>
    );
  }

  const stats = data?.stats || { totalDatasets: 0, totalQueriesExecuted: 0, totalSavedInsights: 0 };
  const quickQuestions = data?.quickStartQuestions || [];
  const recentQueries = data?.recentQueries || [];
  const recentSaved = data?.recentSavedInsights || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-900/30 via-slate-900 to-slate-900/40 p-6 rounded-3xl border border-blue-500/20">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-medium mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous Analytics Workspace</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Indian Public Data Intelligence</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Query structured labour, census, and health statistics safely using natural language.
          </p>
        </div>
        <Link
          to="/workspace"
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/20 flex items-center gap-2 transition shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>New Natural Language Query</span>
        </Link>
      </div>

      {/* Real Statistics Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Available Datasets</span>
            <div className="text-3xl font-extrabold text-white mt-1">{stats.totalDatasets}</div>
            <span className="text-[11px] text-blue-400 mt-0.5 block">MoSPI, Census & NFHS-5</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Executed Inquiries</span>
            <div className="text-3xl font-extrabold text-white mt-1">{stats.totalQueriesExecuted}</div>
            <span className="text-[11px] text-emerald-400 mt-0.5 block">AST verified & executed</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Saved Insights</span>
            <div className="text-3xl font-extrabold text-white mt-1">{stats.totalSavedInsights}</div>
            <span className="text-[11px] text-purple-400 mt-0.5 block">Custom policy charts</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <BookmarkCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Quick Start Questions Section */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white">Recommended Analytical Questions</h2>
          </div>
          <span className="text-xs text-slate-400">Click any card to launch query in workspace</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {quickQuestions.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickQuestion(item)}
              className="text-left p-4 rounded-2xl bg-slate-950/80 hover:bg-slate-800/60 border border-slate-800 hover:border-blue-500/40 transition group flex items-start justify-between gap-3"
            >
              <div>
                <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider block mb-1">
                  {item.datasetTitle}
                </span>
                <p className="text-xs font-medium text-slate-200 group-hover:text-blue-300 transition">
                  "{item.question}"
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition shrink-0 mt-1" />
            </button>
          ))}
        </div>
      </div>

      {/* Lower Grid: Recent Queries & Saved Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Queries */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-bold text-white">Recent Analysis History</h3>
              </div>
              <Link to="/history" className="text-xs text-blue-400 hover:underline">
                View all
              </Link>
            </div>

            {recentQueries.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No past queries recorded. Run your first question above!
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentQueries.map((q) => (
                  <div
                    key={q._id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="truncate flex-1">
                      <p className="font-medium text-slate-200 truncate">{q.originalQuestion}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                        <span>{formatDate(q.createdAt)}</span>
                        <span>•</span>
                        <span>{q.executionDuration} ms</span>
                      </div>
                    </div>
                    <StatusBadge status={q.executionStatus} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Saved Insights */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookmarkCheck className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Saved Insights Gallery</h3>
              </div>
              <Link to="/saved" className="text-xs text-blue-400 hover:underline">
                View all
              </Link>
            </div>

            {recentSaved.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No saved insights yet. You can pin any chart from the workspace!
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentSaved.map((item) => (
                  <div
                    key={item._id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="truncate flex-1">
                      <p className="font-semibold text-slate-200 truncate">{item.title}</p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.question}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono uppercase">
                      {item.chartPreferences?.type || 'chart'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
