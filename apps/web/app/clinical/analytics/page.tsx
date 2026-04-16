'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatINR, formatDate } from '@/lib/utils';
import {
  TrendingUp, Users, Calendar, MessageSquare, Activity,
  BarChart3, RefreshCw, ArrowUpRight, Stethoscope, Clock,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

const PIE_COLORS = ['#0D7C66','#3B82F6','#F59E0B','#EF4444','#8B5CF6','#10B981','#EC4899','#06B6D4'];

export default function AnalyticsPage() {
  const [kpis, setKpis]           = useState<any>(null);
  const [revTrend, setRevTrend]   = useState<any[]>([]);
  const [apptData, setApptData]   = useState<any>(null);
  const [topDoctors, setTopDoctors] = useState<any[]>([]);
  const [demographics, setDemographics] = useState<any>(null);
  const [whatsapp, setWhatsapp]   = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [period, setPeriod]       = useState<'week'|'month'|'quarter'>('month');

  const dayMap: Record<string, number> = { week: 7, month: 30, quarter: 90 };

  const load = useCallback(async () => {
    setLoading(true);
    const days = dayMap[period];
    try {
      const [k, r, a, d, w, doc] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get(`/analytics/revenue/trend?days=${days}`),
        api.get(`/analytics/appointments?days=${days}`),
        api.get('/analytics/patients/demographics'),
        api.get(`/analytics/whatsapp?days=${days}`),
        api.get('/analytics/doctors/top?limit=5'),
      ]);
      setKpis(k.data);
      setRevTrend(Array.isArray(r.data) ? r.data : []);
      setApptData(a.data);
      setDemographics(d.data);
      setWhatsapp(w.data);
      setTopDoctors(Array.isArray(doc.data) ? doc.data : []);
    } catch { /* use whatever loaded */ }
    finally { setLoading(false); }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Performance insights for your facility</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {(['week','month','quarter'] as const).map((p: any) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg capitalize transition-all ${period === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {p}
              </button>
            ))}
          </div>
          <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI cards */}
      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {Array.from({length:4}).map((_,i) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-28" />)}
        </div>
      ) : kpis && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Patients',    value: kpis.totalPatients?.toLocaleString('en-IN') || '0',       icon: Users,        color: '#0D7C66', change: kpis.newPatientsThisMonth ? `+${kpis.newPatientsThisMonth} this month` : '' },
            { label: 'Appointments',      value: kpis.todayAppointments?.toString() || '0',                 icon: Calendar,     color: '#3B82F6', change: 'today' },
            { label: 'Month Revenue',     value: formatINR(kpis.monthRevenue || 0),                          icon: TrendingUp,   color: '#8B5CF6', change: kpis.revenueGrowth ? `${kpis.revenueGrowth > 0 ? '+' : ''}${kpis.revenueGrowth}% vs last month` : '' },
            { label: 'WhatsApp Messages', value: (kpis.whatsappMessagesSent || 0).toLocaleString('en-IN'),  icon: MessageSquare, color: '#25D366', change: 'all time' },
          ].map((k: any) => (
            <div key={k.label} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm text-slate-500">{k.label}</p>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${k.color}15` }}>
                  <k.icon className="w-4 h-4" style={{ color: k.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{k.value}</p>
              {k.change && <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><ArrowUpRight className="w-3 h-3" />{k.change}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Revenue trend */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Revenue Trend</h3>
        {revTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revTrend} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0D7C66" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0D7C66" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={(v: string) => v?.slice(5) || v} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={(v: number) => `₹${(v / 100000).toFixed(0)}L`} />
              <Tooltip formatter={(v: any) => [formatINR(Number(v)), 'Revenue']}
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#0D7C66" strokeWidth={2.5} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-300 text-sm">
            No revenue data for this period. Create invoices to see trends.
          </div>
        )}
      </div>

      {/* Appointments + Demographics */}
      <div className="grid grid-cols-2 gap-4">
        {/* Appointment status distribution */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Appointment Status Distribution</h3>
          {apptData?.byStatus && apptData.byStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={apptData.byStatus} cx="50%" cy="50%" outerRadius={70}
                  dataKey="count" nameKey="status" paddingAngle={3}>
                  {apptData.byStatus.map((_: any, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, border: 'none', fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8}
                  formatter={(v) => <span className="text-xs text-slate-600 capitalize">{String(v).toLowerCase().replace('_', ' ')}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-300 text-sm">No appointment data yet</div>
          )}
        </div>

        {/* Patient demographics */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Patient Demographics</h3>
          {demographics?.byGender && demographics.byGender.length > 0 ? (
            <>
              <div className="flex items-center gap-4 mb-4">
                {demographics.byGender.map((g: any) => (
                  <div key={g.gender} className="text-center">
                    <p className="text-2xl font-bold text-slate-900">{g.count}</p>
                    <p className="text-xs text-slate-400 capitalize">{g.gender?.toLowerCase() || 'Unknown'}</p>
                  </div>
                ))}
              </div>
              {demographics.byAgeGroup && (
                <ResponsiveContainer width="100%" height={130}>
                  <BarChart data={demographics.byAgeGroup} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="ageGroup" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: 'none', fontSize: 12 }} />
                    <Bar dataKey="count" name="Patients" fill="#0D7C66" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-300 text-sm">No demographic data yet</div>
          )}
        </div>
      </div>

      {/* Top Doctors + WhatsApp */}
      <div className="grid grid-cols-2 gap-4">
        {/* Top doctors */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-[#0D7C66]" /> Top Doctors by Appointments
          </h3>
          {topDoctors.length > 0 ? (
            <div className="space-y-3">
              {topDoctors.map((doc: any, i: number) => (
                <div key={doc.id || i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#E8F5F0] text-[#0D7C66] flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      Dr. {doc.firstName} {doc.lastName || ''}
                    </p>
                    {doc.specialization && <p className="text-xs text-slate-400">{doc.specialization}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{doc.appointmentCount || doc.totalAppointments || 0}</p>
                    <p className="text-xs text-slate-400">appts</p>
                  </div>
                  <div className="w-16">
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-[#0D7C66]" style={{
                        width: `${topDoctors[0] ? Math.min(((doc.appointmentCount || doc.totalAppointments || 0) / (topDoctors[0].appointmentCount || topDoctors[0].totalAppointments || 1)) * 100, 100) : 0}%`
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-slate-300 text-sm">No data yet</div>
          )}
        </div>

        {/* WhatsApp stats */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#25D366]" /> WhatsApp Performance
          </h3>
          {whatsapp ? (
            <div className="space-y-4">
              {[
                { label: 'Total Messages Sent',     value: whatsapp.totalSent || 0,       color: '#0D7C66' },
                { label: 'Messages Received',       value: whatsapp.totalReceived || 0,   color: '#3B82F6' },
                { label: 'Active Conversations',    value: whatsapp.activeConversations || 0, color: '#8B5CF6' },
                { label: 'Chatbot Handled',         value: whatsapp.botHandled || 0,      color: '#25D366' },
              ].map((m: any) => (
                <div key={m.label} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{m.label}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-slate-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full transition-all" style={{
                        background: m.color,
                        width: `${whatsapp.totalSent > 0 ? Math.min((m.value / whatsapp.totalSent) * 100, 100) : Math.min(m.value * 10, 100)}%`,
                      }} />
                    </div>
                    <span className="text-sm font-bold text-slate-900 w-12 text-right">
                      {m.value.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}

              {whatsapp.deliveryRate !== undefined && (
                <div className="bg-[#E8F5F0] rounded-xl p-3 border border-[#0D7C66]/20 mt-2">
                  <p className="text-xs text-[#0D7C66] font-bold">Delivery Rate</p>
                  <p className="text-2xl font-bold text-[#0D7C66]">{whatsapp.deliveryRate}%</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-slate-300 text-sm">No WhatsApp data yet</div>
          )}
        </div>
      </div>

      {/* Appointment volume bar chart */}
      {apptData?.byDay && apptData.byDay.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Daily Appointment Volume</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={apptData.byDay} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={(v: string) => v?.slice(5) || v} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: 'none', fontSize: 12 }} />
              <Bar dataKey="count" name="Appointments" fill="#3B82F6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
