'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Activity, RefreshCw, Shield, AlertTriangle, ChevronLeft, ChevronRight, Download } from 'lucide-react';

const ACTION_COLORS: Record<string, string> = {
  CREATE:'bg-emerald-100 text-emerald-700', READ:'bg-blue-100 text-blue-700',
  UPDATE:'bg-amber-100 text-amber-700', DELETE:'bg-red-100 text-red-700',
  EXPORT:'bg-purple-100 text-purple-700', LOGIN:'bg-slate-100 text-slate-600',
  ERASURE_REQUEST:'bg-red-200 text-red-800',
};

export default function SuperAdminAuditPage() {
  const [logs, setLogs]   = useState<any[]>([]);
  const [meta, setMeta]   = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ action: '', entity: '' });

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 50 };
      if (filters.action) params.action = filters.action;
      if (filters.entity) params.entity = filters.entity;
      const res = await api.get('/security/audit-logs', { params });
      setLogs(res.data.data ?? []);
      setMeta(res.data.meta ?? { page: 1, limit: 50, total: 0, totalPages: 1 });
    } catch { toast.error('Failed to load audit logs'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(1); }, [load]);

  const [exporting, setExporting] = useState(false);

  const exportCSV = async () => {
    setExporting(true);
    try {
      const params: any = { limit: 5000 };
      if (filters.action) params.action = filters.action;
      if (filters.entity) params.entity = filters.entity;
      const res = await api.get('/security/audit-logs', { params });
      const all: any[] = res.data.data ?? logs;
      const header = ['Timestamp', 'Tenant ID', 'User', 'Action', 'Entity', 'IP Address', 'Details'];
      const rows = all.map(l => [
        new Date(l.createdAt).toLocaleString('en-IN'),
        l.tenantId ?? '',
        l.user ? `${l.user.firstName} ${l.user.lastName || ''}` : '—',
        l.action ?? '',
        l.entity ?? '',
        l.ipAddress ?? '',
        l.details ? JSON.stringify(l.details).slice(0, 200) : '',
      ]);
      const csv  = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${all.length} audit events`);
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-slate-600" /> Platform Audit Log
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{meta.total.toLocaleString('en-IN')} total events logged</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            disabled={exporting}
            className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
            <Download className="w-4 h-4" /> {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
          <button onClick={() => load(meta.page)} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
        <select value={filters.entity} onChange={e => setFilters(f => ({ ...f, entity: e.target.value }))}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none cursor-pointer">
          <option value="">All Entities</option>
          {['patient','appointment','invoice','user','setting','lead','automation_rule','prescription','lab_order'].map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select value={filters.action} onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none cursor-pointer">
          <option value="">All Actions</option>
          {['CREATE','READ','UPDATE','DELETE','EXPORT','LOGIN','ERASURE_REQUEST'].map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <button onClick={() => load(1)} className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors">Apply</button>
        <button onClick={() => setFilters({ action: '', entity: '' })} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">Reset</button>
      </div>

      {/* Log table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['Timestamp', 'Tenant', 'User', 'Action', 'Entity', 'IP Address'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 6 }).map((__, j) => (
                  <td key={j} className="px-5 py-4"><div className="animate-pulse bg-slate-200 rounded h-4" /></td>
                ))}</tr>
              ))
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} className="py-16 text-center">
                <Activity className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No audit logs found</p>
              </td></tr>
            ) : logs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString('en-IN')}
                </td>
                <td className="px-5 py-3 text-xs text-slate-600 font-mono truncate max-w-24">{log.tenantId?.slice(0,8)}…</td>
                <td className="px-5 py-3 text-xs text-slate-700">
                  {log.user ? `${log.user.firstName} ${log.user.lastName || ''}` : '—'}
                </td>
                <td className="px-5 py-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ACTION_COLORS[log.action] || 'bg-slate-100 text-slate-600'}`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs font-semibold text-slate-700">{log.entity}</td>
                <td className="px-5 py-3 text-xs text-slate-400">{log.ipAddress || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && meta.total > 0 && (
          <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">Showing {(meta.page-1)*meta.limit+1}–{Math.min(meta.page*meta.limit, meta.total)} of {meta.total.toLocaleString('en-IN')}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => load(meta.page-1)} disabled={meta.page===1} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronLeft className="w-4 h-4"/></button>
              <span className="text-xs text-slate-600 px-3">{meta.page} / {meta.totalPages}</span>
              <button onClick={() => load(meta.page+1)} disabled={meta.page>=meta.totalPages} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronRight className="w-4 h-4"/></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
