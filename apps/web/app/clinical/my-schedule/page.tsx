'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatTime, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store';
import {
  Calendar, Clock, User, CheckCircle2, Play, ChevronLeft, ChevronRight,
  Stethoscope, Phone, AlertTriangle, RefreshCw,
} from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; color: string; next?: string; nextLabel?: string }> = {
  PENDING:    { label: 'Pending',     color: '#F59E0B', next: 'CONFIRMED',   nextLabel: 'Confirm' },
  CONFIRMED:  { label: 'Confirmed',   color: '#3B82F6', next: 'CHECKED_IN',  nextLabel: 'Check In' },
  CHECKED_IN: { label: 'Arrived',     color: '#8B5CF6', next: 'IN_PROGRESS', nextLabel: 'Start' },
  IN_PROGRESS:{ label: 'In Progress', color: '#0D7C66', next: 'COMPLETED',   nextLabel: 'Complete' },
  COMPLETED:  { label: 'Completed',   color: '#10B981' },
  CANCELLED:  { label: 'Cancelled',   color: '#EF4444' },
  NO_SHOW:    { label: 'No Show',     color: '#94A3B8' },
};

export default function MySchedulePage() {
  const { user } = useAuthStore();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointments, setAppts] = useState<any[]>([]);
  const [loading, setLoading]    = useState(true);
  const [updating, setUpdating]  = useState<string | null>(null);
  const [doctorId, setDoctorId]  = useState<string | null>(null);

  // Resolve logged-in user's doctorId
  useEffect(() => {
    api.get('/doctors', { params: { limit: 1, userId: user?.id } })
      .then(r => {
        const doc = r.data.data?.[0];
        if (doc) setDoctorId(doc.id);
      }).catch(() => {});
  }, [user?.id]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { date, limit: 50, sortBy: 'scheduledAt', sortOrder: 'asc' };
      if (doctorId) params.doctorId = doctorId;
      const res = await api.get('/appointments', { params });
      setAppts(res.data.data ?? []);
    } catch { toast.error('Failed to load schedule'); }
    finally { setLoading(false); }
  }, [date, doctorId]);

  useEffect(() => { load(); }, [load]);

  const advance = async (appt: any) => {
    const s = STATUS_MAP[appt.status];
    if (!s?.next) return;
    setUpdating(appt.id);
    try {
      await api.put(`/appointments/${appt.id}/status`, { status: s.next });
      setAppts(prev => prev.map((a: any) => a.id === appt.id ? { ...a, status: s.next! } : a));
      if (s.next === 'IN_PROGRESS') {
        // Open OPD console for this patient
        window.open(`/clinical/visits/${appt.id}`, '_blank');
      }
    } catch { toast.error('Failed to update status'); }
    finally { setUpdating(null); }
  };

  const shiftDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  };

  const today = new Date().toISOString().split('T')[0];
  const isToday = date === today;
  const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const pending   = appointments.filter((a: any) => a.status === 'PENDING').length;
  const confirmed = appointments.filter((a: any) => ['CONFIRMED', 'CHECKED_IN'].includes(a.status)).length;
  const done      = appointments.filter((a: any) => a.status === 'COMPLETED').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-[#0D7C66]" /> My Schedule
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {appointments.length} appointments · {done} completed
            {pending > 0 && ` · ${pending} pending confirmation`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => shiftDate(-1)} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="text-sm font-semibold text-slate-900 bg-transparent outline-none" />
            {isToday && <span className="text-xs text-[#0D7C66] font-bold">Today</span>}
          </div>
          <button onClick={() => shiftDate(1)} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Today',    value: appointments.length,           color: '#334155' },
          { label: 'Waiting/In',     value: confirmed,                     color: '#3B82F6' },
          { label: 'In Progress',    value: appointments.filter((a: any) => a.status === 'IN_PROGRESS').length, color: '#0D7C66' },
          { label: 'Completed',      value: done,                           color: '#10B981' },
        ].map((s: any) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 px-4 py-3">
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Appointment list */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-24" />
        ))}</div>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
          <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No appointments for {displayDate}</p>
          <p className="text-slate-300 text-xs mt-1">You're free! 🎉</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appt, idx) => {
            const s = STATUS_MAP[appt.status] || { label: appt.status, color: '#94A3B8' };
            const patient = appt.patient;
            const patName = `${patient?.firstName} ${patient?.lastName || ''}`.trim();
            const isActive = ['CHECKED_IN', 'IN_PROGRESS'].includes(appt.status);
            const age = patient?.dateOfBirth
              ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / 3.156e10)
              : null;

            return (
              <div key={appt.id}
                className={`bg-white rounded-2xl border-2 transition-all ${
                  isActive ? 'border-[#0D7C66]/30 shadow-md' :
                  appt.status === 'COMPLETED' ? 'border-slate-100 opacity-70' :
                  'border-slate-100 hover:shadow-sm'
                }`}>
                <div className="flex items-stretch gap-0">
                  {/* Time column */}
                  <div className="flex flex-col items-center justify-center w-16 py-4 border-r border-slate-100 flex-shrink-0">
                    <p className="text-lg font-black text-slate-800 leading-none">
                      {appt.scheduledAt ? formatTime(appt.scheduledAt).split(':')[0] : '—'}
                    </p>
                    <p className="text-xs text-slate-400">
                      :{appt.scheduledAt ? formatTime(appt.scheduledAt).split(':')[1].slice(0, 2) : '--'}
                    </p>
                    <p className="text-[9px] font-bold mt-1 uppercase tracking-wide" style={{ color: s.color }}>
                      {s.label}
                    </p>
                  </div>

                  {/* Main content */}
                  <div className="flex-1 px-5 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#E8F5F0] text-[#0D7C66] flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {patient?.firstName?.[0]}{patient?.lastName?.[0] || ''}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900">{patName}</p>
                            {patient?.healthId && (
                              <span className="text-[10px] font-mono text-slate-400">{patient.healthId}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                            {age && <span>{age}y</span>}
                            {patient?.gender && <span className="capitalize">{patient.gender.toLowerCase()}</span>}
                            {patient?.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />{patient.phone}
                              </span>
                            )}
                            {appt.department?.name && <span>{appt.department.name}</span>}
                          </div>
                          {appt.notes && (
                            <p className="text-xs text-slate-500 mt-1 truncate max-w-md">{appt.notes}</p>
                          )}
                          {/* Allergy warning */}
                          {(patient?.allergies?.length ?? 0) > 0 && (
                            <p className="text-xs text-red-600 font-semibold mt-0.5 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Allergic: {patient.allergies.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {appt.status === 'IN_PROGRESS' && (
                          <a href={`/clinical/visits/${appt.id}`} target="_blank"
                            className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-2 rounded-xl hover:opacity-90 transition-opacity"
                            style={{ background: '#0D7C66' }}>
                            <Stethoscope className="w-3.5 h-3.5" /> Open Console
                          </a>
                        )}
                        {s.next && (
                          <button onClick={() => advance(appt)} disabled={updating === appt.id}
                            className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-2 rounded-xl hover:opacity-90 disabled:opacity-60 transition-opacity"
                            style={{ background: s.color }}>
                            {updating === appt.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : s.next === 'IN_PROGRESS' ? (
                              <Play className="w-3.5 h-3.5" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            {s.nextLabel}
                          </button>
                        )}
                        {appt.status === 'COMPLETED' && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
