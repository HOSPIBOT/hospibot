'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  FlaskConical, TrendingUp, Clock, CheckCircle2, RefreshCw,
  Activity, Zap, Home, AlertTriangle, IndianRupee,
} from 'lucide-react';

const NAVY = '#1E3A5F';
const TEAL = '#0D7C66';
const COLORS = [NAVY, '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];

const PERIODS = [
  { v: '7d', label: '7 Days' },
  { v: '30d', label: '30 Days' },
  { v: '90d', label: '3 Months' },
  { v: '365d', label: '1 Year' },
];

function KpiCard({ label, value, icon: Icon, color = NAVY, sub }: any) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}14` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-black text-slate-900">{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function DiagnosticAnalyticsPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '365d'>('30d');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [analytics, dashboard] = await Promise.all([
        api.get('/diagnostic/analytics', { params: { period } }).catch(() => ({ data: null })),
        api.get('/diagnostic/dashboard').catch(() => api.get('/lab/dashboard')),
      ]);
      setData({ analytics: analytics.data, dashboard: dashboard.data });
    } finally { setLoading(false); }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="space-y-5">
      <div className="animate-pulse h-8 w-48 bg-slate-200 rounded-xl" />
      <div className="grid grid-cols-5 gap-4">{Array.from({length:5}).map((_,i) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-24"/>)}</div>
      <div className="grid grid-cols-2 gap-5">{Array.from({length:4}).map((_,i) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-64"/>)}</div>
    </div>
  );

  const a = data?.analytics ?? {};
  const d = data?.dashboard ?? {};
  const trend = a.revenueTrend ?? [];
  const statusDist = Object.entries(a.statusDist ?? {})
    .map(([name, value]: any) => ({ name: name.replace(/_/g, ' '), value }))
    .filter(s => s.value > 0);
  const automationStats = a.automationStats ?? {};
  const convRate = automationStats.SENT > 0
    ? Math.round(automationStats.CONVERTED / automationStats.SENT * 100)
    : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Analytics</h1>
          <p className="text-sm text-slate-500">Performance metrics and operational insights</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {PERIODS.map(p => (
              <button key={p.v} onClick={() => setPeriod(p.v as any)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${period === p.v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={() => load()} className="p-2.5 text-slate-500 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-5 gap-4">
        <KpiCard label="Total Orders" value={a.totalOrders ?? d.todayOrders ?? 0} icon={FlaskConical} color={NAVY} />
        <KpiCard label="Delivered" value={a.delivered ?? d.delivered ?? 0} icon={CheckCircle2} color={TEAL} />
        <KpiCard label="Total Revenue" value={formatINR(a.totalRevenue ?? d.todayRevenue ?? 0)} icon={IndianRupee} color="#F59E0B" />
        <KpiCard label="Avg TAT" value={a.avgTatHours ? `${a.avgTatHours}h` : '—'} icon={Clock} color="#8B5CF6" sub="hours to delivery" />
        <KpiCard label="Home Collections" value={a.homeCollections ?? 0} icon={Home} color="#06B6D4" />
      </div>

      {/* Revenue & Volume trend chart */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-bold text-slate-900 mb-5">Revenue & Order Trend — {PERIODS.find(p => p.v === period)?.label}</h3>
        {trend.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-slate-400">
            <p className="text-sm">No trend data available for this period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={NAVY} stopOpacity={0.15} /><stop offset="95%" stopColor={NAVY} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="og" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={TEAL} stopOpacity={0.15} /><stop offset="95%" stopColor={TEAL} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={(v: string) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
              <Area type="monotone" dataKey="orders" name="Orders" stroke={NAVY} strokeWidth={2.5} fill="url(#rg)" dot={false} />
              <Area type="monotone" dataKey="delivered" name="Delivered" stroke={TEAL} strokeWidth={2} fill="url(#og)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Status distribution + Automation ROI */}
      <div className="grid grid-cols-2 gap-5">
        {/* Status pie */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-bold text-slate-900 mb-4">Order Status Distribution</h3>
          {statusDist.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data</div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={statusDist} cx="50%" cy="50%" innerRadius={40} outerRadius={70}
                    paddingAngle={2} dataKey="value">
                    {statusDist.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11, border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {statusDist.map((s: any, i: number) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-slate-600 font-medium">{s.name}</span>
                    </span>
                    <span className="font-black text-slate-900">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Revenue Engine ROI */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" /> Revenue Engine Performance
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Messages Sent', value: automationStats.SENT ?? 0, color: '#3B82F6' },
              { label: 'Bookings Converted', value: automationStats.CONVERTED ?? 0, color: TEAL },
              { label: 'Opted Out', value: automationStats.OPTED_OUT ?? 0, color: '#94A3B8' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="text-sm text-slate-600 w-36">{s.label}</span>
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${automationStats.SENT > 0 ? Math.min(s.value / automationStats.SENT * 100, 100) : 0}%`, background: s.color }} />
                </div>
                <span className="text-sm font-black text-slate-900 w-10 text-right">{s.value}</span>
              </div>
            ))}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <p className="text-sm text-slate-600">Conversion Rate</p>
              <p className="text-2xl font-black" style={{ color: convRate > 15 ? TEAL : convRate > 5 ? '#F59E0B' : '#94A3B8' }}>
                {convRate}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* TAT compliance + Critical alerts */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            title: 'Critical Value Alerts',
            value: a.criticalAlerts ?? d.criticalUnacked ?? 0,
            sub: 'in selected period',
            icon: AlertTriangle,
            color: '#EF4444',
          },
          {
            title: 'TAT Compliance',
            value: a.avgTatHours ? `${Math.max(0, Math.round((1 - a.avgTatHours/24) * 100))}%` : '—',
            sub: 'orders delivered on time',
            icon: Clock,
            color: '#8B5CF6',
          },
          {
            title: 'Home Collections',
            value: a.homeCollections ?? 0,
            sub: 'total in period',
            icon: Home,
            color: '#06B6D4',
          },
        ].map(s => (
          <div key={s.title} className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}14` }}>
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <p className="text-sm font-bold text-slate-700">{s.title}</p>
            </div>
            <p className="text-3xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
