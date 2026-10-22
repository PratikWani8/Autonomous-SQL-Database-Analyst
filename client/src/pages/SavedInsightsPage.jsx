import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookmarkCheck,
  RotateCcw,
  Trash2,
  Sparkles,
  Loader2,
  Calendar,
  FileCode,
  Tag
} from 'lucide-react';
import { savedInsightService } from '../services/savedInsightService';
import { formatDate } from '../utils/formatters';

export default function SavedInsightsPage() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const fetchInsights = async () => {
    try {
      const res = await savedInsightService.getSavedInsights();
      setInsights(res.data || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch saved insights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const handleRerun = (insight) => {
    navigate(`/workspace?q=${encodeURIComponent(insight.question)}&table=${encodeURIComponent(insight.tableName)}&datasetId=${encodeURIComponent(insight.datasetId || '')}`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this saved insight?')) return;
    try {
      await savedInsightService.deleteSavedInsight(id);
      setInsights((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to delete insight');
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <p className="text-xs">Loading saved policy insights...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-white">Saved Insights Gallery</h1>
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Curated Findings
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Persisted analytical queries, chart preferences, and custom qualitative takeaways.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {insights.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-3">
          <BookmarkCheck className="w-12 h-12 mx-auto text-slate-600" />
          <h3 className="text-sm font-semibold text-white">No Saved Insights Yet</h3>
          <p className="text-xs max-w-sm mx-auto">
            You haven't pinned any analyses to your saved gallery. Run a query in the workspace and click "Save Insight"!
          </p>
          <button
            onClick={() => navigate('/workspace')}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition inline-flex items-center gap-1.5 mt-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open Query Workspace</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {insights.map((item) => (
            <div
              key={item._id}
              className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col justify-between hover:border-purple-500/40 transition group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono uppercase">
                    {item.chartPreferences?.type || 'chart'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {formatDate(item.createdAt)}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-400 italic">
                  "{item.question}"
                </p>

                {item.keyFinding && (
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-300 leading-relaxed">
                    <span className="font-semibold text-purple-400 block mb-0.5">Core Finding:</span>
                    {item.keyFinding}
                  </div>
                )}

                {item.notes && (
                  <div className="text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                    <span className="font-medium text-slate-300 block mb-0.5">Notes:</span>
                    {item.notes}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800/80">
                <span className="text-[10px] font-mono text-slate-500">
                  {item.tableName}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleRerun(item)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium flex items-center gap-1 transition"
                    title="Re-open analysis in workspace"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                    <span>Rerun</span>
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 transition"
                    title="Delete insight"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
