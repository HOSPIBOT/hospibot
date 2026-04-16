'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import {
  Users, Calendar, Package, TrendingUp, ArrowUpRight,
  Heart, Star, RefreshCw, Clock,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const NAV_COLOR = '#BE185D';

export default function WellnessDashboard() {
  const [stats,   setStats]   = useState<any>(null);
  const [trend,   setTrend]   = useState<any[]>([]);
  const [recent,  setRecent]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/analytics/dashboard').catch(() => ({ data: {} })),
      api.get('/analytics/revenue/trend').catch(() => ({ data: [] })),
      api.get('/appointments', { params: { limit: 5, sort: 'desc' } }).catch(() => ({ data: { data: [] } })),
    ]).then(([statsRes, trendRes, recentRes]) => {
      setStats(statsRes.data ?? {});
      const raw = Array.isArray(trendRes.data) ? trendRes.data : (trendRes.data?.data ?? []);
      setTrend(raw.slice(-7).map((d: any) => ({
        day:      d.day ?? d.date ?? d.month ?? '',
        sessions: d.count ?? d.sessions ?? d.total ?? 0,
      })));
      setRecent(recentRes.data?.data ?? []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const d = stats ?? {};
  const KPI_CARDS = [
    { label: 'Active Members',    value: d.totalPatients ?? d.activePatients ?? '—', icon: Users,    color: NAV_COLOR  },
    { label: "Today's Sessions",  value: d.todayAppointments ?? d.todayTotal ?? '—', icon: Calendar, color: '#8B5CF6'  },
    { label: 'Renewals Due',      value: d.pendingFollowups ?? '—',                  icon: Star,     color: '#F59E0B'  },
    { label: 'Month Revenue',     value: d.monthRevenue ? formatINR(d.monthRevenue) : '—', icon: TrendingUp, color: '#10B981' },
  ];

  const STATUS_COLORS: Record<string, string> = {
    PENDING:   'bg-amber-100 text-amber-700',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Wellness Dashboard</h1>
        <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPIs */}
      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map((i: any) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {KPI_CARDS.map((k: any) => (
            <div key={k.label} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <k.icon className="w-4 h-4" style={{ color: k.color }} />
                <p className="text-xs text-slate-500">{k.label}</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">{k.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Chart + Recent sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Weekly Sessions</h3>
          {trend.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              {loading ? 'Loading…' : 'No trend data yet'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={trend} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="wellnessGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={NAV_COLOR} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={NAV_COLOR} stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
                <Area type="monotone" dataKey="sessions" stroke={NAV_COLOR} strokeWidth={2.5} fill="url(#wellnessGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Recent Sessions</h3>
            <a href="/wellness/bookings" className="text-xs font-semibold text-pink-600 hover:text-pink-800 flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map((i: any) => <div key={i} className="animate-pulse bg-slate-100 rounded-xl h-12" />)}</div>
          ) : recent.length === 0 ? (
            <div className="py-8 text-center">
              <Heart className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No sessions yet</p>
            </div>
          ) : recent.map((a: any) => (
            <div key={a.id} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
              <div className="w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: NAV_COLOR }}>
                {a.patient?.firstName?.[0]}{a.patient?.lastName?.[0] || ''}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {a.patient?.firstName} {a.patient?.lastName || ''}
                </p>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> {a.scheduledAt?.slice(11, 16) ?? '—'}
                </p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[a.status] ?? 'bg-slate-100 text-slate-600'}`}>
                {a.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { href: '/wellness/members',  label: 'Members',   icon: Users,    color: NAV_COLOR  },
          { href: '/wellness/bookings', label: 'Sessions',  icon: Calendar, color: '#8B5CF6'  },
          { href: '/wellness/products', label: 'Products',  icon: Package,  color: '#10B981'  },
          { href: '/wellness/analytics',label: 'Analytics', icon: Heart,    color: '#F59E0B'  },
        ].map((l: any) => (
          <a key={l.href} href={l.href}
            className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all group flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${l.color}15` }}>
              <l.icon className="w-5 h-5" style={{ color: l.color }} />
            </div>
            <p className="font-semibold text-slate-900 text-sm group-hover:text-pink-700 transition-colors">{l.label}</p>
            <ArrowUpRight className="w-4 h-4 text-slate-300 ml-auto" />
          </a>
        ))}
      </div>
    </div>
  );
}
