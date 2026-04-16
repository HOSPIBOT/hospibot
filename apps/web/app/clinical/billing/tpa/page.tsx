'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate, formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Shield, RefreshCw, Search, Filter, Download,
  ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle,
  Clock, X, Loader2, Send, IndianRupee, FileText,
} from 'lucide-react';

const CLAIM_STATUSES = ['DRAFT','SUBMITTED','PROCESSING','APPROVED','REJECTED','SETTLED'];
const STATUS_COLORS: Record<string,string> = {
  DRAFT:      'bg-slate-100 text-slate-600',
  SUBMITTED:  'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-amber-100 text-amber-700',
  APPROVED:   'bg-emerald-100 text-emerald-700',
  REJECTED:   'bg-red-100 text-red-700',
  SETTLED:    'bg-teal-100 text-teal-700',
};
const PRE_AUTH_COLORS: Record<string,string> = {
  PENDING:  'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
};
const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] outline-none transition-all placeholder:text-slate-400';

export default function TPAClaimsPage() {
  const [claims,   setClaims]   = useState<any[]>([]);
  const [meta,     setMeta]     = useState({ page:1, total:0, totalPages:1 });
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [statusF,  setStatusF]  = useState('');
  const [page,     setPage]     = useState(1);
  const [selected, setSelected] = useState<any>(null);
  const [action,   setAction]   = useState<'pre-auth'|'claim'|'settle'|null>(null);
  const [actionForm, setActionForm] = useState<any>({});
  const [saving,   setSaving]   = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const res = await api.get('/billing/tpa/claims', {
        params: { page: p, limit: 15, status: statusF || undefined },
      });
      setClaims(res.data.data ?? []);
      setMeta(res.data.meta ?? { page:1, total:0, totalPages:1 });
    } catch { toast.error('Failed to load claims'); }
    finally { setLoading(false); }
  }, [statusF, page]);

  useEffect(() => { load(1); }, [statusF]);
  useEffect(() => { load(page); }, [page]);

  const filteredClaims = claims.filter((c: any) =>
    !search || `${c.patient?.firstName} ${c.patient?.lastName} ${c.tpaName} ${c.claimNumber} ${c.invoiceNumber}`.toLowerCase().includes(search.toLowerCase())
  );

  // ── Pre-Auth Submit ───────────────────────────────────────────────────────
  const handlePreAuth = async () => {
    if (!actionForm.tpaName || !actionForm.preAuthAmount) { toast.error('TPA name and amount required'); return; }
    setSaving(true);
    try {
      await api.post(`/billing/invoices/${selected.id}/tpa/pre-auth`, {
        tpaName: actionForm.tpaName,
        preAuthAmount: Math.round(parseFloat(actionForm.preAuthAmount) * 100),
      });
      toast.success('Pre-authorization submitted');
      setAction(null); setActionForm({}); load();
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  // ── Claim Submit ─────────────────────────────────────────────────────────
  const handleClaim = async () => {
    if (!actionForm.claimAmount) { toast.error('Claim amount required'); return; }
    setSaving(true);
    try {
      await api.post(`/billing/invoices/${selected.id}/tpa/claim`, {
        claimAmount: Math.round(parseFloat(actionForm.claimAmount) * 100),
      });
      toast.success('Claim submitted to TPA');
      setAction(null); setActionForm({}); load();
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  // ── Settle Claim ─────────────────────────────────────────────────────────
  const handleSettle = async () => {
    if (!actionForm.settledAmount) { toast.error('Settled amount required'); return; }
    setSaving(true);
    try {
      await api.patch(`/billing/invoices/${selected.id}/tpa/claim/status`, {
        status: 'SETTLED',
        settledAmount: Math.round(parseFloat(actionForm.settledAmount) * 100),
      });
      toast.success('Claim marked as settled');
      setAction(null); setActionForm({}); load();
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const exportCSV = async () => {
    setExporting(true);
    try {
      const res = await api.get('/billing/tpa/claims', { params: { limit: 5000 } });
      const all: any[] = res.data.data ?? [];
      const header = ['Invoice#','Patient','TPA','Policy No','Pre-Auth Status','Pre-Auth Amt','Claim#','Claim Status','Claim Amt','Settled Amt','Date'];
      const rows = all.map((c: any) => [
        c.invoiceNumber, `${c.patient?.firstName??''} ${c.patient?.lastName??''}`.trim(),
        c.tpaName??'', c.patient?.insurancePolicyNo??'',
        c.preAuthStatus??'', c.preAuthAmount ? formatINR(c.preAuthAmount) : '',
        c.claimNumber??'', c.claimStatus??'',
        c.claimAmount ? formatINR(c.claimAmount) : '',
        c.settledAmount ? formatINR(c.settledAmount) : '',
        formatDate(c.createdAt),
      ]);
      const csv = [header,...rows].map((r: any) =>r.map((v: any) =>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
      const blob = new Blob([csv],{type:'text/csv'}); const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href=url; a.download=`tpa-claims-${new Date().toISOString().slice(0,10)}.csv`;
      a.click(); URL.revokeObjectURL(url); toast.success(`Exported ${all.length} claims`);
    } catch { toast.error('Export failed'); } finally { setExporting(false); }
  };

  // ── KPI aggregates ────────────────────────────────────────────────────────
  const totalClaimed  = claims.reduce((s: any, c: any) => s + (c.claimAmount  ?? 0), 0);
  const totalSettled  = claims.reduce((s: any, c: any) => s + (c.settledAmount ?? 0), 0);
  const pendingClaims = claims.filter((c: any) => ['SUBMITTED','PROCESSING'].includes(c.claimStatus ?? '')).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#0D7C66]" /> Insurance / TPA Claims
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{loading ? 'Loading…' : `${meta.total} TPA bills · ₹${(totalClaimed/100).toLocaleString('en-IN')} claimed`}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} disabled={exporting}
            className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm font-medium px-3 py-2 rounded-xl hover:bg-slate-50 disabled:opacity-50">
            <Download className="w-4 h-4" /> {exporting ? 'Exporting…' : 'Export'}
          </button>
          <button onClick={() => load()} className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50">
            <RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`} />
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total TPA Bills',    value: meta.total,                     color:'#0D7C66' },
          { label: 'Pending Claims',     value: pendingClaims,                  color:'#F59E0B' },
          { label: 'Total Claimed',      value: formatINR(totalClaimed),        color:'#3B82F6' },
          { label: 'Total Settled',      value: formatINR(totalSettled),        color:'#10B981' },
        ].map((k: any) => (
          <div key={k.label} className="bg-white rounded-2xl border border-slate-100 p-5">
            <p className="text-xs text-slate-500">{k.label}</p>
            <p className="text-2xl font-bold mt-1" style={{color:k.color}}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-72">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input className="bg-transparent text-sm outline-none flex-1 placeholder:text-slate-400"
            placeholder="Search patient, TPA, claim#…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <select value={statusF} onChange={e=>setStatusF(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none cursor-pointer">
          <option value="">All Statuses</option>
          {CLAIM_STATUSES.map((s: any) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Claims table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['Invoice','Patient','TPA / Policy','Pre-Auth','Claim #','Claim Status','Amounts','Actions'].map((h: any) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? Array.from({length:5}).map((_,i) => (
              <tr key={i}>{Array.from({length:8}).map((__,j) => <td key={j} className="px-4 py-3"><div className="animate-pulse bg-slate-200 rounded h-4"/></td>)}</tr>
            )) : filteredClaims.length === 0 ? (
              <tr><td colSpan={8} className="py-16 text-center">
                <Shield className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No TPA claims found</p>
                <p className="text-slate-400 text-xs mt-1">Create an invoice and mark it as TPA/Insurance</p>
              </td></tr>
            ) : filteredClaims.map((c: any) => (
              <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-3">
                  <p className="text-sm font-mono font-semibold text-slate-900">{c.invoiceNumber}</p>
                  <p className="text-xs text-slate-400">{formatDate(c.createdAt)}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{c.patient?.firstName} {c.patient?.lastName||''}</p>
                  <p className="text-xs text-slate-400">{c.patient?.phone}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{c.tpaName || '—'}</p>
                  <p className="text-xs text-slate-400">{c.patient?.insurancePolicyNo || c.preAuthNumber || '—'}</p>
                </td>
                <td className="px-4 py-3">
                  {c.preAuthStatus ? (
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${PRE_AUTH_COLORS[c.preAuthStatus]||'bg-slate-100 text-slate-600'}`}>
                      {c.preAuthStatus}
                    </span>
                  ) : <span className="text-xs text-slate-300">Not submitted</span>}
                  {c.preAuthAmount ? <p className="text-xs text-slate-400 mt-0.5">{formatINR(c.preAuthAmount)}</p> : null}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{c.claimNumber || '—'}</td>
                <td className="px-4 py-3">
                  {c.claimStatus ? (
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[c.claimStatus]||'bg-slate-100 text-slate-600'}`}>
                      {c.claimStatus}
                    </span>
                  ) : <span className="text-xs text-slate-300">No claim</span>}
                </td>
                <td className="px-4 py-3">
                  <p className="text-xs text-slate-600">Bill: {formatINR(c.totalAmount)}</p>
                  {c.claimAmount    ? <p className="text-xs text-blue-600">Claimed: {formatINR(c.claimAmount)}</p> : null}
                  {c.settledAmount  ? <p className="text-xs text-emerald-600 font-semibold">Settled: {formatINR(c.settledAmount)}</p> : null}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {!c.preAuthStatus && (
                      <button onClick={() => { setSelected(c); setAction('pre-auth'); setActionForm({ tpaName: c.tpaName||'', preAuthAmount: (c.totalAmount/100).toFixed(2) }); }}
                        className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg hover:bg-amber-100">
                        Pre-Auth
                      </button>
                    )}
                    {c.preAuthStatus === 'APPROVED' && !c.claimNumber && (
                      <button onClick={() => { setSelected(c); setAction('claim'); setActionForm({ claimAmount: (c.preAuthAmount/100||c.totalAmount/100).toFixed(2) }); }}
                        className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg hover:bg-blue-100">
                        Submit Claim
                      </button>
                    )}
                    {c.claimStatus === 'APPROVED' && !c.settledAmount && (
                      <button onClick={() => { setSelected(c); setAction('settle'); setActionForm({ settledAmount: (c.claimAmount/100).toFixed(2) }); }}
                        className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg hover:bg-emerald-100">
                        Settle
                      </button>
                    )}
                    <a href={`/clinical/billing/${c.id}`}
                      className="text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-100">
                      View
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {meta.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
            <span>Page {meta.page} of {meta.totalPages} · {meta.total} total</span>
            <div className="flex gap-1.5">
              <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="p-1.5 rounded-xl border border-slate-200 disabled:opacity-40"><ChevronLeft className="w-4 h-4"/></button>
              <button disabled={page>=meta.totalPages} onClick={()=>setPage(p=>p+1)} className="p-1.5 rounded-xl border border-slate-200 disabled:opacity-40"><ChevronRight className="w-4 h-4"/></button>
            </div>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {action && selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e=>e.target===e.currentTarget&&setAction(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {action==='pre-auth'?'Submit Pre-Authorization':action==='claim'?'Submit Claim to TPA':'Record Settlement'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">{selected.invoiceNumber} · {selected.patient?.firstName} {selected.patient?.lastName||''}</p>
              </div>
              <button onClick={()=>setAction(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4"/></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {action === 'pre-auth' && <>
                <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">TPA / Insurance Company *</label>
                  <input className={inputCls} placeholder="Star Health, Medi Assist, HDFC Ergo…" value={actionForm.tpaName||''} onChange={e=>setActionForm((f:any)=>({...f,tpaName:e.target.value}))}/></div>
                <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Pre-Auth Amount (₹) *</label>
                  <input type="number" className={inputCls} placeholder="0.00" value={actionForm.preAuthAmount||''} onChange={e=>setActionForm((f:any)=>({...f,preAuthAmount:e.target.value}))}/></div>
              </>}
              {action === 'claim' && <>
                <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Claim Amount (₹) *</label>
                  <input type="number" className={inputCls} value={actionForm.claimAmount||''} onChange={e=>setActionForm((f:any)=>({...f,claimAmount:e.target.value}))}/></div>
                <p className="text-xs text-slate-400">Pre-Auth approved: {formatINR(selected.preAuthAmount||0)}</p>
              </>}
              {action === 'settle' && <>
                <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Amount Settled by TPA (₹) *</label>
                  <input type="number" className={inputCls} value={actionForm.settledAmount||''} onChange={e=>setActionForm((f:any)=>({...f,settledAmount:e.target.value}))}/></div>
                <p className="text-xs text-slate-400">Claimed: {formatINR(selected.claimAmount||0)} · Bill total: {formatINR(selected.totalAmount||0)}</p>
                <p className="text-xs text-amber-600">Remaining balance will be marked as patient due amount.</p>
              </>}
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
              <button onClick={()=>setAction(null)} className="text-sm text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-100">Cancel</button>
              <button
                onClick={action==='pre-auth'?handlePreAuth:action==='claim'?handleClaim:handleSettle}
                disabled={saving}
                className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-semibold px-6 py-2.5 rounded-xl disabled:opacity-50">
                {saving?<Loader2 className="w-4 h-4 animate-spin"/>:<Send className="w-4 h-4"/>}
                {action==='pre-auth'?'Submit Pre-Auth':action==='claim'?'Submit Claim':'Record Settlement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
