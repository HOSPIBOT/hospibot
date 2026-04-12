'use client';

import { useAuthStore } from '@/lib/store';
import { FALLBACK_THEMES } from '@/lib/portal/portal-types';
import { Users, Calendar, Package, MessageSquare, ArrowUpRight, TrendingUp, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const revenueData = [
  { month: 'Oct', value: 180000 }, { month: 'Nov', value: 210000 },
  { month: 'Dec', value: 195000 }, { month: 'Jan', value: 240000 },
  { month: 'Feb', value: 268000 }, { month: 'Mar', value: 295000 },
  { month: 'Apr', value: 318000 },
];

function KpiCard({ label, value, sub, change, icon: Icon, color }: any) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 relative overflow-hidden hover:shadow-md transition-shadow">
      <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-[50px] opacity-[0.07]" style={{ background: color }} />
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="w-4.5 h-4.5" style={{ color }} />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900 leading-none">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      {change && (
        <div className="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-600">
          <ArrowUpRight className="w-3.5 h-3.5" />{change}
          <span className="text-slate-400 font-normal">vs last week</span>
        </div>
      )}
    </div>
  );
}

export default function WellnessDashboard() {
  const { user, tenant } = useAuthStore();
  const theme = FALLBACK_THEMES['wellness'];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{greeting}, {user?.firstName} 👋</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {tenant?.name} &bull; {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label=Active Members value="1,248" sub="84 new this month" change={"+7%"} icon={Users} color="#E11D48" />
        <KpiCard label=Classes Today value="16" sub="284 check-ins" change={"+2"} icon={Calendar} color="#EAB308" />
        <KpiCard label=Product Sales value="₹84K" sub="48 orders" change={"+19%"} icon={Package} color="#3B82F6" />
        <KpiCard label=WhatsApp Renewals value="34" sub="Memberships due"  icon={MessageSquare} color="#25D366" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Performance Trend</h3>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">+7.8% MoM</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="wellnessGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.primaryColor} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={theme.primaryColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
              <Area type="monotone" dataKey="value" stroke={theme.primaryColor} strokeWidth={2.5} fill="url(#wellnessGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-center">
          <div className="text-center text-slate-400">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">More analytics coming soon</p>
            <p className="text-xs mt-1">WhatsApp automation, patient insights &amp; more</p>
          </div>
        </div>
      </div>
    </div>
  );
}
