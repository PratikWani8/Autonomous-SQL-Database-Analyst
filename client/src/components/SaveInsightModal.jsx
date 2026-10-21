import React, { useState } from 'react';
import { X, BookmarkPlus, Loader2 } from 'lucide-react';
import { savedInsightService } from '../services/savedInsightService';

export default function SaveInsightModal({ isOpen, onClose, analysisData, onSaved }) {
  const [title, setTitle] = useState(analysisData?.interpreted_question || '');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide an insight title');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await savedInsightService.createSavedInsight({
        datasetId: analysisData.dataset_id,
        tableName: analysisData.table_name,
        title: title.trim(),
        question: analysisData.interpreted_question || 'Analytical Query',
        generatedSql: analysisData.generated_sql,
        chartPreferences: analysisData.chart_spec || {},
        notes: notes.trim(),
        keyFinding: analysisData.explanation?.direct_answer || ''
      });

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to save insight');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <BookmarkPlus className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Save Insight</h3>
            <p className="text-xs text-slate-400">Store this chart & finding in your saved gallery</p>
          </div>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 mb-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Insight Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              placeholder="e.g. Top 5 Districts by Unemployment Rise"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Notes / Context (Optional)</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              placeholder="Add key takeaways, policy notes, or meeting takeaways..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Insight</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
