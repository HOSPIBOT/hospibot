'use client';

import { useAuthStore } from '@/lib/store';
import { FALLBACK_THEMES } from '@/lib/portal/portal-types';
import { api } from '@/lib/api';
import { useState, useEffect } from 'react';
import {
  Calendar, Users, MessageSquare, TrendingUp, Clock,
  CheckCircle2, ArrowUpRight, Activity, Stethoscope, Zap,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';

const weekData = [
  { day: 'Mon', appointments: 42, revenue: 38400 },
  { day: 'Tue', appointments: 58, revenue: 52100 },
  { day: 'Wed', appointments: 35, revenue: 29800 },
  { day: 'Thu', appointments: 61, revenue: 57300 },
  { day: 'Fri', appointments: 49, revenue: 44200 },
  { day: 'Sat', appointments: 38, revenue: 34100 },
  { day: 'Sun', appointments: 21, revenue: 18700 },
];

const revenueData = [
  { month: 'Oct', revenue: 284000 }, { month: 'Nov', revenue: 312000 },
  { month: 'Dec', revenue: 298000 }, { month: 'Jan', revenue: 345000 },
  { month: 'Feb', revenue: 367000 }, { month: 'Mar', revenue: 412000 },
  { month: 'Apr', revenue: 438000 },
];

const liveQueue = [
  { token: 'T-001', patient: 'Ramesh Kumar',    doctor: 'Dr. Priya Sharma', status: 'in-progress', wait: 0 },
  { token: 'T-002', patient: 'Sunita Reddy',    doctor: 'Dr. Priya Sharma', status: 'waiting',     wait: 12 },
  { token: 'T-003', patient: 'Arjun Mehta',     doctor: 'Dr. Vikram Nair',  status: 'waiting',     wait: 28 },
  { token: 'T-004', patient: 'Lakshmi Patel',   doctor: 'Dr. Priya Sharma', status: 'waiting',     wait: 45 },
  { token: 'T-005', patient: 'Mohammed Iqbal',  doctor: 'Dr. Kavitha Iyer', status: 'waiting',     wait: 52 },
];

const recentWA = [
  { name: 'Anil Kumar',    message: 'Can I reschedule my appointment?', time: '2 min ago',  unread: true },
  { name: 'Preethi Nair',  message: 'My lab report is ready?',          time: '8 min ago',  unread: true },
  { name: 'Suresh Babu',   message: 'Thank you Doctor 🙏',              time: '15 min ago', unread: false },
  { name: 'Deepika Rao',   message: 'I have severe headache since...',  time: '22 min ago', unread: false },
];

function KpiCard({ label, value, sub, change, icon: Icon, color, positive = true }: any) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-[50px] opacity-[0.07] group-hover:opacity-[0.12] transition-opacity"
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
          <ArrowUpRight className="w-3.5 h-3.5" />{change}
          <span className="text-slate-400 font-normal">vs last week</span>
        </div>
      )}
    </div>
  );
}

