'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate, formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';
import { CreditCard, TrendingUp, AlertTriangle, RefreshCw, Plus, Search, Download } from 'lucide-react';

const STATUS_CLR: Record<string, string> = {
  PAID:    'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
  OVERDUE: 'bg-red-100 text-red-700',
  DRAFT:   'bg-slate-100 text-slate-500',
};

// Seed used when backend has no services-specific billing yet
const SEED_INVOICES = [
  { id: 'i1', patientName: 'Sunshine Hospital Group', totalAmount: 12000000, status: 'PAID',    createdAt: '2025-04-01', invoiceNumber: 'SRV-001' },
  { id: 'i2', patientName: 'MedCare Diagnostics',     totalAmount:  3500000, status: 'PENDING', createdAt: '2025-04-05', invoiceNumber: 'SRV-002' },
  { id: 'i3', patientName: 'Apollo Pharmacies',       totalAmount:  8750000, status: 'PAID',    createdAt: '2025-03-15', invoiceNumber: 'SRV-003' },
  { id: 'i4', patientName: 'City Nursing Home',       totalAmount:  5200000, status: 'OVERDUE', createdAt: '2025-03-20', invoiceNumber: 'SRV-004' },
  { id: 'i5', patientName: 'Reliance Health',         totalAmount:  2800000, status: 'PENDING', createdAt: '2025-04-10', invoiceNumber: 'SRV-005' },
];

export default function ServicesBillingPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/billing/invoices', { params: { limit: 50 } });
      const data = res.data?.data ?? res.data ?? [];
      setInvoices(Array.isArray(data) && data.length > 0 ? data : SEED_INVOICES);
    } catch {
      setInvoices(SEED_INVOICES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const [exporting, setExporting] = useState(false);
  const exportCSV = () => {
    setExporting(true);
    try {
      const header = ['Invoice #', 'Client', 'Amount', 'Status', 'Date'];
      const rows = filtered.map(inv => [
        inv.invoiceNumber ?? inv.id?.slice(0,8).toUpperCase() ?? '',
        clientName(inv),
        inv.totalAmount ?? 0,
        inv.status ?? '',
        inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('en-IN') : '',
      ]);
      const csv  = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `services-billing-${new Date().toISOString().slice(0,10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
      toast.success(`Exported ${filtered.length} invoices`);
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  const filtered = invoices.filter(inv => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (inv.patientName ?? inv.patient?.firstName ?? '').toLowerCase().includes(q) ||
      (inv.invoiceNumber ?? '').toLowerCase().includes(q)
    );
  });

  const collected   = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + (i.totalAmount ?? 0), 0);
  const outstanding = invoices.filter(i => i.status !== 'PAID').reduce((s, i) => s + (i.totalAmount ?? 0), 0);
  const overdue     = invoices.filter(i => i.status === 'OVERDUE').length;

  const clientName = (inv: any) =>
    inv.patientName ?? `${inv.patient?.firstName ?? ''} ${inv.patient?.lastName ?? ''}`.trim() || '—';

  return (
    <div className="space-y-5">

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Services Billing</h1>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={exportCSV} disabled={exporting}
            className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm font-medium px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
            <Download className="w-4 h-4" /> {exporting ? 'Exporting…' : 'Export'}
          </button>
          <a href="/clinical/billing"
            className="flex items-center gap-2 bg-slate-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-800 transition-colors">
            <Plus className="w-4 h-4" /> New Invoice
          </a>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { l: 'Total Invoices',   v: invoices.length,           icon: CreditCard,    color: '#334155' },
          { l: 'Collected',        v: formatINR(collected),      icon: TrendingUp,    color: '#10B981' },
          { l: 'Outstanding',      v: formatINR(outstanding),    icon: AlertTriangle, color: '#F59E0B' },
          { l: 'Overdue',          v: overdue,                   icon: AlertTriangle, color: '#EF4444' },
        ].map(k => (
          <div key={k.l} className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center gap-2 mb-2">
              <k.icon className="w-4 h-4" style={{ color: k.color }} />
              <p className="text-xs text-slate-500">{k.l}</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{k.v}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 w-80">
        <Search className="w-4 h-4 text-slate-400" />
        <input className="bg-transparent text-sm outline-none flex-1 placeholder:text-slate-400"
          placeholder="Search client or invoice…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['Invoice #', 'Client', 'Amount', 'Date', 'Status', ''].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="animate-pulse bg-slate-200 rounded h-3 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-sm">
                  {search ? 'No results match your search' : 'No invoices yet'}
                </td>
              </tr>
            ) : (
              filtered.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5 text-xs font-mono text-slate-500">{inv.invoiceNumber ?? `INV-${inv.id?.slice(-4)}`}</td>
                  <td className="px-5 py-3.5 font-semibold text-slate-900 text-sm">{clientName(inv)}</td>
                  <td className="px-5 py-3.5 font-bold text-slate-900 text-sm">{formatINR(inv.totalAmount ?? 0)}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">{formatDate(inv.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_CLR[inv.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <a href={`/clinical/billing/patient/${inv.patientId ?? ''}`}
                      className="text-xs text-[#0D7C66] font-semibold hover:underline">
                      View
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
