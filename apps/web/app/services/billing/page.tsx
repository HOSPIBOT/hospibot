'use client';
import { useState } from 'react';
import { CreditCard, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const INVOICES = [
  { client: 'Sunshine Hospital Group', amount: 120000, date: '2025-04-01', status: 'PAID'    },
  { client: 'MedCare Diagnostics',     amount:  35000, date: '2025-04-05', status: 'PENDING' },
  { client: 'Apollo Pharmacies',       amount:  87500, date: '2025-03-15', status: 'PAID'    },
  { client: 'City Nursing Home',       amount:  52000, date: '2025-03-20', status: 'OVERDUE' },
  { client: 'Reliance Health',         amount:  28000, date: '2025-04-10', status: 'PENDING' },
];

const STATUS_CLR: Record<string, string> = {
  PAID:    'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
  OVERDUE: 'bg-red-100 text-red-700',
};

export default function ServicesBillingPage() {
  const [invoices] = useState(INVOICES);
  const collected  = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.amount, 0);
  const outstanding = invoices.filter(i => i.status !== 'PAID').reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Services Billing</h1>

      <div className="grid grid-cols-3 gap-4">
        {[
          { l: 'Invoices Raised', v: invoices.length,                           icon: CreditCard,  color: '#334155' },
          { l: 'Collected',       v: `₹${(collected / 100000).toFixed(1)}L`,    icon: TrendingUp,  color: '#10B981' },
          { l: 'Outstanding',     v: `₹${(outstanding / 100000).toFixed(1)}L`,  icon: AlertTriangle, color: '#EF4444' },
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

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead><tr className="bg-slate-50 border-b border-slate-100">
            {['Client', 'Amount', 'Date', 'Status'].map(h => (
              <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-slate-50">
            {invoices.map((inv, i) => (
              <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-5 py-3.5 font-semibold text-slate-900 text-sm">{inv.client}</td>
                <td className="px-5 py-3.5 font-bold text-slate-900 text-sm">₹{(inv.amount / 1000).toFixed(0)}K</td>
                <td className="px-5 py-3.5 text-xs text-slate-500">{formatDate(inv.date)}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_CLR[inv.status] || 'bg-slate-100 text-slate-600'}`}>
                    {inv.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
