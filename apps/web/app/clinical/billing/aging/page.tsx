'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate, formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';
import { RefreshCw, AlertTriangle, TrendingDown, Phone, Send, Download } from 'lucide-react';

type AgeBracket = '0-30' | '31-60' | '61-90' | '90+';

interface AgedInvoice {
  id: string;
  invoiceNumber: string;
  patient: any;
  totalAmount: number;
  dueAmount: number;
  createdAt: string;
  daysOld: number;
  bracket: AgeBracket;
}

const BRACKET_CONFIG: Record<AgeBracket, { label: string; color: string; bg: string; severity: string }> = {
  '0-30':  { label: '0–30 days',  color: '#10B981', bg: '#D1FAE5', severity: 'Fresh' },
  '31-60': { label: '31–60 days', color: '#F59E0B', bg: '#FEF3C7', severity: 'Overdue' },
  '61-90': { label: '61–90 days', color: '#EF4444', bg: '#FEE2E2', severity: 'Late' },
  '90+':   { label: '90+ days',   color: '#7C3AED', bg: '#EDE9FE', severity: 'Critical' },
};

function getBracket(daysOld: number): AgeBracket {
  if (daysOld <= 30)  return '0-30';
  if (daysOld <= 60)  return '31-60';
  if (daysOld <= 90)  return '61-90';
  return '90+';
}

export default function InvoiceAgingPage() {
  const [invoices, setInvoices] = useState<AgedInvoice[]>([]);
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState<string | null>(null);
  const [filter, setFilter]     = useState<AgeBracket | 'all'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/billing/invoices', {
        params: { status: 'PENDING,OVERDUE,PARTIAL', limit: 200 },
      });
      const raw: any[] = res.data.data ?? [];
      const aged: AgedInvoice[] = raw
        .filter((inv: any) => (inv.dueAmount ?? 0) > 0)
        .map((inv: any) => {
          const daysOld = Math.floor((Date.now() - new Date(inv.createdAt).getTime()) / 86400000);
          return { ...inv, daysOld, bracket: getBracket(daysOld) };
        })
        .sort((a: any, b: any) => b.daysOld - a.daysOld);
      setInvoices(aged);
    } catch { toast.error('Failed to load aging report'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sendReminder = async (inv: AgedInvoice) => {
    setSending(inv.id);
    try {
      await api.post('/whatsapp/send', {
        to: inv.patient?.phone,
        message: `Hi ${inv.patient?.firstName}, this is a gentle reminder about invoice ${inv.invoiceNumber} for ₹${formatINR(inv.dueAmount)} due since ${formatDate(inv.createdAt)}. Please contact us at your earliest convenience to arrange payment.`,
      });
      toast.success(`Reminder sent to ${inv.patient?.firstName}!`);
    } catch { toast.error('Failed to send reminder'); }
    finally { setSending(null); }
  };

  const exportCSV = () => {
    const rows = [
      ['Invoice', 'Patient', 'Phone', 'Date', 'Days Old', 'Total', 'Due', 'Age Bracket'],
      ...displayed.map((i: any) => [
        i.invoiceNumber,
        `${i.patient?.firstName} ${i.patient?.lastName || ''}`.trim(),
        i.patient?.phone || '',
        formatDate(i.createdAt),
        i.daysOld.toString(),
        (i.totalAmount / 100).toString(),
        (i.dueAmount / 100).toString(),
        BRACKET_CONFIG[i.bracket].label,
      ]),
    ];
    const csv = rows.map((r: any) => r.map((v: any) => `"${v}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url; a.download = `invoice-aging-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  // Bracket summaries
  const summary = (['0-30', '31-60', '61-90', '90+'] as AgeBracket[]).map((b: any) => {
    const items = invoices.filter((i: any) => i.bracket === b);
    return {
      bracket: b,
      count: items.length,
      total: items.reduce((s: any, i: any) => s + i.dueAmount, 0),
      ...BRACKET_CONFIG[b],
    };
  });

  const totalDue    = invoices.reduce((s: any, i: any) => s + i.dueAmount, 0);
  const displayed   = filter === 'all' ? invoices : invoices.filter((i: any) => i.bracket === filter);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-red-500" /> Invoice Aging Report
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {invoices.length} unpaid invoices · Total due: <strong className="text-red-600">{formatINR(totalDue)}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={exportCSV}
            className="flex items-center gap-2 border border-slate-200 text-slate-600 text-sm font-medium px-4 py-2 rounded-xl hover:bg-slate-50">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Aging summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {summary.map((s: any) => (
          <button key={s.bracket} onClick={() => setFilter(filter === s.bracket ? 'all' : s.bracket)}
            className={`rounded-2xl border-2 p-4 text-left transition-all ${
              filter === s.bracket ? 'border-current shadow-md' : 'border-slate-100 bg-white hover:border-slate-200'
            }`}
            style={filter === s.bracket ? { borderColor: s.color, background: s.bg } : {}}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: s.color }}>{s.severity}</p>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: s.bg, color: s.color }}>{s.label}</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{s.count}</p>
            <p className="text-sm font-semibold mt-0.5" style={{ color: s.color }}>{formatINR(s.total)}</p>
          </button>
        ))}
      </div>

      {/* Invoice list */}
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-16" />
        ))}</div>
      ) : displayed.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center">
          <AlertTriangle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-medium">No outstanding invoices</p>
          <p className="text-slate-300 text-xs mt-1">All payments collected! 🎉</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Invoice #', 'Patient', 'Date', 'Days', 'Total', 'Due', 'Bracket', 'Action'].map((h: any) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {displayed.map((inv: any) => {
                const cfg = BRACKET_CONFIG[inv.bracket];
                const patName = `${inv.patient?.firstName} ${inv.patient?.lastName || ''}`.trim();
                return (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      <a href={`/clinical/billing/${inv.id}`} className="hover:underline hover:text-[#0D7C66]">
                        {inv.invoiceNumber}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">{patName}</p>
                      {inv.patient?.phone && (
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3" />{inv.patient.phone}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(inv.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold" style={{ color: cfg.color }}>{inv.daysOld}d</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-700">{formatINR(inv.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-red-600">{formatINR(inv.dueAmount)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                        style={{ background: cfg.bg, color: cfg.color }}>
                        {cfg.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {inv.patient?.phone && (
                        <button onClick={() => sendReminder(inv)}
                          disabled={sending === inv.id}
                          className="flex items-center gap-1 text-[11px] font-bold bg-[#25D366] text-white px-2.5 py-1.5 rounded-xl hover:opacity-90 disabled:opacity-60">
                          {sending === inv.id
                            ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                            : <Send className="w-3 h-3" />
                          }
                          Remind
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
