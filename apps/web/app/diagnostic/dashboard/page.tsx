'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import Link from 'next/link';
import {
  FlaskConical, Clock, CheckCircle2, AlertTriangle, TrendingUp, Home,
  Activity, Zap, RefreshCw, ChevronRight, ArrowUp, ArrowDown,
  AlertCircle, Bell, Package, Users, IndianRupee, Target,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const NAVY = '#1E3A5F';
const TEAL = '#0D7C66';

function StatCard({ label, value, icon: Icon, color = NAVY, sub, href }: any) {
  const inner = (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all duration-200 h-full">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}14` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900 mb-0.5">{value}</p>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
  return href ? <Link href={href} className="block">{inner}</Link> : inner;
}

function StatusBoard({ data }: { data: any }) {
  const stages = [
    { label: 'Waiting',           value: data?.pending ?? 0,    color: '#94A3B8', icon: Clock, q: 'ORDERED,SAMPLE_COLLECTED' },
    { label: 'In Progress',       value: data?.inProgress ?? 0, color: '#F59E0B', icon: Activity, q: 'IN_PROGRESS' },
    { label: 'Pending Validation',value: data?.resulted ?? 0,   color: '#F97316', icon: FlaskConical, q: 'RESULTED' },
    { label: 'Pending Sign-off',  value: data?.validated ?? 0,  color: '#22C55E', icon: CheckCircle2, q: 'VALIDATED' },
    { label: 'Delivered Today',   value: data?.delivered ?? 0,  color: '#10B981', icon: CheckCircle2, q: 'DELIVERED' },
    { label: 'STAT / Urgent',     value: data?.stat ?? 0,       color: '#EF4444', icon: AlertTriangle, q: 'stat=true' },
  ];
  return (
    <div className="grid grid-cols-6 gap-3">
      {stages.map((s: any) => (
        <Link key={s.label} href={`/diagnostic/lab-orders?status=${s.q}`}>
          <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center hover:shadow-md transition-all cursor-pointer">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
              style={{ background: `${s.color}14` }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <p className="text-2xl font-bold mb-0.5" style={{ color: s.value > 0 ? s.color : '#CBD5E1' }}>
              {s.value}
            </p>
            <p className="text-xs font-medium text-slate-500 leading-tight">{s.label}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

function MorningChecklist() {
  const items = [
    'Cold storage temperature checked',
    'QC run before patient samples',
    'Reagent stock verified',
    'Instrument calibration confirmed',
    'Bench decontamination done',
  ];
  const [done, setDone] = useState<number[]>([]);
  const toggle = (i: number) => setDone(p => p.includes(i) ? p.filter((x: any) => x !== i) : [...p, i]);
  if (done.length === items.length) return null;
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-amber-600" />
        <p className="text-sm font-bold text-amber-900">Morning Opening Checklist ({done.length}/{items.length})</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        {items.map((item, i) => (
          <button key={i} onClick={() => toggle(i)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-left transition-all border ${
              done.includes(i) ? 'bg-teal-50 border-teal-200 text-teal-700 line-through' : 'bg-white border-amber-200 text-amber-900 hover:border-amber-400'
            }`}>
            <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${done.includes(i) ? 'bg-teal-500' : 'border border-amber-400'}`}>
              {done.includes(i) && <CheckCircle2 className="w-3 h-3 text-white" />}
            </div>
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function DiagnosticDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const [dash, t] = await Promise.all([
        api.get('/diagnostic/dashboard').catch(() => api.get('/lab/dashboard')),
        api.get('/lab/trend?days=14').catch(() => ({ data: [] })),
      ]);
      setStats(dash.data);
      const trendData = Array.isArray(dash.data?.trend) ? dash.data.trend : (Array.isArray(t.data) ? t.data : []);
      setTrend(trendData);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setInterval(() => load(true), 60000); return () => clearInterval(t); }, [load]);

  if (loading) return (
    <div className="space-y-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-24" />
      ))}
    </div>
  );

  const s = stats ?? {};

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Diagnostic Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} · Live
          </p>
        </div>
        <button onClick={() => load(true)} disabled={refreshing}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Wallet low balance warning */}
      {s.walletCredits !== undefined && s.walletCredits < 200 && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="text-amber-600">⚠️</span>
            <div>
              <p className="text-sm font-bold text-amber-900">
                Low WhatsApp Credits — {Math.round(s.walletCredits)} remaining
              </p>
              <p className="text-xs text-amber-600">
                {s.walletCredits < 50 ? 'Critical: sending may pause soon' : 'Recharge to avoid report delivery interruption'}
              </p>
            </div>
          </div>
          <a href="/diagnostic/billing"
            className="text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 px-4 py-2 rounded-xl transition-colors whitespace-nowrap">
            Recharge Now →
          </a>
        </div>
      )}

      {/* Critical value alert */}
      {(s.criticalUnacked ?? 0) > 0 && (
        <Link href="/diagnostic/lab-orders?critical=true">
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-3.5 hover:bg-red-100 transition-colors cursor-pointer">
            <AlertCircle className="w-5 h-5 text-red-600 animate-pulse" />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-800">{s.criticalUnacked} Critical Value{s.criticalUnacked > 1 ? 's' : ''} — Unacknowledged</p>
              <p className="text-xs text-red-500">Requires immediate clinical attention</p>
            </div>
            <ChevronRight className="w-4 h-4 text-red-300" />
          </div>
        </Link>
      )}

      {/* Morning checklist */}
      <MorningChecklist />

      {/* 6-stage status board */}
      <StatusBoard data={s} />

      {/* KPI row */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard label="Today's Orders" value={s.todayOrders ?? 0} icon={FlaskConical} color={NAVY} href="/diagnostic/lab-orders" />
        <StatCard label="Today's Revenue" value={formatINR(s.todayRevenue ?? 0)} icon={IndianRupee} color={TEAL} />
        <StatCard label="Home Collections" value={s.homeCollections ?? 0} icon={Home} color="#8B5CF6" href="/diagnostic/collection" />
        <StatCard label="TAT Breached" value={s.tatBreached ?? 0} icon={Clock} color={s.tatBreached > 0 ? '#EF4444' : '#94A3B8'} />
        <StatCard label="WA Credits" value={(s.walletCredits ?? 0).toFixed(0)} icon={Zap} color="#F59E0B" sub="remaining" href="/diagnostic/billing" />
      </div>

      {/* Chart + Quick actions */}
      <div className="grid grid-cols-4 gap-5">
        <div className="col-span-3 bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-bold text-slate-900 mb-5">Order Volume — Last 14 Days</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={NAVY} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={NAVY} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={TEAL} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={TEAL} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                tickFormatter={(v: string) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
              <Area type="monotone" dataKey="orders" name="Orders" stroke={NAVY} strokeWidth={2.5} fill="url(#g1)" dot={false} />
              <Area type="monotone" dataKey="delivered" name="Delivered" stroke={TEAL} strokeWidth={2} fill="url(#g2)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-sm font-bold text-slate-900 mb-4">Quick Actions</p>
          <div className="space-y-1.5">
            {[
              { href: '/diagnostic/lab-orders/new', label: 'Register Patient', icon: Users, color: NAVY },
              { href: '/diagnostic/collection/new', label: 'Book Home Collection', icon: Home, color: TEAL },
              { href: '/diagnostic/results', label: 'Enter Results', icon: FlaskConical, color: '#F59E0B' },
              { href: '/diagnostic/qc', label: 'QC Log', icon: Target, color: '#8B5CF6' },
              { href: '/diagnostic/inventory', label: 'Check Reagents', icon: Package, color: '#10B981' },
            ].map((a: any) => (
              <Link key={a.href} href={a.href}>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${a.color}12` }}>
                    <a.icon className="w-3.5 h-3.5" style={{ color: a.color }} />
                  </div>
                  <span className="text-xs font-medium text-slate-700 flex-1">{a.label}</span>
                  <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Low credit warning */}
      {(s.walletCredits ?? 999) < 500 && (
        <Link href="/diagnostic/billing">
          <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl px-5 py-3.5 hover:bg-yellow-100 transition-colors cursor-pointer">
            <Bell className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-sm font-bold text-yellow-900">Low WhatsApp Credits — {(s.walletCredits ?? 0).toFixed(0)} remaining</p>
              <p className="text-xs text-yellow-600">Reports may fail to deliver. Recharge now.</p>
            </div>
            <ChevronRight className="w-4 h-4 text-yellow-400 ml-auto" />
          </div>
        </Link>
      )}
    </div>
  );
}
