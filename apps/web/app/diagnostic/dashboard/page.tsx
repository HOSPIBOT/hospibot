'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import {
  FlaskConical, Clock, CheckCircle2, AlertTriangle, TrendingUp,
  Home, Users, RefreshCw, ArrowUpRight, Activity,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const NAV_COLOR = '#1E3A5F';

export default function DiagnosticDashboard() {
  const [stats, setStats]   = useState<any>(null);
  const [trend, setTrend]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/lab/dashboard').catch(() => ({ data: {} })),
      api.get('/lab/trend?days=14').catch(() => ({ data: [] })),
    ]).then(([s, t]) => {
      setStats(s.data);
      setTrend(Array.isArray(t.data) ? t.data : []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Diagnostic Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time lab operations</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: "Today's Orders",  value: stats?.todayOrders ?? 0, icon: FlaskConical,  color: NAV_COLOR },
            { label: 'Pending',         value: stats?.pending ?? 0,     icon: Clock,         color: '#F59E0B' },
            { label: 'Reports Ready',   value: stats?.completed ?? 0,   icon: CheckCircle2,  color: '#10B981' },
            { label: 'Today Revenue',   value: formatINR(stats?.todayRevenue ?? 0), icon: TrendingUp, color: '#3B82F6' },
            { label: 'Urgent',          value: stats?.urgent ?? 0,      icon: AlertTriangle, color: '#EF4444' },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${k.color}15` }}>
                  <k.icon className="w-4 h-4" style={{ color: k.color }} />
                </div>
                <p className="text-xs text-slate-500">{k.label}</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">{k.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Order Volume — Last 14 Days</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={trend} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="og" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={NAV_COLOR} stopOpacity={0.2} />
                <stop offset="95%" stopColor={NAV_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
              tickFormatter={(v: string) => v.slice(5)} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
            <Area type="monotone" dataKey="orders" name="Orders" stroke={NAV_COLOR} strokeWidth={2.5} fill="url(#og)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { href: '/diagnostic/lab-orders', label: 'Lab Orders',      icon: FlaskConical, color: NAV_COLOR },
          { href: '/diagnostic/collection', label: 'Home Collection',  icon: Home,         color: '#8B5CF6' },
          { href: '/diagnostic/patients',   label: 'Patients',         icon: Users,        color: '#10B981' },
          { href: '/diagnostic/catalog',    label: 'Test Catalog',     icon: Activity,     color: '#F59E0B' },
        ].map(link => (
          <a key={link.href} href={link.href}
            className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all group flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${link.color}15` }}>
              <link.icon className="w-5 h-5" style={{ color: link.color }} />
            </div>
            <p className="font-semibold text-slate-900 text-sm group-hover:text-[#1E3A5F] transition-colors">{link.label}</p>
            <ArrowUpRight className="w-4 h-4 text-slate-300 ml-auto" />
          </a>
        ))}
      </div>
    </div>
  );
}
