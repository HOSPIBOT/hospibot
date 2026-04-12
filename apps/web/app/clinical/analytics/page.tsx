'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import { RefreshCw, TrendingUp, Users, Calendar, MessageSquare, Activity } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

export default function AnalyticsPage() {
  const [data, setData]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/analytics/revenue?period=${period}`).catch(() => ({ data: null })),
      api.get(`/analytics/appointments?period=${period}`).catch(() => ({ data: null })),
      api.get(`/analytics/patients?period=${period}`).catch(() => ({ data: null })),
    ]).then(([rev, appt, pat]) => {
      setData({ revenue: rev.data, appointments: appt.data, patients: pat.data });
    }).finally(() => setLoading(false));
  }, [period]);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="animate-pulse bg-slate-200 rounded-2xl h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">{Array.from({length:4}).map((_,i)=><div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-24"/>)}</div>
        <div className="grid grid-cols-2 gap-4">{Array.from({length:2}).map((_,i)=><div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-64"/>)}</div>
      </div>
    );
  }

  const rev  = data?.revenue;
  const appt = data?.appointments;
  const pat  = data?.patients;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Performance insights for your facility</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {['week','month','quarter'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg capitalize transition-all ${period === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue',       value: formatINR(rev?.totalRevenue ?? 0),     icon: TrendingUp,   color: '#0D7C66', change: rev?.revenueGrowth ?? 0 },
          { label: 'Appointments',        value: appt?.total ?? 0,                       icon: Calendar,     color: '#3B82F6', change: appt?.growth ?? 0 },
          { label: 'New Patients',        value: pat?.newPatients ?? 0,                  icon: Users,        color: '#8B5CF6', change: pat?.growth ?? 0 },
          { label: 'Avg. Revenue/Patient', value: formatINR(rev?.avgPerPatient ?? 0),    icon: Activity,     color: '#F59E0B', change: 0 },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-sm text-slate-500 font-medium">{kpi.label}</p>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}15` }}>
                <kpi.icon className="w-4.5 h-4.5" style={{ color: kpi.color }} />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">{kpi.value}</p>
            {kpi.change !== 0 && (
              <p className={`text-xs mt-1 font-medium ${kpi.change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {kpi.change >= 0 ? '+' : ''}{kpi.change?.toFixed(1)}% vs last period
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      {rev?.trend && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={rev.trend} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0D7C66" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0D7C66" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} />
              <Tooltip formatter={(v: any) => [formatINR(v), 'Revenue']}
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: 12 }} />
              <Area type="monotone" dataKey="value" stroke="#0D7C66" strokeWidth={2.5} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Appointments + Patient charts */}
      <div className="grid grid-cols-2 gap-4">
        {appt?.byStatus && (
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Appointments by Status</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={appt.byStatus} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="status" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: 'none', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="count" fill="#0D7C66" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {pat?.bySource && (
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Patient Sources</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pat.bySource} cx="50%" cy="50%" outerRadius={72}
                  dataKey="count" nameKey="source" paddingAngle={3}>
                  {(pat.bySource || []).map((_: any, i: number) => (
                    <Cell key={i} fill={['#0D7C66','#25D366','#3B82F6','#F59E0B','#8B5CF6','#EF4444'][i % 6]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, border: 'none', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-slate-600">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Fallback if no data from API */}
        {!appt?.byStatus && !pat?.bySource && (
          <div className="col-span-2 bg-white rounded-2xl border border-slate-100 py-16 text-center">
            <Activity className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-medium">Analytics data is being compiled</p>
            <p className="text-slate-300 text-xs mt-1">Charts will appear once you have patient activity</p>
          </div>
        )}
      </div>

      {/* Top doctors */}
      {rev?.byDoctor && rev.byDoctor.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Top Doctors by Revenue</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Doctor</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Patients</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Appointments</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rev.byDoctor.map((d: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-semibold text-slate-900">Dr. {d.doctorName}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{d.patientCount}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{d.appointmentCount}</td>
                  <td className="px-5 py-3.5 text-sm font-bold text-slate-900 text-right">{formatINR(d.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
