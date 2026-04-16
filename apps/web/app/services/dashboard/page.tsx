'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { FALLBACK_THEMES } from '@/lib/portal/portal-types';
import { formatINR } from '@/lib/utils';
import {
  FileText, Users, CreditCard, MessageSquare,
  ArrowUpRight, TrendingUp, AlertTriangle, RefreshCw,
  CheckCircle2, Clock,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const THEME = '#334155';

function KpiCard({ label, value, sub, change, icon: Icon, color }: any) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 relative overflow-hidden hover:shadow-md transition-shadow">
      <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-[50px] opacity-[0.06]" style={{ background: color }} />
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900 leading-none">
        {value ?? <span className="animate-pulse text-slate-300 text-2xl">—</span>}
      </p>
      {sub    && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      {change && (
        <div className="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-600">
          <ArrowUpRight className="w-3.5 h-3.5" />{change}
          <span className="text-slate-400 font-normal">vs last month</span>
        </div>
      )}
    </div>
  );
}

export default function ServicesDashboard() {
  const { user, tenant } = useAuthStore();
  const theme  = FALLBACK_THEMES['services'];
  const hour   = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const [kpis,    setKpis]    = useState<any>(null);
  const [trend,   setTrend]   = useState<any[]>([]);
  const [recent,  setRecent]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/billing/invoices', { params: { limit: 100 } }).catch(() => ({ data: { data: [] } })),
      api.get('/analytics/revenue/trend').catch(() => ({ data: [] })),
      api.get('/billing/invoices', { params: { limit: 5, sort: 'desc' } }).catch(() => ({ data: { data: [] } })),
      api.get('/whatsapp/conversations', { params: { limit: 1 } }).catch(() => ({ data: { meta: { total: 0 } } })),
    ]).then(([allInv, trendRes, recentInv, waRes]) => {
      const invoices: any[] = allInv.data?.data ?? [];
      const paid      = invoices.filter((i: any) => i.status === 'PAID');
      const pending   = invoices.filter((i: any) => i.status === 'PENDING');
      const overdue   = invoices.filter((i: any) => i.status === 'OVERDUE');
      const collected = paid.reduce((s: any, i: any) => s + (i.totalAmount ?? 0), 0);
      const outstanding = [...pending, ...overdue].reduce((s: any, i: any) => s + (i.totalAmount ?? 0), 0);

      setKpis({
        activeContracts : invoices.length,
        collected       : formatINR(collected),
        outstanding     : formatINR(outstanding),
        overdue         : overdue.length,
        waMessages      : waRes.data?.meta?.total ?? 0,
      });

      const raw = Array.isArray(trendRes.data) ? trendRes.data : (trendRes.data?.data ?? []);
      setTrend(raw.slice(-7).map((d: any) => ({
        month : d.month ?? d.date?.slice(0, 7) ?? '',
        value : d.revenue ?? d.total ?? d.amount ?? 0,
      })));

      setRecent(recentInv.data?.data ?? []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const STATUS_CLR: Record<string, string> = {
    PAID:    'bg-emerald-100 text-emerald-700',
    PENDING: 'bg-amber-100 text-amber-700',
    OVERDUE: 'bg-red-100 text-red-700',
  };

  const clientName = (inv: any) =>
    (inv.patientName ?? `${inv.patient?.firstName ?? ''} ${inv.patient?.lastName ?? ''}`.trim()) || 'Client';

  return (
    <div className="space-y-6">

      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{greeting}, {user?.firstName} 👋</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {tenant?.name} &bull; {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Active Contracts"  value={kpis?.activeContracts} sub="Total invoices raised"     icon={FileText}      color={THEME}     />
        <KpiCard label="Collected"         value={kpis?.collected}       sub="From paid invoices"        icon={CreditCard}    color="#10B981"   />
        <KpiCard label="Outstanding"       value={kpis?.outstanding}     sub="Pending + overdue"         icon={AlertTriangle} color="#F59E0B"   />
        <KpiCard label="Overdue Invoices"  value={kpis?.overdue}         sub="Needs immediate follow-up" icon={Clock}         color="#EF4444"   />
      </div>

      {/* Chart + Recent invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Revenue trend */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Revenue Trend</h3>
            {trend.length > 0 && (
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                Live
              </span>
            )}
          </div>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-pulse text-slate-300 text-sm">Loading…</div>
            </div>
          ) : trend.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              No revenue data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={trend} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="svcGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={theme.primaryColor} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={theme.primaryColor} stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }}
                  formatter={(v: any) => [formatINR(v), 'Revenue']}
                />
                <Area type="monotone" dataKey="value" stroke={theme.primaryColor} strokeWidth={2.5} fill="url(#svcGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent invoices */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Recent Invoices</h3>
            <a href="/services/billing"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map((i: any) => <div key={i} className="animate-pulse bg-slate-100 rounded-xl h-12" />)}</div>
          ) : recent.length === 0 ? (
            <div className="py-10 text-center">
              <FileText className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No invoices yet</p>
            </div>
          ) : recent.map((inv: any) => (
            <div key={inv.id} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: `${THEME}10`, color: THEME }}>
                {clientName(inv)[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{clientName(inv)}</p>
                <p className="text-xs text-slate-400">{formatINR(inv.totalAmount ?? 0)}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_CLR[inv.status] ?? 'bg-slate-100 text-slate-600'}`}>
                {inv.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { href: '/services/contracts', label: 'Contracts',   icon: FileText,      color: THEME      },
          { href: '/services/billing',   label: 'Billing',     icon: CreditCard,    color: '#10B981'  },
          { href: '/services/staff',     label: 'Field Staff', icon: Users,         color: '#8B5CF6'  },
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
