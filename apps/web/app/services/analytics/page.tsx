'use client';
import { useState } from 'react';
import { BarChart3, TrendingUp, CheckCircle2, AlertTriangle } from 'lucide-react';

const CONTRACTS = [
  { client: 'Sunshine Hospital Group', type: 'AMC',     value: 1200000, status: 'ACTIVE'   },
  { client: 'MedCare Diagnostics',     type: 'Service', value: 350000,  status: 'ACTIVE'   },
  { client: 'Apollo Pharmacies',       type: 'Supply',  value: 875000,  status: 'EXPIRING' },
  { client: 'City Nursing Home',       type: 'AMC',     value: 520000,  status: 'PENDING'  },
  { client: 'Reliance Health',         type: 'Consulting', value: 280000, status: 'ACTIVE' },
];

export default function ServicesAnalyticsPage() {
  const [contracts] = useState(CONTRACTS);
  const totalActive = contracts.filter(c => c.status === 'ACTIVE').reduce((s, c) => s + c.value, 0);
  const expiring    = contracts.filter(c => c.status === 'EXPIRING').length;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Services Analytics</h1>

      <div className="grid grid-cols-4 gap-4">
        {[
          { l: 'Active Contracts', v: contracts.filter(c => c.status === 'ACTIVE').length, icon: CheckCircle2, color: '#10B981' },
          { l: 'Active Value',     v: `₹${(totalActive / 100000).toFixed(1)}L`,            icon: TrendingUp,   color: '#334155' },
          { l: 'Expiring Soon',    v: expiring,                                             icon: AlertTriangle, color: '#F59E0B' },
          { l: 'Total Contracts',  v: contracts.length,                                     icon: BarChart3,    color: '#3B82F6' },
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

      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Contract Pipeline</h3>
        <div className="space-y-2">
          {contracts.map((c, i) => {
            const pct = Math.round((c.value / contracts.reduce((s, x) => s + x.value, 0)) * 100);
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="flex-1 text-sm font-medium text-slate-800">{c.client}</span>
                <span className="text-xs text-slate-400">{c.type}</span>
                <div className="w-24 bg-slate-100 rounded-full h-1.5">
                  <div className="h-1.5 bg-slate-700 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-sm font-bold text-slate-700 w-16 text-right">₹{(c.value / 100000).toFixed(1)}L</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-20 text-center ${
                  c.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                  c.status === 'EXPIRING' ? 'bg-amber-100 text-amber-700' :
                  'bg-blue-100 text-blue-700'
                }`}>{c.status}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