export default function ClinicalDashboard() {
  const { user, tenant, hasFlag } = useAuthStore();
  const theme = FALLBACK_THEMES['clinical'];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {greeting}, {user?.firstName} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {tenant?.name} &bull; {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live
          </span>
        </div>
      </div>

      {/* Sub-type chip */}
      {tenant?.subType && (
        <div className="flex items-center gap-2">
          <Stethoscope className="w-4 h-4" style={{ color: theme.primaryColor }} />
          <span className="text-sm font-medium" style={{ color: theme.primaryColor }}>{tenant.subType.name}</span>
          <span className="text-slate-300">·</span>
          <span className="text-sm text-slate-400">{tenant?.plan} Plan</span>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Today's Revenue"      value="₹4.38L" sub="438 transactions"  change="+18%"  icon={TrendingUp}   color={theme.primaryColor} />
        <KpiCard label="Appointments Today"   value="47"     sub="12 completed"       change="+8"    icon={Calendar}     color="#3B82F6" />
        <KpiCard label="WhatsApp Messages"    value="234"    sub="12 pending replies"  change="+23%"  icon={MessageSquare} color="#25D366" />
        <KpiCard label="Follow-Up Rate"       value="76%"    sub="vs 64% last month"  change="+12%"  icon={Activity}     color="#8B5CF6" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue trend */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">Monthly Revenue</h3>
              <p className="text-xs text-slate-400 mt-0.5">Last 7 months</p>
            </div>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">+6.3% MoM</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={revenueData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.primaryColor} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={theme.primaryColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: any) => [`₹${(v/1000).toFixed(0)}K`, 'Revenue']}
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke={theme.primaryColor} strokeWidth={2.5} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly appointments */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">This Week's Appointments</h3>
              <p className="text-xs text-slate-400 mt-0.5">304 total this week</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weekData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: 12 }} />
              <Bar dataKey="appointments" fill={theme.primaryColor} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Queue + WhatsApp row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Live queue */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h3 className="font-semibold text-slate-900">Live Patient Queue</h3>
              <p className="text-xs text-slate-400 mt-0.5">{liveQueue.filter(q => q.status === 'waiting').length} waiting</p>
            </div>
            <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">● Live</span>
          </div>
          <div className="divide-y divide-slate-50">
            {liveQueue.map((q, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <span className="w-12 text-xs font-bold font-mono" style={{ color: theme.primaryColor }}>{q.token}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{q.patient}</p>
                  <p className="text-xs text-slate-400 truncate">{q.doctor}</p>
                </div>
                {q.status === 'in-progress' ? (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> In Progress
                  </span>
                ) : (
                  <div className="text-right">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Waiting</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">{q.wait} min</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-slate-100">
            <a href="/clinical/appointments" className="text-xs font-medium hover:underline" style={{ color: theme.primaryColor }}>
              View all appointments →
            </a>
          </div>
        </div>

        {/* Recent WhatsApp */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h3 className="font-semibold text-slate-900">WhatsApp Inbox</h3>
              <p className="text-xs text-slate-400 mt-0.5">12 unread messages</p>
            </div>
            <a href="/clinical/whatsapp" className="text-xs font-medium hover:underline" style={{ color: theme.primaryColor }}>Open inbox →</a>
          </div>
          <div className="divide-y divide-slate-50">
            {recentWA.map((msg, i) => (
              <div key={i} className={`flex items-start gap-3 px-5 py-3.5 ${msg.unread ? 'bg-[#25D366]/[0.03]' : ''}`}>
                <div className="w-9 h-9 rounded-full bg-[#25D366]/15 text-[#25D366] flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {msg.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium ${msg.unread ? 'text-slate-900' : 'text-slate-700'}`}>{msg.name}</p>
                    <span className="text-[10px] text-slate-400 flex-shrink-0 ml-2">{msg.time}</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{msg.message}</p>
                </div>
                {msg.unread && <div className="w-2 h-2 bg-[#25D366] rounded-full flex-shrink-0 mt-1.5" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue engine activity */}
      {hasFlag('whatsapp') && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${theme.accentColor}20` }}>
              <Zap className="w-4.5 h-4.5" style={{ color: theme.accentColor }} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Revenue Engine — Today's Activity</h3>
              <p className="text-xs text-slate-400">Automated follow-ups running in background</p>
            </div>
            <span className="ml-auto text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">● Active</span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Messages Sent Today',  value: '148', color: '#25D366' },
              { label: 'Appointments Booked',  value: '23',  color: theme.primaryColor },
              { label: 'Follow-ups Pending',   value: '67',  color: theme.accentColor },
              { label: 'Conversion Rate',      value: '15.5%', color: '#8B5CF6' },
            ].map((s, i) => (
              <div key={i} className="text-center bg-slate-50 rounded-xl py-3">
                <p className="text-xl font-bold text-slate-900" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
