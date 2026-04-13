'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { FileText, Plus, X, Loader2, TrendingUp, CheckCircle2, AlertTriangle } from 'lucide-react';

const CONTRACTS = [
  { id:'1', client:'Sunshine Hospital Group', type:'AMC',     value:1200000, status:'ACTIVE',   start:'2024-04-01', end:'2025-03-31' },
  { id:'2', client:'MedCare Diagnostics',     type:'Service', value:350000,  status:'ACTIVE',   start:'2024-06-01', end:'2025-05-31' },
  { id:'3', client:'Apollo Pharmacies',       type:'Supply',  value:875000,  status:'EXPIRING', start:'2024-01-01', end:'2025-01-15' },
  { id:'4', client:'City Nursing Home',       type:'AMC',     value:520000,  status:'PENDING',  start:'2025-02-01', end:'2026-01-31' },
  { id:'5', client:'Reliance Health',         type:'Consulting', value:280000, status:'ACTIVE', start:'2024-09-01', end:'2025-08-31' },
];

const STATUS_CLR: Record<string,string> = {
  ACTIVE:   'bg-emerald-100 text-emerald-700',
  EXPIRING: 'bg-amber-100 text-amber-700',
  PENDING:  'bg-blue-100 text-blue-700',
  EXPIRED:  'bg-red-100 text-red-700',
};

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-400 outline-none transition-all placeholder:text-slate-400';

function formatINRValue(v: number) {
  return `₹${(v / 100000).toFixed(2)}L`;
}

export default function ContractsPage() {
  const [show, setShow]       = useState(false);
  const [saving, setSaving]   = useState(false);
  const [contracts, setContracts] = useState(CONTRACTS);
  const [form, setForm] = useState({ client: '', type: 'AMC', value: '', start: '', end: '' });

  // Load from API if available; fall back to local sample data
  useEffect(() => {
    api.get('/crm/leads', { params: { stage: 'CLOSED_WON', limit: 50 } })
      .then(r => {
        const leads = r.data?.data ?? [];
        if (leads.length > 0) {
          setContracts(leads.map((l: any) => ({
            id: l.id,
            client: l.name || l.patient?.firstName || 'Client',
            type: 'Service',
            value: l.estimatedValue || 500000,
            status: 'ACTIVE',
            start: l.createdAt?.slice(0, 10) || '',
            end: '',
          })));
        }
      }).catch(() => {});
  }, []);

  const totalValue = contracts.filter(c => c.status === 'ACTIVE').reduce((s, c) => s + c.value, 0);

  const save = async () => {
    if (!form.client || !form.value) { toast.error('Client name and value required'); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 700));
    setContracts(prev => [...prev, {
      id: Date.now().toString(), client: form.client, type: form.type,
      value: Number(form.value) * 100, status: 'PENDING',
      start: form.start, end: form.end,
    }]);
    toast.success('Contract created!');
    setShow(false);
    setForm({ client: '', type: 'AMC', value: '', start: '', end: '' });
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Contracts</h1>
        <button onClick={() => setShow(true)}
          className="flex items-center gap-2 bg-slate-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-800 transition-colors">
          <Plus className="w-4 h-4" /> New Contract
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { l: 'Active Contracts', v: contracts.filter(c => c.status === 'ACTIVE').length, icon: CheckCircle2, color: '#10B981' },
          { l: 'Expiring Soon',   v: contracts.filter(c => c.status === 'EXPIRING').length, icon: AlertTriangle, color: '#F59E0B' },
          { l: 'Pending Sign',    v: contracts.filter(c => c.status === 'PENDING').length,  icon: FileText,     color: '#3B82F6' },
          { l: 'Active Value',    v: `₹${(totalValue / 100000).toFixed(1)}L`,               icon: TrendingUp,   color: '#334155' },
        ].map(s => (
          <div key={s.l} className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
              <p className="text-xs text-slate-500">{s.l}</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{s.v}</p>
          </div>
        ))}
      </div>

      {/* Contracts table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['Client', 'Type', 'Value', 'Period', 'Days Left', 'Status'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {contracts.map(c => {
              const daysLeft = c.end ? Math.ceil((new Date(c.end).getTime() - Date.now()) / 86400000) : null;
              return (
                <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-slate-900 text-sm">{c.client}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{c.type}</td>
                  <td className="px-5 py-3.5 font-bold text-slate-900 text-sm">{formatINRValue(c.value)}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                    {c.start ? formatDate(c.start) : '—'} → {c.end ? formatDate(c.end) : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    {daysLeft !== null && (
                      <span className={`text-xs font-semibold ${daysLeft < 30 ? 'text-red-600' : daysLeft < 90 ? 'text-amber-600' : 'text-slate-500'}`}>
                        {daysLeft < 0 ? 'Expired' : `${daysLeft}d`}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_CLR[c.status] || 'bg-slate-100 text-slate-600'}`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {show && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShow(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">New Contract</h2>
              <button onClick={() => setShow(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Client Name *</label>
                <input className={inputCls} placeholder="Hospital / Clinic name" value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} /></div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Contract Type</label>
                <select className={inputCls} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {['AMC', 'Service', 'Supply', 'Rental', 'Consulting', 'Partnership'].map(t => <option key={t}>{t}</option>)}
                </select></div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Contract Value (₹) *</label>
                <input type="number" className={inputCls} placeholder="500000" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Start Date</label>
                  <input type="date" className={inputCls} value={form.start} onChange={e => setForm(f => ({ ...f, start: e.target.value }))} /></div>
                <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">End Date</label>
                  <input type="date" className={inputCls} value={form.end} onChange={e => setForm(f => ({ ...f, end: e.target.value }))} /></div>
              </div>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
              <button onClick={() => setShow(false)} className="text-sm text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-100">Cancel</button>
              <button onClick={save} disabled={saving}
                className="bg-slate-900 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Create Contract
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
