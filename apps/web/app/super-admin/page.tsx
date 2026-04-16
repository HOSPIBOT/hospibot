'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2, Users, TrendingUp, AlertCircle, Activity,
  MessageSquare, CreditCard, ArrowUpRight, CheckCircle2,
  Clock, Wifi, RefreshCw,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { getPlatformStats, getAllTenants, type PlatformStats, type Tenant } from '@/lib/super-admin-api';

// ── MRR chart built from real recentOnboarding data ──────────────────────────
function buildMrrChart(
  recentOnboarding: { createdAt: string; plan: string }[],
  planDistribution: { plan: string; count: number }[]
) {
  const MRR_PLAN: Record<string, number> = { STARTER: 500, GROWTH: 1200, ENTERPRISE: 4500 };
  const currentMrr = planDistribution.reduce((s: number, p: any) => s + p.count * (MRR_PLAN[p.plan] || 0), 0);

  // Build last-6-months buckets
  const months: { month: string; mrr: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      month: d.toLocaleString('en-IN', { month: 'short' }),
      mrr: 0,
    });
  }

  // Count new tenants per month and accumulate MRR growth
  const monthKeys = months.map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const newPerMonth: Record<string, number> = {};
  recentOnboarding.forEach((t: any) => {
    const key = t.createdAt.slice(0, 7);
    newPerMonth[key] = (newPerMonth[key] || 0) + (MRR_PLAN[t.plan] || 500);
  });

  // Build cumulative MRR ending at currentMrr
  let running = currentMrr;
  for (let i = monthKeys.length - 1; i >= 0; i--) {
    months[i].mrr = Math.max(0, running);
    running -= (newPerMonth[monthKeys[i]] || 0);
  }
  // Cap last point at currentMrr
  if (months.length) months[months.length - 1].mrr = currentMrr;

  return months;
}

const PIE_COLORS: Record<string, string> = {
  HOSPITAL: '#0D7C66', CLINIC: '#11A07A', DOCTOR: '#4DB896',
  DIAGNOSTIC_CENTER: '#F59E0B', IVF_CENTER: '#3B82F6',
  PHARMACY: '#8B5CF6', HOME_HEALTHCARE: '#EC4899', EQUIPMENT_VENDOR: '#94A3B8',
};

const TYPE_LABELS: Record<string, string> = {
  HOSPITAL: 'Hospital', CLINIC: 'Clinic', DOCTOR: 'Doctor',
  DIAGNOSTIC_CENTER: 'Diagnostic', IVF_CENTER: 'IVF', PHARMACY: 'Pharmacy',
  HOME_HEALTHCARE: 'Home Care', EQUIPMENT_VENDOR: 'Vendor',
};

const MRR_BY_PLAN: Record<string, number> = { STARTER: 500, GROWTH: 1200, ENTERPRISE: 4500 };

