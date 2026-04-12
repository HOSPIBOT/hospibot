'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatTime } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Users, Clock, Activity, CheckCircle2, RefreshCw, ArrowLeft,
  Play, UserCheck, ChevronRight, Maximize2, Monitor, AlertCircle, Stethoscope,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; ring: string }> = {
  CONFIRMED:   { label: 'Waiting',     color: '#3B82F6', bg: '#EFF6FF',  ring: '#BFDBFE' },
  CHECKED_IN:  { label: 'Checked In',  color: '#8B5CF6', bg: '#F5F3FF',  ring: '#DDD6FE' },
  IN_PROGRESS: { label: 'With Doctor', color: '#0D7C66', bg: '#E8F5F0',  ring: '#6EE7B7' },
};

function QueueCard({ apt, position, onStatusChange }: {
  apt: any; position: number; onStatusChange: (id: string, status: string) => void;
}) {
  const config = STATUS_CONFIG[apt.status] || STATUS_CONFIG.CONFIRMED;
  const patientName = `${apt.patient?.firstName} ${apt.patient?.lastName || ''}`.trim();
  const doctorName = apt.doctor
    ? `Dr. ${apt.doctor.user?.firstName} ${apt.doctor.user?.lastName || ''}`.trim()
    : apt.doctorName || 'Unassigned';

  const isInProgress = apt.status === 'IN_PROGRESS';
  const isCheckedIn = apt.status === 'CHECKED_IN';

  return (
    <div className={`rounded-2xl border-2 p-4 transition-all ${isInProgress ? 'shadow-lg' : 'shadow-sm hover:shadow-md'}`}
      style={{ background: config.bg, borderColor: isInProgress ? config.color : config.ring }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold`}
            style={{ background: config.color }}>
            {position}
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full text-white`}
            style={{ background: config.color }}>
            {config.label}
          </span>
        </div>
        {apt.estimatedWaitMinutes > 0 && (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Clock className="w-3 h-3" />
            ~{apt.estimatedWaitMinutes} min wait
          </div>
        )}
      </div>

      {/* Patient info */}
      <div className="mb-3">
        <p className="font-bold text-slate-900 text-base">{patientName}</p>
        <p className="text-xs text-slate-500 mt-0.5">{apt.patient?.phone}</p>
        <p className="text-xs text-slate-400 mt-0.5">{doctorName}</p>
        {apt.department?.name && (
          <p className="text-xs text-slate-400">{apt.department.name}</p>
        )}
      </div>

      {/* Scheduled time */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
        <Clock className="w-3 h-3" />
        Scheduled: {formatTime(apt.scheduledAt)}
        {apt.checkedInAt && (
          <span className="ml-2 text-purple-600">· Arrived: {formatTime(apt.checkedInAt)}</span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        {apt.status === 'CONFIRMED' && (
          <button onClick={() => onStatusChange(apt.id, 'CHECKED_IN')}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-white py-2 rounded-xl transition-all hover:opacity-90"
            style={{ background: '#8B5CF6' }}>
            <UserCheck className="w-3.5 h-3.5" /> Check In
          </button>
        )}
        {apt.status === 'CHECKED_IN' && (
          <button onClick={() => { onStatusChange(apt.id, 'IN_PROGRESS'); }}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-white py-2 rounded-xl transition-all hover:opacity-90"
            style={{ background: '#0D7C66' }}>
            <Play className="w-3.5 h-3.5" /> Start Consultation
          </button>
        )}
        {apt.status === 'IN_PROGRESS' && (
          <>
            <a href={`/clinical/visits/${apt.id}`}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-white py-2 rounded-xl transition-all hover:opacity-90"
              style={{ background: '#0D7C66' }}>
              <Stethoscope className="w-3.5 h-3.5" /> Open Console
            </a>
            <button onClick={() => onStatusChange(apt.id, 'COMPLETED')}
              className="flex items-center justify-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl hover:bg-emerald-100 transition-colors">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
        <a href={`/clinical/patients/${apt.patientId}`}
          className="flex items-center justify-center gap-1 text-xs font-medium text-slate-600 border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors">
          <ChevronRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

function KioskCard({ apt, position }: { apt: any; position: number }) {
  const config = STATUS_CONFIG[apt.status] || STATUS_CONFIG.CONFIRMED;
  const patientName = `${apt.patient?.firstName} ${apt.patient?.lastName || ''}`.trim();

  return (
    <div className={`rounded-2xl p-5 transition-all border-2 ${apt.status === 'IN_PROGRESS' ? 'border-white/40' : 'border-white/20'}`}
      style={{ background: `${config.color}30` }}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center text-white font-bold text-lg">
          {position}
        </div>
        <div>
          <p className="font-bold text-white text-base">{patientName}</p>
          <p className="text-white/70 text-xs">{config.label}</p>
        </div>
      </div>
    </div>
  );
}

export default function AppointmentQueuePage() {
  const router = useRouter();
  const [queue, setQueue]         = useState<any[]>([]);
  const [summary, setSummary]     = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [kioskMode, setKioskMode] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [doctors, setDoctors]     = useState<any[]>([]);
  const [doctorFilter, setDoctorFilter] = useState('');
  const intervalRef               = useRef<NodeJS.Timeout | null>(null);

  const load = useCallback(async () => {
    try {
      const params: any = {};
      if (doctorFilter) params.doctorId = doctorFilter;
      const res = await api.get('/appointments/queue', { params });
      setQueue(res.data.queue ?? []);
      setSummary(res.data.summary ?? null);
      setLastUpdated(new Date());
    } catch { /* silent refresh */ }
    finally { setLoading(false); }
  }, [doctorFilter]);

  useEffect(() => {
    load();
    api.get('/doctors').then(r => setDoctors(r.data.data ?? [])).catch(() => {});
  }, [load]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(load, 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [load]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status: newStatus });
      if (newStatus === 'COMPLETED') {
        toast.success('Consultation completed!');
      } else {
        toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
      }
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update status');
    }
  };

  const inProgress = queue.filter(a => a.status === 'IN_PROGRESS');
  const checkedIn  = queue.filter(a => a.status === 'CHECKED_IN');
  const waiting    = queue.filter(a => a.status === 'CONFIRMED');

  // Kiosk mode — large display for waiting room
  if (kioskMode) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#063A31] to-[#0D7C66] p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Appointment Queue</h1>
              <p className="text-emerald-300 text-sm mt-1">Last updated: {lastUpdated.toLocaleTimeString('en-IN')}</p>
            </div>
            <button onClick={() => setKioskMode(false)}
              className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium px-4 py-2 rounded-xl border border-white/20 hover:border-white/40 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Exit Kiosk
            </button>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Currently Consulting */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="text-lg font-bold text-white">With Doctor ({inProgress.length})</h2>
              </div>
              <div className="space-y-3">
                {inProgress.map((apt, i) => <KioskCard key={apt.id} apt={apt} position={i + 1} />)}
                {inProgress.length === 0 && <p className="text-white/40 text-sm">No active consultations</p>}
              </div>
            </div>

            {/* Checked In */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-purple-400" />
                <h2 className="text-lg font-bold text-white">Checked In ({checkedIn.length})</h2>
              </div>
              <div className="space-y-3">
                {checkedIn.map((apt, i) => <KioskCard key={apt.id} apt={apt} position={i + 1} />)}
                {checkedIn.length === 0 && <p className="text-white/40 text-sm">No patients checked in</p>}
              </div>
            </div>

            {/* Waiting */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-blue-400" />
                <h2 className="text-lg font-bold text-white">Waiting ({waiting.length})</h2>
              </div>
              <div className="space-y-3">
                {waiting.slice(0, 6).map((apt, i) => <KioskCard key={apt.id} apt={apt} position={i + 1} />)}
                {waiting.length > 6 && (
                  <p className="text-white/60 text-sm text-center">+{waiting.length - 6} more waiting</p>
                )}
                {waiting.length === 0 && <p className="text-white/40 text-sm">No patients waiting</p>}
              </div>
            </div>
          </div>

          {/* Bottom stats */}
          <div className="mt-8 flex items-center justify-center gap-12">
            {[
              { label: 'Total Today', value: (summary?.total || 0) + (queue.length), color: 'text-white' },
              { label: 'Waiting',    value: summary?.waiting || waiting.length,  color: 'text-blue-300' },
              { label: 'With Doctor', value: summary?.inProgress || inProgress.length, color: 'text-emerald-300' },
              { label: 'Completed',  value: summary?.completed || 0,             color: 'text-slate-300' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className={`text-4xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-white/60 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/clinical/appointments" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </a>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Live Queue</h1>
            <p className="text-xs text-slate-400 mt-0.5">Auto-refreshes every 30 seconds · Last: {lastUpdated.toLocaleTimeString('en-IN')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select value={doctorFilter} onChange={e => setDoctorFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none cursor-pointer">
            <option value="">All Doctors</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>Dr. {d.user?.firstName} {d.user?.lastName || ''}</option>
            ))}
          </select>
          <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setKioskMode(true)}
            className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#0A5E4F] transition-colors">
            <Monitor className="w-4 h-4" /> Kiosk Mode
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'In Queue',     value: queue.length,               icon: Users,        color: '#0D7C66' },
          { label: 'Waiting',      value: waiting.length,             icon: Clock,        color: '#3B82F6' },
          { label: 'Checked In',   value: checkedIn.length,           icon: UserCheck,    color: '#8B5CF6' },
          { label: 'With Doctor',  value: inProgress.length,          icon: Activity,     color: '#10B981' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
              <span className="text-xs text-slate-500">{s.label}</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Queue columns */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({length: 6}).map((_,i) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-44" />)}
        </div>
      ) : queue.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-24 text-center">
          <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Queue is clear</p>
          <p className="text-slate-300 text-sm mt-1">No active appointments for today</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {/* Currently Consulting */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-700">With Doctor ({inProgress.length})</h3>
            </div>
            {inProgress.map((apt, i) => (
              <QueueCard key={apt.id} apt={apt} position={i + 1} onStatusChange={handleStatusChange} />
            ))}
            {inProgress.length === 0 && (
              <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 py-10 text-center text-slate-300 text-sm">
                No active consultations
              </div>
            )}
          </div>

          {/* Checked In */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <h3 className="text-sm font-bold text-slate-700">Checked In ({checkedIn.length})</h3>
            </div>
            {checkedIn.map((apt, i) => (
              <QueueCard key={apt.id} apt={apt} position={i + 1} onStatusChange={handleStatusChange} />
            ))}
            {checkedIn.length === 0 && (
              <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 py-10 text-center text-slate-300 text-sm">
                No patients checked in yet
              </div>
            )}
          </div>

          {/* Waiting */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <h3 className="text-sm font-bold text-slate-700">Waiting ({waiting.length})</h3>
            </div>
            {waiting.map((apt, i) => (
              <QueueCard key={apt.id} apt={apt} position={i + 1} onStatusChange={handleStatusChange} />
            ))}
            {waiting.length === 0 && (
              <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 py-10 text-center text-slate-300 text-sm">
                No patients waiting
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
