'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle2, XCircle, AlertTriangle, RefreshCw, Clock,
  Database, MessageSquare, Zap, Globe, Server, Activity, Cpu, MemoryStick
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const uptimeData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, '0')}:00`,
  api: 98 + Math.random() * 2,
  ws: 97 + Math.random() * 3,
  db: 99 + Math.random() * 1,
}));

const errorLogs = [
  { id: 'e1', time: '14:32:08', level: 'ERROR', service: 'WhatsApp Gateway', message: 'Meta API rate limit exceeded for tenant: kiran-heart', tenant: 'Dr. Kiran Heart Centre' },
  { id: 'e2', time: '13:58:21', level: 'WARN', service: 'Appointment Service', message: 'Slow query detected (>2000ms) in findByDateRange', tenant: null },
  { id: 'e3', time: '13:14:55', level: 'ERROR', service: 'Auth Service', message: 'JWT verification failed — expired token replay attempt', tenant: 'Apollo Specialty Clinic' },
  { id: 'e4', time: '11:02:40', level: 'INFO', service: 'Billing Service', message: 'Batch invoice generation completed — 1,248 invoices', tenant: null },
  { id: 'e5', time: '09:48:17', level: 'WARN', service: 'Storage', message: 'Document storage at 78% capacity — expansion recommended', tenant: null },
  { id: 'e6', time: '08:20:05', level: 'ERROR', service: 'Notification Service', message: 'SMS gateway timeout — 3 messages queued for retry', tenant: 'Sunrise Diagnostics' },
];

const SERVICES = [
  {
    name: 'API Server', icon: Server, status: 'operational', latency: '42ms', uptime: '99.98%',
    detail: 'NestJS · Railway · ap-south-1',
  },
  {
    name: 'Database', icon: Database, status: 'operational', latency: '8ms', uptime: '99.99%',
    detail: 'PostgreSQL · Supabase · Free tier',
  },
  {
    name: 'WhatsApp Gateway', icon: MessageSquare, status: 'degraded', latency: '320ms', uptime: '98.4%',
    detail: 'Meta WABA · Rate limit warning active',
  },
  {
    name: 'Web Frontend', icon: Globe, status: 'operational', latency: '28ms', uptime: '99.97%',
    detail: 'Next.js · Vercel · Edge network',
  },
  {
    name: 'Automation Engine', icon: Zap, status: 'operational', latency: '64ms', uptime: '99.91%',
    detail: 'Bull Queue · Redis',
  },
  {
    name: 'Notification Service', icon: Activity, status: 'incident', latency: '—', uptime: '94.2%',
    detail: 'SMS gateway timeout since 09:45',
  },
];

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; dot: string }> = {
  operational: { color: 'text-emerald-700', bg: 'bg-emerald-100', label: 'Operational', dot: 'bg-emerald-500' },
  degraded: { color: 'text-amber-700', bg: 'bg-amber-100', label: 'Degraded', dot: 'bg-amber-500' },
  incident: { color: 'text-red-700', bg: 'bg-red-100', label: 'Incident', dot: 'bg-red-500' },
  maintenance: { color: 'text-blue-700', bg: 'bg-blue-100', label: 'Maintenance', dot: 'bg-blue-500' },
};

const LOG_COLORS: Record<string, string> = {
  ERROR: 'text-red-600 bg-red-50 border-red-200',
  WARN: 'text-amber-700 bg-amber-50 border-amber-200',
  INFO: 'text-blue-700 bg-blue-50 border-blue-200',
};

export default function SystemPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const overallStatus = SERVICES.some(s => s.status === 'incident')
    ? 'incident' : SERVICES.some(s => s.status === 'degraded') ? 'degraded' : 'operational';

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => { setRefreshing(false); setLastRefreshed(new Date()); }, 1200);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Health</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time status of all platform services · Last updated: {lastRefreshed.toLocaleTimeString('en-IN')}
          </p>
        </div>
        <button onClick={handleRefresh}
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Overall status banner */}
      <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border ${
        overallStatus === 'operational' ? 'bg-emerald-50 border-emerald-200' :
        overallStatus === 'degraded' ? 'bg-amber-50 border-amber-200' :
        'bg-red-50 border-red-200'
      }`}>
        {overallStatus === 'operational'
          ? <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          : overallStatus === 'degraded'
          ? <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          : <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
        <div>
          <p className={`text-sm font-semibold ${
            overallStatus === 'operational' ? 'text-emerald-800' :
            overallStatus === 'degraded' ? 'text-amber-800' : 'text-red-800'
          }`}>
            {overallStatus === 'operational' ? 'All systems operational' :
             overallStatus === 'degraded' ? 'Some services degraded — monitoring closely' :
             'Active incident — engineering team notified'}
          </p>
          <p className="text-xs opacity-70 mt-0.5">
            {overallStatus === 'incident' ? '1 service impacted · Investigating since 09:45 IST' : '6 services monitored · Updated every 60 seconds'}
          </p>
        </div>
      </div>

      {/* Service grid */}
      <div className="grid grid-cols-3 gap-4">
        {SERVICES.map((s) => {
          const cfg = STATUS_CONFIG[s.status];
          return (
            <div key={s.name} className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                    <s.icon className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{s.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{s.detail}</p>
                  </div>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${cfg.bg} ${cfg.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </span>
              </div>
              <div className="flex items-center gap-4 pt-3 border-t border-slate-50">
                <div>
                  <p className="text-xs text-slate-400">Latency</p>
                  <p className="text-sm font-bold text-slate-900">{s.latency}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Uptime (30d)</p>
                  <p className={`text-sm font-bold ${parseFloat(s.uptime) > 99 ? 'text-emerald-600' : parseFloat(s.uptime) > 97 ? 'text-amber-600' : 'text-red-600'}`}>{s.uptime}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Uptime chart */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900">Uptime — Last 24 Hours</h3>
            <p className="text-xs text-slate-400 mt-0.5">Percentage uptime per service per hour</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-[#0D7C66] rounded-full inline-block" /> API</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-[#25D366] rounded-full inline-block" /> WhatsApp</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-[#3B82F6] rounded-full inline-block" /> Database</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={uptimeData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
              interval={3} />
            <YAxis domain={[94, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
              tickFormatter={v => `${v}%`} />
            <Tooltip contentStyle={{ borderRadius: 10, fontSize: 11, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              formatter={(v: any) => [`${Number(v).toFixed(2)}%`, '']} />
            <Line type="monotone" dataKey="api" name="API" stroke="#0D7C66" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="ws" name="WhatsApp" stroke="#25D366" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="db" name="Database" stroke="#3B82F6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Server metrics */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'CPU Usage', value: 34, unit: '%', icon: Cpu, warn: 80 },
          { label: 'Memory Usage', value: 61, unit: '%', icon: MemoryStick, warn: 85 },
          { label: 'Active Connections', value: 847, unit: '', icon: Activity, warn: 99999 },
        ].map((m) => {
          const pct = m.unit === '%' ? m.value : null;
          const color = pct !== null ? (pct > m.warn ? '#ef4444' : pct > m.warn * 0.8 ? '#f59e0b' : '#0D7C66') : '#0D7C66';
          return (
            <div key={m.label} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <m.icon className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-600">{m.label}</span>
              </div>
              <p className="text-3xl font-bold" style={{ color }}>{m.value}{m.unit}</p>
              {pct !== null && (
                <div className="mt-3">
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Limit: 100%</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Error logs */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Recent Logs</h3>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" /><span className="text-xs text-slate-500">2 errors</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 ml-2" /><span className="text-xs text-slate-500">2 warnings</span>
          </div>
        </div>
        <div className="divide-y divide-slate-50">
          {errorLogs.map((log) => (
            <div key={log.id} className="px-5 py-3 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${LOG_COLORS[log.level]} flex-shrink-0 mt-0.5`}>
                {log.level}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800 font-medium">{log.message}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-slate-400">{log.service}</span>
                  {log.tenant && <span className="text-xs text-[#0D7C66]">· {log.tenant}</span>}
                </div>
              </div>
              <span className="text-xs text-slate-400 flex-shrink-0 font-mono">{log.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