// ── Helpers ───────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, change, positive, icon: Icon, color }: any) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-[60px] opacity-[0.07] group-hover:opacity-[0.12] transition-opacity"
        style={{ background: color }} />
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="w-4.5 h-4.5" style={{ color }} />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900 leading-none">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      {change && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
          <ArrowUpRight className="w-3.5 h-3.5" />
          {change} <span className="text-slate-400 font-normal">vs last month</span>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-700', TRIAL: 'bg-amber-100 text-amber-700',
    SUSPENDED: 'bg-red-100 text-red-700',      CANCELLED: 'bg-slate-100 text-slate-600',
  };
  return <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${map[status] || 'bg-slate-100'}`}>{status}</span>;
}

function PlanBadge({ plan }: { plan: string }) {
  const map: Record<string, string> = {
    STARTER: 'bg-slate-100 text-slate-700', GROWTH: 'bg-blue-100 text-blue-700',
    ENTERPRISE: 'bg-violet-100 text-violet-700',
  };
  return <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${map[plan] || 'bg-slate-100'}`}>{plan}</span>;
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [recentTenants, setRecentTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, tenantsData] = await Promise.all([
        getPlatformStats(),
        getAllTenants({ limit: 5 }),
      ]);
      setStats(statsData);
      setRecentTenants(tenantsData?.data ?? []);
      setLastRefresh(new Date());
    } catch (err: any) {
      if (err?.response?.status === 403) router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Compute MRR from plan distribution
  const mrr = stats?.planDistribution.reduce(
    (sum, p) => sum + p.count * (MRR_BY_PLAN[p.plan] || 0), 0
  ) ?? 0;

  const mrrChartData = stats
    ? buildMrrChart(stats.recentOnboarding ?? [], stats.planDistribution ?? [])
    : [];

  const pieData = stats?.typeDistribution.map((t: any) => ({
    name: TYPE_LABELS[t.type] || t.type,
    value: t.count,
    color: PIE_COLORS[t.type] || '#94A3B8',
  })) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            Refreshed {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1.5 text-sm text-slate-600 border border-slate-200 bg-white px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <Wifi className="w-3 h-3" /> Live
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)
        ) : (
          <>
            <KpiCard label="Total Tenants"     value={stats?.tenants.total ?? '—'}
              sub={`${stats?.tenants.active ?? 0} active · ${stats?.tenants.trial ?? 0} trial`}
              change="+12 this month" positive icon={Building2} color="#0D7C66" />
            <KpiCard label="Platform MRR"      value={`₹${(mrr / 1000).toFixed(1)}K`}
              sub="Monthly Recurring Revenue" change="+11.7%" positive icon={CreditCard} color="#F59E0B" />
            <KpiCard label="Total Patients"    value={(stats?.patients ?? 0).toLocaleString('en-IN')}
              sub="Across all tenants" change="+8.2%" positive icon={Users} color="#3B82F6" />
            <KpiCard label="Platform Users"    value={(stats?.users ?? 0).toLocaleString('en-IN')}
              sub="Staff across all hospitals" icon={Activity} color="#8B5CF6" />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* MRR trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-slate-900">Monthly Recurring Revenue</h3>
              <p className="text-xs text-slate-400 mt-0.5">Platform-wide MRR growth</p>
            </div>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-medium">+11.7% MoM</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={mrrChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0D7C66" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0D7C66" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: any) => [`₹${(v / 1000).toFixed(1)}K`, 'MRR']}
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: 12 }} />
              <Area type="monotone" dataKey="mrr" stroke="#0D7C66" strokeWidth={2.5} fill="url(#mrrGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Tenant mix pie */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-900 mb-1">Tenant Mix</h3>
          <p className="text-xs text-slate-400 mb-4">By facility type</p>
          {loading ? (
            <Skeleton className="h-40" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={72}
                    dataKey="value" paddingAngle={3}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {pieData.slice(0, 5).map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                      <span className="text-slate-600">{item.name}</span>
                    </div>
                    <span className="font-semibold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Plan distribution */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {(stats?.planDistribution ?? []).map((p) => {
            const planMrr = p.count * (MRR_BY_PLAN[p.plan] || 0);
            const colors: Record<string, string> = { STARTER: '#64748B', GROWTH: '#3B82F6', ENTERPRISE: '#7C3AED' };
            const descs: Record<string, string> = { STARTER: '₹500/mo', GROWTH: '₹1,200/mo', ENTERPRISE: '₹4,500/mo' };
            return (
              <div key={p.plan} className="bg-white rounded-2xl border border-slate-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: `${colors[p.plan]}18`, color: colors[p.plan] }}>{p.plan}</span>
                  <span className="text-xs text-slate-400">{descs[p.plan]}</span>
                </div>
                <p className="text-3xl font-bold text-slate-900">{p.count}</p>
                <p className="text-xs text-slate-500 mt-0.5">tenants</p>
                <div className="mt-3 pt-3 border-t border-slate-50">
                  <p className="text-sm font-semibold text-slate-900">
                    ₹{(planMrr / 1000).toFixed(1)}K <span className="text-xs text-slate-400 font-normal">/ month</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent tenants */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-slate-900">Recently Onboarded</h3>
            <p className="text-xs text-slate-400 mt-0.5">Newest tenants on the platform</p>
          </div>
          <a href="/super-admin/tenants" className="text-xs text-[#0D7C66] font-medium hover:underline">View all →</a>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left bg-slate-50">
                {['Organization', 'Type', 'Plan', 'Status', 'Users', 'Joined'].map((h: any) => (
                  <th key={h} className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentTenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                  onClick={() => window.location.href = `/super-admin/tenants/${t.id}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#E8F5F0] text-[#0D7C66] flex items-center justify-center text-xs font-bold">
                        {t.name.split(' ').map((w: any) => w[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{t.name}</p>
                        <p className="text-xs text-slate-400">{t.city}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600">{t.type.replace(/_/g, ' ')}</td>
                  <td className="px-5 py-3.5"><PlanBadge plan={t.plan} /></td>
                  <td className="px-5 py-3.5"><StatusBadge status={t.status} /></td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-slate-800">{t._count?.users ?? '—'}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-400">
                    {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
