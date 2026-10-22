import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Database,
  Table,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Eye,
  Info,
  ShieldCheck,
  Loader2,
  Calendar,
  Layers
} from 'lucide-react';
import { datasetService } from '../services/datasetService';
import { cleanColumnLabel, formatNumber } from '../utils/formatters';

export default function DatasetExplorerPage() {
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const res = await datasetService.getDatasets();
        setDatasets(res.data || []);
        if (res.data && res.data.length > 0) {
          handleSelectDataset(res.data[0]);
        }
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Failed to load datasets');
      } finally {
        setLoading(false);
      }
    };
    fetchDatasets();
  }, []);

  const handleSelectDataset = async (dataset) => {
    setSelectedDataset(dataset);
    setPreviewLoading(true);
    try {
      const preview = await datasetService.getDatasetPreview(dataset.tableName);
      setPreviewData(preview);
    } catch (err) {
      console.error('Failed to preview dataset:', err.message);
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleQueryDataset = (dataset) => {
    navigate(`/workspace?table=${encodeURIComponent(dataset.tableName)}&datasetId=${encodeURIComponent(dataset.datasetId)}`);
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-xs">Loading Indian public datasets catalog...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-white">Dataset Explorer</h1>
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            PostgreSQL Catalogs
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Inspect relational schemas, data types, provenance metadata, and live 20-row samples.
        </p>
      </div>

      {/* Dataset Selection Tabs/Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {datasets.map((ds) => {
          const isSelected = selectedDataset?.datasetId === ds.datasetId;
          return (
            <button
              key={ds.datasetId}
              onClick={() => handleSelectDataset(ds)}
              className={`p-5 rounded-3xl border text-left transition relative overflow-hidden ${
                isSelected
                  ? 'bg-slate-900 border-blue-500/80 shadow-lg shadow-blue-500/10'
                  : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800'
              }`}
            >
              {isSelected && <div className="absolute top-0 left-0 w-full h-1 bg-blue-500" />}
              <div className="flex items-start justify-between gap-3 mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400">
                  {ds.tableName}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono">
                  {formatNumber(ds.rowCount)} rows
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white line-clamp-1">{ds.title}</h3>
              <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                {ds.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Selected Dataset Detail Inspector */}
      {selectedDataset && (
        <div className="space-y-6">
          {/* Metadata & Actions Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">{selectedDataset.title}</h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                  <span>Table: <code className="text-slate-200 font-mono">{selectedDataset.tableName}</code></span>
                  <span>•</span>
                  <span>License: <span className="text-slate-300">{selectedDataset.license}</span></span>
                  <span>•</span>
                  <span>Periods: <span className="text-blue-400 font-medium">{selectedDataset.reportingPeriods?.join(', ') || 'N/A'}</span></span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={selectedDataset.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Official Portal</span>
                </a>
                <button
                  onClick={() => handleQueryDataset(selectedDataset)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Query this Dataset</span>
                </button>
              </div>
            </div>

            {/* Schema Columns Table */}
            <div>
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                Relational Column Specifications
              </h3>
              <div className="overflow-x-auto rounded-2xl border border-slate-800/80">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-2.5">Column Name</th>
                      <th className="px-4 py-2.5">Data Type</th>
                      <th className="px-4 py-2.5">Unit</th>
                      <th className="px-4 py-2.5">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {selectedDataset.columns?.map((col) => (
                      <tr key={col.name} className="hover:bg-slate-800/30">
                        <td className="px-4 py-2.5 text-blue-300 font-semibold">{col.name}</td>
                        <td className="px-4 py-2.5 text-slate-400">{col.type}</td>
                        <td className="px-4 py-2.5 text-slate-400">{col.unit || '—'}</td>
                        <td className="px-4 py-2.5 text-slate-300 font-sans">{col.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Live 20-Row Preview Table from PostgreSQL */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Live Data Sample (First 20 Records)</h3>
              </div>
              <span className="text-xs text-slate-400">Directly fetched from PostgreSQL</span>
            </div>

            {previewLoading ? (
              <div className="h-48 flex items-center justify-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <span>Reading records from database...</span>
              </div>
            ) : previewData?.rows && previewData.rows.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-800/80 max-h-96">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider sticky top-0 border-b border-slate-800">
                    <tr>
                      {previewData.columns?.map((c) => (
                        <th key={c} className="px-3.5 py-2.5 font-semibold">
                          {cleanColumnLabel(c)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {previewData.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        {previewData.columns?.map((c) => {
                          const val = row[c];
                          const isNum = typeof val === 'number';
                          return (
                            <td key={c} className={`px-3.5 py-2 ${isNum ? 'text-blue-300' : 'text-slate-200'}`}>
                              {isNum ? formatNumber(val) : val !== null ? String(val) : '—'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-xs text-slate-400">
                No preview records available.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
