import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  RotateCcw,
  Trash2,
  ExternalLink,
  Loader2,
  Clock,
  Sparkles,
  FileCode,
  CheckCircle2
} from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import { formatDate } from '../utils/formatters';
import { StatusBadge } from '../components/StatusBadge';

export default function QueryHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rerunningId, setRerunningId] = useState(null);

  const navigate = useNavigate();

  const fetchHistory = async () => {
    try {
      const res = await analyticsService.getQueryHistory();
      setHistory(res.data || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch query history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRerun = (item) => {
    navigate(`/workspace?q=${encodeURIComponent(item.originalQuestion)}&table=${encodeURIComponent(item.tableName)}&datasetId=${encodeURIComponent(item.datasetId || '')}`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this historical record?')) return;
    try {
      await analyticsService.deleteQueryHistory(id);
      setHistory((prev) => prev.filter((h) => h._id !== id));
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to delete record');
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-xs">Loading query history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-white">Query Execution History</h1>
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Audit Trail
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Review previous analytical questions, generated SQL, execution durations, and rerun past investigations.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {history.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-3">
          <History className="w-12 h-12 mx-auto text-slate-600" />
          <h3 className="text-sm font-semibold text-white">No Previous Queries Found</h3>
          <p className="text-xs max-w-sm mx-auto">
            You haven't executed any natural-language inquiries yet. Head over to the workspace to get started!
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
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Question & Intent</th>
                  <th className="px-4 py-3 font-semibold">Table</th>
                  <th className="px-4 py-3 font-semibold">Timestamp</th>
                  <th className="px-4 py-3 font-semibold">Duration</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <StatusBadge status={item.executionStatus} />
                    </td>
                    <td className="px-4 py-3.5 max-w-md">
                      <div className="font-medium text-slate-200">{item.originalQuestion}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate font-mono">
                        {item.interpretedQuestion}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-mono text-slate-300 text-[11px]">
                      {item.tableName}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-400 text-[11px]">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-mono text-blue-300 text-[11px]">
                      {item.executionDuration} ms
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRerun(item)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium flex items-center gap-1 transition"
                          title="Rerun query in workspace"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                          <span>Rerun</span>
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 transition"
                          title="Delete from history"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
