'use client';

import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import { useState, useEffect } from 'react';
import {
  Calendar, Users, MessageSquare, TrendingUp, Clock,
  CheckCircle2, ArrowUpRight, Activity, Stethoscope, Shield,
  Zap, RefreshCw, Play, Monitor,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function KpiCard({ label, value, sub, change, icon: Icon, color, positive = true }: any) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-[50px] opacity-[0.06] transition-opacity group-hover:opacity-[0.1]" style={{ background: color }} />
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: `${color}15` }}>
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
  const { user } = useAuthStore();
  const [kpis, setKpis]       = useState<any>(null);
  const [revTrend, setRevTrend] = useState<any[]>([]);
  const [queue, setQueue]     = useState<any[]>([]);
  const [convos, setConvos]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/dashboard').catch(() => ({ data: {} })),
      api.get('/analytics/revenue/trend?days=7').catch(() => ({ data: [] })),
      api.get('/appointments/queue').catch(() => ({ data: { queue: [] } })),
      api.get('/whatsapp/conversations?limit=5').catch(() => ({ data: { data: [] } })),
    ]).then(([k, r, q, c]) => {
      setKpis(k.data);
      setRevTrend(Array.isArray(r.data) ? r.data : []);
      setQueue(q.data?.queue ?? []);
      setConvos(c.data?.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const firstName = user?.firstName || 'Doctor';

  const inProgress = queue.filter(a => a.status === 'IN_PROGRESS').length;
  const waiting    = queue.filter(a => a.status === 'CONFIRMED').length;
  const checkedIn  = queue.filter(a => a.status === 'CHECKED_IN').length;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{greeting}, {firstName} 👋</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/clinical/appointments/queue"
            className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#0A5E4F] transition-colors shadow-sm">
            <Monitor className="w-4 h-4" /> Live Queue
          </a>
        </div>
      </div>

      {/* KPIs */}
      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {Array.from({length:4}).map((_,i) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-28"/>)}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          <KpiCard label="Today's Appointments" value={kpis?.todayAppointments ?? queue.length}
            sub={`${inProgress} in progress`} icon={Calendar} color="#0D7C66" />
          <KpiCard label="Total Patients" value={(kpis?.totalPatients ?? 0).toLocaleString('en-IN')}
            sub={kpis?.newPatientsThisMonth ? `+${kpis.newPatientsThisMonth} this month` : 'registered'}
            icon={Users} color="#3B82F6" />
          <KpiCard label="Month Revenue" value={formatINR(kpis?.monthRevenue ?? 0)}
            change={kpis?.revenueGrowth ? `${kpis.revenueGrowth > 0 ? '+' : ''}${kpis.revenueGrowth}%` : undefined}
            icon={TrendingUp} color="#8B5CF6" />
          <KpiCard label="WhatsApp Messages" value={(kpis?.whatsappMessagesSent ?? 0).toLocaleString('en-IN')}
            sub="all time sent" icon={MessageSquare} color="#25D366" />
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {/* Revenue trend chart */}
        <div className="col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Revenue — Last 7 Days</h2>
            <a href="/clinical/analytics" className="text-xs text-[#0D7C66] hover:underline flex items-center gap-1">
              Full Analytics <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          {revTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={revTrend} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashRevGrad" x1="0" y1="0" x2="0" y2="1">
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
                <Area type="monotone" dataKey="revenue" stroke="#0D7C66" strokeWidth={2.5} fill="url(#dashRevGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-300 text-sm">
              Create invoices to see revenue trends
            </div>
          )}
        </div>

        {/* Today's queue snapshot */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Live Queue</h2>
            <a href="/clinical/appointments/queue" className="text-xs text-[#0D7C66] hover:underline flex items-center gap-1">
              Full View <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'Waiting', value: waiting, color: '#3B82F6' },
              { label: 'Ready', value: checkedIn, color: '#8B5CF6' },
              { label: 'Active', value: inProgress, color: '#0D7C66' },
            ].map(s => (
              <div key={s.label} className="text-center bg-slate-50 rounded-xl py-3">
                <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          {queue.length === 0 ? (
            <div className="py-8 text-center text-slate-300 text-sm">Queue is clear today</div>
          ) : (
            <div className="space-y-2">
              {queue.slice(0, 4).map((apt: any) => (
                <div key={apt.id} className={`flex items-center gap-3 px-3 py-2 rounded-xl ${apt.status === 'IN_PROGRESS' ? 'bg-[#E8F5F0]' : 'bg-slate-50'}`}>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${apt.status === 'IN_PROGRESS' ? 'bg-emerald-500 animate-pulse' : apt.status === 'CHECKED_IN' ? 'bg-purple-500' : 'bg-blue-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {apt.patient?.firstName} {apt.patient?.lastName || ''}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {apt.doctor ? `Dr. ${apt.doctor.user?.firstName}` : ''}
                    </p>
                  </div>
                  {apt.status === 'IN_PROGRESS' && (
                    <a href={`/clinical/visits/${apt.id}`}
                      className="flex-shrink-0 text-[9px] font-bold text-[#0D7C66] bg-white border border-[#0D7C66]/20 px-1.5 py-0.5 rounded">
                      Console
                    </a>
                  )}
                </div>
              ))}
              {queue.length > 4 && (
                <p className="text-[10px] text-slate-400 text-center">+{queue.length - 4} more in queue</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions + WhatsApp */}
      <div className="grid grid-cols-2 gap-4">
        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '/clinical/appointments', label: 'Book Appointment', icon: Calendar, color: '#0D7C66', desc: 'Schedule new appointment' },
              { href: '/clinical/patients', label: 'Register Patient', icon: Users, color: '#3B82F6', desc: 'Add new patient record' },
              { href: '/clinical/prescriptions', label: 'Write Prescription', icon: Stethoscope, color: '#8B5CF6', desc: 'Digital prescription writer' },
              { href: '/clinical/billing', label: 'Create Invoice', icon: TrendingUp, color: '#F59E0B', desc: 'Generate bill for patient' },
              { href: '/clinical/crm', label: 'CRM Leads', icon: Zap, color: '#EF4444', desc: 'Manage patient leads' },
              { href: '/clinical/vault', label: 'Health Vault', icon: Shield, color: '#10B981', desc: 'Access patient records' },
            ].map(action => (
              <a key={action.href} href={action.href}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all group">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105" style={{ background: `${action.color}15` }}>
                  <action.icon className="w-4 h-4" style={{ color: action.color }} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 group-hover:text-[#0D7C66] transition-colors">{action.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{action.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Recent WhatsApp */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">WhatsApp Inbox</h2>
            <a href="/clinical/whatsapp" className="text-xs text-[#0D7C66] hover:underline flex items-center gap-1">
              Open Inbox <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          {convos.length === 0 ? (
            <div className="py-10 text-center">
              <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No conversations yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {convos.map((conv: any) => (
                <a key={conv.id} href="/clinical/whatsapp"
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors group">
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-[#E8F5F0] text-[#0D7C66] flex items-center justify-center text-sm font-bold">
                      {(conv.waContactName || conv.waContactPhone || '?')[0].toUpperCase()}
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#25D366] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-[#0D7C66] transition-colors">
                      {conv.waContactName || conv.waContactPhone}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{conv.messageCount} messages</p>
                  </div>
                  {conv.isBot && (
                    <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full flex-shrink-0">Bot</span>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
