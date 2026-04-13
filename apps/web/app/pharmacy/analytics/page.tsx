'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import { RefreshCw, Package, TrendingUp, AlertTriangle, BarChart3 } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const NAV_COLOR = '#166534';

export default function PharmacyAnalyticsPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [revTrend, setRevTrend]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [period, setPeriod]       = useState<'week'|'month'>('month');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, rev] = await Promise.all([
        api.get('/pharmacy/dashboard').catch(() => ({ data: {} })),
        api.get(`/pharmacy/revenue-trend?days=${period === 'week' ? 7 : 30}`).catch(() => ({ data: [] })),
      ]);
      setDashboard(dash.data);
      setRevTrend(Array.isArray(rev.data) ? rev.data : []);
    } catch { /* use whatever loaded */ }
    finally { setLoading(false); }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const d = dashboard || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Pharmacy Analytics</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {(['week','month'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg capitalize transition-all ${period === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {p}
              </button>
            ))}
          </div>
          <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPIs */}
      {loading ? (
        <div className="grid grid-cols-4 gap-4">{Array.from({length:4}).map((_,i) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-24"/>)}</div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Products',   value: d.totalProducts ?? 0,                 icon: Package,        color: NAV_COLOR },
            { label: 'Today\'s Revenue', value: formatINR(d.todayRevenue ?? 0),        icon: TrendingUp,     color: '#10B981' },
            { label: 'Low Stock Items',  value: (d.lowStockCount ?? 0) + (d.outOfStockCount ?? 0), icon: AlertTriangle, color: '#F59E0B' },
            { label: 'Orders Today',     value: d.todayOrders ?? 0,                   icon: BarChart3,      color: '#3B82F6' },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-2">
                <k.icon className="w-4 h-4" style={{ color: k.color }} />
                <p className="text-xs text-slate-500">{k.label}</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">{k.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Revenue trend */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Dispensing Revenue</h3>
        {revTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revTrend} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="pharmaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={NAV_COLOR} stopOpacity={0.15}/>
                  <stop offset="95%" stopColor={NAV_COLOR} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={(v: string) => v?.slice(5) || v} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={(v: number) => `₹${(v/100000).toFixed(0)}L`} />
              <Tooltip formatter={(v: any) => [formatINR(Number(v)), 'Revenue']}
                contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke={NAV_COLOR} strokeWidth={2.5} fill="url(#pharmaGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-300 text-sm">
            No revenue data yet. Complete dispensing orders to see trends.
          </div>
        )}
      </div>

      {/* Alert summary */}
      {(d.lowStockCount > 0 || d.expiringCount > 0 || d.outOfStockCount > 0) && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Out of Stock',    value: d.outOfStockCount ?? 0, color: '#EF4444', href: '/pharmacy/inventory' },
            { label: 'Low Stock',       value: d.lowStockCount ?? 0,   color: '#F59E0B', href: '/pharmacy/inventory' },
            { label: 'Expiring (90d)',  value: d.expiringCount ?? 0,   color: '#F97316', href: '/pharmacy/inventory' },
          ].map(a => (
            <a key={a.label} href={a.href}
              className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">{a.label}</p>
                <AlertTriangle className="w-4 h-4" style={{ color: a.color }} />
              </div>
              <p className="text-3xl font-bold mt-2" style={{ color: a.color }}>{a.value}</p>
              <p className="text-xs text-slate-400 mt-1 group-hover:text-[#166534] transition-colors">View in Inventory →</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
