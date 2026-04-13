'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import { RefreshCw, TrendingUp, Users, Calendar, CheckCircle2, Home, Truck, Clock } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';

const NAV = '#6B21A8';
const COLORS = ['#6B21A8','#8B5CF6','#A78BFA','#C4B5FD','#DDD6FE'];

export default function HomecareAnalyticsPage() {
  const [stats,   setStats]   = useState<any>(null);
  const [trend,   setTrend]   = useState<any[]>([]);
  const [staff,   setStaff]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period,  setPeriod]  = useState<'week'|'month'>('month');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const days = period === 'week' ? 7 : 30;
      const [s, t, staffRes, bookedRes] = await Promise.all([
        api.get('/analytics/dashboard').catch(() => ({ data: {} })),
        api.get(`/analytics/appointments?days=${days}`).catch(() => ({ data: [] })),
        api.get('/doctors', { params: { limit: 20 } }).catch(() => ({ data: { data: [] } })),
        api.get('/appointments', { params: { type: 'HOME_VISIT', limit: 200, status: 'COMPLETED' } }).catch(() => ({ data: { data: [] } })),
      ]);
      setStats(s.data);
      setTrend(Array.isArray(t.data) ? t.data : []);
      setStaff(staffRes.data?.data ?? []);

      // Build service-type breakdown from completed visits
      const visits: any[] = bookedRes.data?.data ?? [];
      const serviceMap: Record<string, number> = {};
      visits.forEach(v => {
        const m = v.notes?.match(/Service:\s*([^\n]+)/);
        const type = m?.[1]?.trim() || 'General';
        serviceMap[type] = (serviceMap[type] || 0) + 1;
      });
      // Store in stats for chart
      setStats((prev: any) => ({
        ...(prev ?? {}),
        serviceBreakdown: Object.entries(serviceMap)
          .sort(([,a],[,b]) => (b as number) - (a as number))
          .slice(0, 5)
          .map(([name, value]) => ({ name, value })),
        totalVisits: visits.length,
      }));
    } catch { } finally { setLoading(false); }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const d = stats ?? {};
  const completionRate = d.totalVisits && d.monthAppointments
    ? Math.round((d.totalVisits / d.monthAppointments) * 100)
    : null;

  const activeStaff  = staff.filter(s => s.isAvailable).length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Home Care Analytics</h1>
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

      {/* KPI row */}
      {loading ? (
        <div className="grid grid-cols-4 gap-4">{Array.from({length:4}).map((_,i) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-24"/>)}</div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {[
            { l: 'Monthly Revenue',    v: formatINR(d.monthRevenue ?? 0),     icon: TrendingUp,    color: '#10B981' },
            { l: 'Active Clients',     v: d.totalPatients ?? 0,               icon: Users,         color: NAV       },
            { l: `Visits (${period})`, v: d.monthAppointments ?? 0,           icon: Calendar,      color: '#3B82F6' },
            { l: 'Completion Rate',    v: completionRate !== null ? `${completionRate}%` : '—', icon: CheckCircle2, color: '#F59E0B' },
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
      )}

      {/* Visit trend + service breakdown */}
      <div className="grid grid-cols-3 gap-4">

        {/* Trend chart — 2/3 width */}
        <div className="col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Visit Trends</h3>
          {trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trend} margin={{top:0,right:0,left:-10,bottom:0}}>
                <defs>
                  <linearGradient id="hcGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={NAV} stopOpacity={0.15}/>
                    <stop offset="95%" stopColor={NAV} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="date" tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false}
                  tickFormatter={(v:string) => v?.slice(5) || v}/>
                <YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{borderRadius:12,border:'none',fontSize:12}}/>
                <Area type="monotone" dataKey="count" name="Visits" stroke={NAV} strokeWidth={2.5} fill="url(#hcGrad)"/>
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-300 text-sm">No visit data yet</div>
          )}
        </div>

        {/* Service type pie — 1/3 width */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">By Service Type</h3>
          {d.serviceBreakdown?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={d.serviceBreakdown} cx="50%" cy="50%" outerRadius={58} dataKey="value">
                    {d.serviceBreakdown.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]}/>
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius:10,border:'none',fontSize:11}}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {d.serviceBreakdown.map((s: any, i: number) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{background: COLORS[i % COLORS.length]}}/>
                      <span className="text-slate-600 truncate max-w-[110px]">{s.name}</span>
                    </div>
                    <span className="font-semibold text-slate-900">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-32 flex items-center justify-center text-slate-300 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Staff dispatch status */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Staff Dispatch Status</h3>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400"/>{activeStaff} available</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-300"/>{staff.length - activeStaff} unavailable</span>
          </div>
        </div>
        {loading ? (
          <div className="space-y-2">{Array.from({length:4}).map((_,i) => <div key={i} className="animate-pulse bg-slate-100 rounded-xl h-10"/>)}</div>
        ) : staff.length === 0 ? (
          <div className="py-8 text-center text-slate-300 text-sm">
            <Truck className="w-8 h-8 mx-auto mb-2"/>No staff added yet
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {staff.slice(0, 8).map(s => {
              const name = s.user ? `${s.user.firstName} ${s.user.lastName || ''}`.trim() : 'Staff';
              const initials = name.split(' ').map((n:string) => n[0]).join('').slice(0,2).toUpperCase();
              return (
                <div key={s.id} className="flex items-center gap-2.5 bg-slate-50 rounded-xl p-3">
                  <div className="w-8 h-8 rounded-lg text-white text-xs font-bold flex items-center justify-center flex-shrink-0"
                    style={{ background: NAV }}>
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${s.isAvailable ? 'bg-emerald-400' : 'bg-slate-300'}`}/>
                      <span className="text-[10px] text-slate-400">{s.isAvailable ? 'Available' : 'Busy'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { href: '/homecare/bookings', icon: Calendar, label: 'View Bookings',     color: '#3B82F6' },
          { href: '/homecare/patients', icon: Users,    label: 'Client List',       color: NAV       },
          { href: '/homecare/staff',    icon: Truck,    label: 'Staff Dispatch',    color: '#10B981' },
        ].map(link => (
          <a key={link.href} href={link.href}
            className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 hover:shadow-md transition-all group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${link.color}15` }}>
              <link.icon className="w-5 h-5" style={{ color: link.color }} />
            </div>
            <p className="font-semibold text-sm text-slate-700 group-hover:text-slate-900">{link.label}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
