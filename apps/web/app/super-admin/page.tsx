'use client';

import { useState, useEffect } from 'react';
import {
  Building2, Users, TrendingUp, AlertCircle, Activity,
  MessageSquare, CreditCard, Globe, ArrowUpRight, ArrowDownRight,
  CheckCircle2, Clock, XCircle, Wifi
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { api } from '@/lib/api';

// ─── Mock data (replace with API calls when backend is live) ─────────────────
const revenueData = [
  { month: 'Oct', mrr: 124000, new: 18000 },
  { month: 'Nov', mrr: 148000, new: 24000 },
  { month: 'Dec', mrr: 162000, new: 14000 },
  { month: 'Jan', mrr: 188000, new: 26000 },
  { month: 'Feb', mrr: 204000, new: 16000 },
  { month: 'Mar', mrr: 231000, new: 27000 },
  { month: 'Apr', mrr: 258000, new: 27000 },
];

const tenantTypeData = [
  { name: 'Hospital', value: 34, color: '#0D7C66' },
  { name: 'Clinic', value: 89, color: '#11A07A' },
  { name: 'Doctor', value: 47, color: '#4DB896' },
  { name: 'Diagnostic', value: 18, color: '#F59E0B' },
  { name: 'Others', value: 12, color: '#94A3B8' },
];

const recentTenants = [
  { id: '1', name: 'Apollo Specialty Clinic', city: 'Mumbai', type: 'CLINIC', plan: 'ENTERPRISE', status: 'ACTIVE', joined: '2 days ago', mrr: 12000 },
  { id: '2', name: 'Sunrise Diagnostics', city: 'Pune', type: 'DIAGNOSTIC_CENTER', plan: 'GROWTH', status: 'TRIAL', joined: '4 days ago', mrr: 6000 },
  { id: '3', name: 'Dr. Kiran Heart Centre', city: 'Hyderabad', type: 'HOSPITAL', plan: 'ENTERPRISE', status: 'ACTIVE', joined: '1 week ago', mrr: 18000 },
  { id: '4', name: 'Lotus IVF Centre', city: 'Bangalore', type: 'IVF_CENTER', plan: 'GROWTH', status: 'ACTIVE', joined: '1 week ago', mrr: 9000 },
  { id: '5', name: 'MedFirst Pharmacy', city: 'Chennai', type: 'PHARMACY', plan: 'STARTER', status: 'TRIAL', joined: '2 weeks ago', mrr: 2000 },
];

const systemAlerts = [
  { type: 'warning', message: '3 tenants have WhatsApp not configured', time: '2h ago' },
  { type: 'info', message: 'Scheduled maintenance window: Apr 14, 2AM IST', time: '5h ago' },
  { type: 'success', message: 'Bulk invoice processing completed — 1,248 invoices', time: '8h ago' },
];

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, change, positive, icon: Icon, color
}: {
  label: string; value: string; sub?: string; change?: string;
  positive?: boolean; icon: any; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-[60px] opacity-[0.07] group-hover:opacity-[0.12] transition-opacity`}
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
          {positive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          {change} <span className="text-slate-400 font-normal">vs last month</span>
        </div>
      )}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-700',
    TRIAL: 'bg-amber-100 text-amber-700',
    SUSPENDED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-slate-100 text-slate-600',
  };
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${map[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const map: Record<string, string> = {
    STARTER: 'bg-slate-100 text-slate-700',
    GROWTH: 'bg-blue-100 text-blue-700',
    ENTERPRISE: 'bg-violet-100 text-violet-700',
  };
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${map[plan] || 'bg-slate-100 text-slate-600'}`}>
      {plan}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            &nbsp;&bull;&nbsp;Real-time view of all tenants
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
          <Wifi className="w-3 h-3" /> Live
        </div>
      </div>

      {/* System alerts */}
      <div className="space-y-2">
        {systemAlerts.map((alert, i) => (
          <div key={i} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm border ${
            alert.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
            alert.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            {alert.type === 'warning' ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> :
             alert.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> :
             <Clock className="w-4 h-4 flex-shrink-0" />}
            <span className="flex-1 font-medium">{alert.message}</span>
            <span className="text-xs opacity-70">{alert.time}</span>
          </div>
        ))}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Tenants" value="200" sub="34 hospitals · 89 clinics" change="+12 this month" positive icon={Building2} color="#0D7C66" />
        <KpiCard label="Platform MRR" value="₹2.58L" sub="Monthly Recurring Revenue" change="+11.7%" positive icon={CreditCard} color="#F59E0B" />
        <KpiCard label="Active Patients" value="1.4L" sub="Across all tenants today" change="+8.2%" positive icon={Users} color="#3B82F6" />
        <KpiCard label="WhatsApp Messages" value="48.2K" sub="Sent today across platform" change="+23%" positive icon={MessageSquare} color="#25D366" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* MRR Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-slate-900">Monthly Recurring Revenue</h3>
              <p className="text-xs text-slate-400 mt-0.5">Platform-wide MRR growth</p>
            </div>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-medium">+11.7% MoM</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0D7C66" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0D7C66" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="newGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: any) => [`₹${(v / 1000).toFixed(1)}K`, '']}
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: 12 }} />
              <Area type="monotone" dataKey="mrr" name="Total MRR" stroke="#0D7C66" strokeWidth={2.5} fill="url(#mrrGrad)" />
              <Area type="monotone" dataKey="new" name="New MRR" stroke="#F59E0B" strokeWidth={2} fill="url(#newGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Tenant type pie */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-900 mb-1">Tenant Mix</h3>
          <p className="text-xs text-slate-400 mb-4">By facility type</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={tenantTypeData} cx="50%" cy="50%" innerRadius={48} outerRadius={72}
                dataKey="value" paddingAngle={3}>
                {tenantTypeData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {tenantTypeData.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-semibold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent tenants */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-slate-900">Recently Onboarded</h3>
            <p className="text-xs text-slate-400 mt-0.5">Newest tenants on the platform</p>
          </div>
          <a href="/super-admin/tenants" className="text-xs text-[#0D7C66] font-medium hover:underline">View all →</a>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left bg-slate-50">
              <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Organization</th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Plan</th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">MRR</th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {recentTenants.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                onClick={() => window.location.href = `/super-admin/tenants/${t.id}`}>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#E8F5F0] text-[#0D7C66] flex items-center justify-center text-xs font-bold">
                      {t.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{t.name}</p>
                      <p className="text-xs text-slate-400">{t.city}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-xs text-slate-600">{t.type.replace('_', ' ')}</td>
                <td className="px-5 py-3.5"><PlanBadge plan={t.plan} /></td>
                <td className="px-5 py-3.5"><StatusBadge status={t.status} /></td>
                <td className="px-5 py-3.5 text-sm font-semibold text-slate-900">₹{(t.mrr / 1000).toFixed(0)}K</td>
                <td className="px-5 py-3.5 text-xs text-slate-400">{t.joined}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Plan distribution */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { plan: 'STARTER', count: 89, mrr: '₹44.5K', color: '#64748B', desc: '₹500/mo · Up to 3 users' },
          { plan: 'GROWTH', count: 87, mrr: '₹1.04L', color: '#3B82F6', desc: '₹1,200/mo · Up to 15 users' },
          { plan: 'ENTERPRISE', count: 24, mrr: '₹1.08L', color: '#7C3AED', desc: '₹4,500/mo · Unlimited users' },
        ].map((p) => (
          <div key={p.plan} className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${p.color}18`, color: p.color }}>{p.plan}</span>
              <span className="text-xs text-slate-400">{p.desc}</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{p.count}</p>
            <p className="text-xs text-slate-500 mt-0.5">tenants</p>
            <div className="mt-3 pt-3 border-t border-slate-50">
              <p className="text-sm font-semibold text-slate-900">{p.mrr} <span className="text-xs text-slate-400 font-normal">/ month</span></p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
