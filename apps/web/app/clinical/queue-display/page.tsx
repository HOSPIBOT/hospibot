'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

// Fullscreen TV display — no nav, large font, auto-refresh every 30s

interface QueueEntry {
  id: string;
  tokenNumber?: string;
  patient: { firstName: string; lastName?: string };
  doctor?: { user: { firstName: string; lastName?: string } };
  status: string;
  scheduledAt: string;
  department?: { name: string };
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; pulse: boolean }> = {
  CHECKED_IN:  { label: 'Please Proceed',  bg: '#0D7C66', text: '#ffffff', pulse: true  },
  IN_PROGRESS: { label: 'With Doctor',     bg: '#1E40AF', text: '#ffffff', pulse: false },
  CONFIRMED:   { label: 'Waiting',         bg: '#374151', text: '#9CA3AF', pulse: false },
  PENDING:     { label: 'Please Check In', bg: '#92400E', text: '#FDE68A', pulse: true  },
};

function formatTokenNumber(appt: QueueEntry, idx: number): string {
  if (appt.tokenNumber) return appt.tokenNumber;
  if (appt.scheduledAt) {
    const d = new Date(appt.scheduledAt);
    const n = Math.floor((d.getHours() * 60 + d.getMinutes()) / 15) + 1;
    return `T-${String(n).padStart(3, '0')}`;
  }
  return `T-${String(idx + 1).padStart(3, '0')}`;
}

export default function QueueDisplayPage() {
  const [queue, setQueue]   = useState<QueueEntry[]>([]);
  const [tenant, setTenant] = useState<any>(null);
  const [time, setTime]     = useState(new Date());
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [dotCount, setDotCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const [q, t] = await Promise.all([
        api.get('/appointments/queue', { params: { limit: 20 } }),
        api.get('/tenants/current').catch(() => ({ data: {} })),
      ]);
      const data = q.data.queue ?? q.data.data ?? [];
      setQueue(data.filter((a: QueueEntry) =>
        ['CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'PENDING'].includes(a.status)
      ).slice(0, 16));
      setTenant(t.data);
      setLastRefresh(new Date());
    } catch { /* keep showing last data */ }
  }, []);

  useEffect(() => { load(); }, [load]);
  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);
  // Clock tick every second
  useEffect(() => {
    const tick = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);
  // Animated dots
  useEffect(() => {
    const d = setInterval(() => setDotCount(n => (n + 1) % 4), 500);
    return () => clearInterval(d);
  }, []);

  const now = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const nowServing = queue.filter((a: any) => a.status === 'IN_PROGRESS');
  const nextUp = queue.filter((a: any) => a.status === 'CHECKED_IN');
  const waiting = queue.filter((a: any) => ['CONFIRMED', 'PENDING'].includes(a.status));

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white overflow-hidden select-none" style={{ fontFamily: 'system-ui, sans-serif' }}>

      {/* Header bar */}
      <div className="flex items-center justify-between px-8 py-4 bg-[#0D7C66]">
        <div className="flex items-center gap-4">
          {tenant?.logoUrl && <img src={tenant.logoUrl} alt="" className="h-8 object-contain" />}
          <div>
            <p className="text-xl font-black">{tenant?.name || 'HospiBot Clinic'}</p>
            <p className="text-emerald-200 text-xs">OPD Queue Display</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black tabular-nums">{now}</p>
          <p className="text-emerald-200 text-sm">{dateStr}</p>
        </div>
      </div>

      <div className="p-8 space-y-6">

        {/* NOW SERVING — big bold display */}
        {nowServing.length > 0 && (
          <div className="bg-gradient-to-r from-[#0D7C66] to-[#0A5E4F] rounded-3xl p-6">
            <p className="text-emerald-300 text-sm font-bold uppercase tracking-widest mb-3">🔔 Now Serving</p>
            <div className="grid grid-cols-2 gap-4">
              {nowServing.map((a, i) => (
                <div key={a.id} className="flex items-center gap-5">
                  <div className="text-6xl font-black tabular-nums text-white">
                    {formatTokenNumber(a, i)}
                  </div>
                  <div>
                    <p className="text-xl font-bold">{a.patient.firstName} {a.patient.lastName || ''}</p>
                    {a.doctor && <p className="text-emerald-200 text-sm">Dr. {a.doctor.user.firstName} {a.doctor.user.lastName || ''}</p>}
                    {a.department && <p className="text-emerald-300 text-xs">{a.department.name}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NEXT UP */}
        {nextUp.length > 0 && (
          <div className="bg-[#1A2744] rounded-3xl p-5">
            <p className="text-blue-300 text-sm font-bold uppercase tracking-widest mb-3">
              {'▶'.repeat(dotCount + 1)} Please Proceed to Counter
            </p>
            <div className="flex flex-wrap gap-3">
              {nextUp.map((a, i) => (
                <div key={a.id}
                  className="flex items-center gap-3 bg-blue-600/20 border border-blue-500/40 rounded-2xl px-5 py-3 animate-pulse">
                  <span className="text-3xl font-black text-blue-300 tabular-nums">{formatTokenNumber(a, i)}</span>
                  <div>
                    <p className="font-bold text-white">{a.patient.firstName} {a.patient.lastName || ''}</p>
                    {a.doctor && <p className="text-blue-300 text-xs">Dr. {a.doctor.user.firstName} {a.doctor.user.lastName || ''}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WAITING QUEUE */}
        {waiting.length > 0 && (
          <div>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-3">Queue</p>
            <div className="grid grid-cols-4 gap-3">
              {waiting.map((a, i) => {
                const cfg = STATUS_CONFIG[a.status];
                return (
                  <div key={a.id}
                    className="rounded-2xl px-4 py-3 border"
                    style={{ background: `${cfg.bg}20`, borderColor: `${cfg.bg}40` }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xl font-black tabular-nums" style={{ color: '#94A3B8' }}>
                        {formatTokenNumber(a, i)}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${cfg.bg}40`, color: cfg.text }}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-300 truncate">
                      {a.patient.firstName} {a.patient.lastName || ''}
                    </p>
                    {a.doctor && (
                      <p className="text-xs text-slate-500 truncate">
                        Dr. {a.doctor.user.firstName} {a.doctor.user.lastName || ''}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {queue.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-600">
            <p className="text-6xl mb-4">🏥</p>
            <p className="text-2xl font-bold">No active appointments</p>
            <p className="text-slate-500 mt-2">Queue display auto-refreshes every 30 seconds</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 px-8 py-2 bg-[#060A14] flex items-center justify-between text-xs text-slate-600">
        <p>Last updated: {lastRefresh.toLocaleTimeString('en-IN')}</p>
        <p>HospiBot · hospibot.in</p>
        <p>Auto-refreshes every 30s {'·'.repeat(dotCount + 1)}</p>
      </div>
    </div>
  );
}
