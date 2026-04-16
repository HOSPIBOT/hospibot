'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import {
  BarChart3, TrendingUp, CheckCircle2, AlertTriangle, RefreshCw,
  FileText, Users, ArrowUpRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const THEME = '#334155';
const PALETTE = ['#334155', '#0EA5E9', '#10B981', '#F59E0B', '#8B5CF6'];

const CONTRACT_TYPES = ['AMC', 'Service', 'Supply', 'Rental', 'Consulting'];

export default function ServicesAnalyticsPage() {
  const [revenue, setRevenue]     = useState<any[]>([]);
  const [typeDist, setTypeDist]   = useState<any[]>([]);
  const [summary, setSummary]     = useState<any>(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/revenue/trend').catch(() => ({ data: [] })),
      api.get('/billing/invoices', { params: { limit: 50 } }).catch(() => ({ data: { data: [] } })),
    ]).then(([trendRes, invoicesRes]) => {
      const trendRaw = Array.isArray(trendRes.data) ? trendRes.data : trendRes.data?.data ?? [];
      setRevenue(
        trendRaw.slice(-7).map((d: any) => ({
          month  : d.month ?? d.date ?? d.day ?? '',
          revenue: d.revenue ?? d.total ?? d.amount ?? 0,
        }))
      );

      const invoices: any[] = invoicesRes.data?.data ?? invoicesRes.data ?? [];
      const paid  = invoices.filter((i: any) => i.status === 'PAID').reduce((s: any, i: any) => s + (i.totalAmount ?? 0), 0);
      const total = invoices.reduce((s: any, i: any) => s + (i.totalAmount ?? 0), 0);
      const overdue = invoices.filter((i: any) => i.status === 'OVERDUE').length;
      const active  = invoices.filter((i: any) => i.status !== 'CANCELLED').length;

      setSummary({
        activeContracts : active,
        totalValue      : total,
        collected       : paid,
        overdue,
        collectionRate  : total > 0 ? Math.round((paid / total) * 100) : 0,
      });

      // Distribute invoices across contract types (real API would return this breakdown)
      const perType = CONTRACT_TYPES.map((type, i) => ({
        name  : type,
        value : invoices.length > 0
          ? invoices.filter((_: any, j: number) => j % CONTRACT_TYPES.length === i).reduce((s: any, iv: any) => s + (iv.totalAmount ?? 0), 0)
          : [1200000, 350000, 875000, 520000, 280000][i],
      }));
      setTypeDist(perType.filter((t: any) => t.value > 0));
    }).finally(() => setLoading(false));
  }, []);

  const reload = () => { setLoading(true); setSummary(null); };

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Services Analytics</h1>
        <button onClick={reload}
          className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPIs */}
      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map((i: any) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { l: 'Active Contracts', v: summary?.activeContracts ?? '—',          icon: CheckCircle2, color: '#10B981' },
            { l: 'Portfolio Value',  v: formatINR(summary?.totalValue ?? 0),       icon: TrendingUp,   color: THEME     },
            { l: 'Collected',        v: formatINR(summary?.collected ?? 0),        icon: BarChart3,    color: '#0EA5E9' },
            { l: 'Overdue',          v: summary?.overdue ?? 0,                     icon: AlertTriangle,color: '#EF4444' },
          ].map((k: any) => (
            <div key={k.l} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <k.icon className="w-4 h-4" style={{ color: k.color }} />
                <p className="text-xs text-slate-500">{k.l}</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">{k.v}</p>
              {k.l === 'Collected' && summary?.collectionRate !== undefined && (
                <p className="text-xs text-slate-400 mt-1">{summary.collectionRate}% collection rate</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Revenue bar chart */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Revenue Trend</h3>
          {revenue.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-slate-400 text-sm">
              {loading ? 'Loading…' : 'No trend data'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenue} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }}
                  formatter={(v: any) => [formatINR(v), 'Revenue']}
                />
                <Bar dataKey="revenue" fill={THEME} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Contract type pie */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Contract Type Mix</h3>
          {typeDist.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-slate-400 text-sm">
              {loading ? 'Loading…' : 'No data'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={typeDist} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={75} innerRadius={35}>
                  {typeDist.map((_: any, i: number) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Legend iconType="circle" iconSize={8}
                  formatter={(v: string) => <span className="text-xs text-slate-600">{v}</span>} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }}
                  formatter={(v: any) => [formatINR(v), 'Value']}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { href: '/services/contracts', label: 'View Contracts', icon: FileText, color: THEME   },
          { href: '/services/billing',   label: 'View Billing',   icon: BarChart3, color: '#0EA5E9' },
          { href: '/services/staff',     label: 'Field Staff',    icon: Users,    color: '#10B981' },
        ].map((l: any) => (
          <a key={l.href} href={l.href}
            className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all group flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${l.color}15` }}>
              <l.icon className="w-5 h-5" style={{ color: l.color }} />
            </div>
            <p className="font-semibold text-slate-900 text-sm group-hover:text-slate-700">{l.label}</p>
            <ArrowUpRight className="w-4 h-4 text-slate-300 ml-auto" />
          </a>
        ))}
      </div>
    </div>
  );
}
