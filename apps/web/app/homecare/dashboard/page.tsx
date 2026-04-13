'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import {
  Home, Users, Calendar, Activity, ArrowUpRight, TrendingUp,
  CheckCircle2, Clock, RefreshCw, MapPin, AlertTriangle,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const NAV_COLOR = '#6B21A8';

interface Stats {
  activePatients : number;
  todayVisits    : number;
  pendingVisits  : number;
  completedToday : number;
  staffDeployed  : number;
  monthRevenue   : number;
}

export default function HomecareDashboard() {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [trend,   setTrend]   = useState<any[]>([]);
  const [recent,  setRecent]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/appointments/today/stats').catch(() => ({ data: {} })),
      api.get('/appointments', { params: { type: 'HOME_VISIT', limit: 4, sort: 'desc' } }).catch(() => ({ data: { data: [] } })),
      api.get('/analytics/revenue/trend').catch(() => ({ data: [] })),
      api.get('/patients', { params: { limit: 1 } }).catch(() => ({ data: { meta: { total: 0 } } })),
    ]).then(([todayRes, recentRes, trendRes, patientsRes]) => {
      const t = todayRes.data ?? {};
      setStats({
        activePatients : patientsRes.data?.meta?.total ?? 0,
        todayVisits    : t.total ?? t.todayTotal ?? 0,
        pendingVisits  : t.pending ?? 0,
        completedToday : t.completed ?? 0,
        staffDeployed  : t.doctors ?? t.staffCount ?? 0,
        monthRevenue   : t.monthRevenue ?? 0,
      });
      setRecent(recentRes.data?.data ?? []);
      const trendRaw = Array.isArray(trendRes.data) ? trendRes.data : trendRes.data?.data ?? [];
      setTrend(trendRaw.slice(-14).map((d: any) => ({
        date  : d.date ?? d.day ?? '',
        visits: d.count ?? d.visits ?? d.total ?? 0,
      })));
    }).finally(() => setLoading(false));
  }, []);

  const reload = () => { setLoading(true); setStats(null); };

  const KPI_CARDS = stats ? [
    { label: 'Active Clients',  value: stats.activePatients,          icon: Users,        color: NAV_COLOR  },
    { label: "Today's Visits",  value: stats.todayVisits,             icon: Home,         color: '#3B82F6'  },
    { label: 'Pending',         value: stats.pendingVisits,           icon: Clock,        color: '#F59E0B'  },
    { label: 'Completed Today', value: stats.completedToday,          icon: CheckCircle2, color: '#10B981'  },
    { label: 'Staff Active',    value: stats.staffDeployed,           icon: Activity,     color: '#8B5CF6'  },
    { label: 'Month Revenue',   value: formatINR(stats.monthRevenue), icon: TrendingUp,   color: '#0EA5E9'  },
  ] : [];

  const STATUS_COLORS: Record<string, string> = {
    PENDING:     'bg-amber-100 text-amber-700',
    CONFIRMED:   'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-purple-100 text-purple-700',
    COMPLETED:   'bg-emerald-100 text-emerald-700',
    CANCELLED:   'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Home Care</h1>
        <button
          onClick={reload}
          className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPI grid */}
      {loading ? (
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
          {KPI_CARDS.map(k => (
            <div key={k.label} className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-1.5 mb-2">
                <k.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: k.color }} />
                <p className="text-[11px] text-slate-500 truncate">{k.label}</p>
              </div>
              <p className="text-xl font-bold text-slate-900 truncate">{k.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Chart + Recent visits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Trend chart */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Daily Home Visits — Last 14 Days</h3>
          {trend.length === 0 ? (
            <div className="h-48 flex items-center justify-center">
              <p className="text-slate-400 text-sm">
                {loading ? 'Loading…' : 'No trend data available'}
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trend} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="hcGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={NAV_COLOR} stopOpacity={0.20} />
                    <stop offset="95%" stopColor={NAV_COLOR} stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date"  tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="visits" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
                <Area type="monotone" dataKey="visits" stroke={NAV_COLOR} strokeWidth={2.5} fill="url(#hcGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent visits list */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Recent Home Visits</h3>
            <a href="/homecare/visits"
              className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="animate-pulse bg-slate-100 rounded-xl h-14" />)}
            </div>
          ) : recent.length === 0 ? (
            <div className="py-10 text-center">
              <Home className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No visits yet today</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recent.map((v: any) => (
                <div key={v.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: NAV_COLOR }}>
                    {v.patient?.firstName?.[0]}{v.patient?.lastName?.[0] || 'H'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {v.patient?.firstName} {v.patient?.lastName || ''}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      {v.patient?.address && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                          {v.patient.address}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    STATUS_COLORS[v.status] ?? 'bg-slate-100 text-slate-600'
                  }`}>
                    {v.status?.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick-nav tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { href: '/homecare/bookings', label: 'Bookings',     icon: Calendar, color: NAV_COLOR  },
          { href: '/homecare/staff',    label: 'Staff Dispatch',icon: Users,   color: '#3B82F6'  },
          { href: '/homecare/visits',   label: 'Home Visits',  icon: Home,     color: '#10B981'  },
          { href: '/homecare/patients', label: 'Clients',      icon: Activity, color: '#F59E0B'  },
        ].map(l => (
          <a key={l.href} href={l.href}
            className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all group flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${l.color}15` }}>
              <l.icon className="w-5 h-5" style={{ color: l.color }} />
            </div>
            <p className="font-semibold text-slate-900 text-sm group-hover:text-purple-700 transition-colors">
              {l.label}
            </p>
            <ArrowUpRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-purple-400 transition-colors" />
          </a>
        ))}
      </div>
    </div>
  );
}
