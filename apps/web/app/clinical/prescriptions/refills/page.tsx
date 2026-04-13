'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Pill, RefreshCw, AlertTriangle, Clock, Send, Phone, Calendar,
  CheckCircle2, ChevronLeft, ChevronRight,
} from 'lucide-react';

interface RefillAlert {
  id: string;
  patient: any;
  medications: any[];
  refillDueDate: string;
  daysUntilRefill: number;
  lastPrescribed: string;
  doctorName: string;
}

export default function RefillsTrackerPage() {
  const [refills, setRefills]   = useState<RefillAlert[]>([]);
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState<string | null>(null);
  const [filter, setFilter]     = useState<'overdue' | 'due_today' | 'due_week' | 'all'>('all');
  const [page, setPage]         = useState(1);
  const PER_PAGE = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Load prescriptions with refill dates
      const res = await api.get('/prescriptions', {
        params: { isActive: true, hasRefillDate: true, limit: 200 },
      });
      const rxList: any[] = res.data.data ?? res.data ?? [];
      const now = Date.now();

      const alerts: RefillAlert[] = rxList
        .filter(rx => rx.refillDueDate)
        .map(rx => {
          const dueMs   = new Date(rx.refillDueDate).getTime();
          const daysUntil = Math.ceil((dueMs - now) / 86400000);
          const doctor = rx.doctor;
          return {
            id: rx.id,
            patient: rx.patient,
            medications: rx.medications ?? [],
            refillDueDate: rx.refillDueDate,
            daysUntilRefill: daysUntil,
            lastPrescribed: rx.createdAt,
            doctorName: doctor
              ? `Dr. ${doctor.user?.firstName} ${doctor.user?.lastName || ''}`.trim()
              : '—',
          };
        })
        .sort((a, b) => a.daysUntilRefill - b.daysUntilRefill);

      setRefills(alerts);
    } catch { toast.error('Failed to load refill data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sendRefillReminder = async (alert: RefillAlert) => {
    if (!alert.patient?.phone) { toast.error('No phone number on file'); return; }
    setSending(alert.id);
    const meds = alert.medications.slice(0, 2).map((m: any) => m.name).join(', ');
    try {
      await api.post('/whatsapp/send', {
        to: alert.patient.phone,
        message: `Hi ${alert.patient.firstName}, this is a reminder from your clinic. Your prescription for ${meds} is due for refill${alert.daysUntilRefill <= 0 ? ' — it has expired!' : ` in ${alert.daysUntilRefill} day${alert.daysUntilRefill !== 1 ? 's' : ''}.`} Please contact us or visit the clinic to renew your prescription.`,
      });
      toast.success(`Refill reminder sent to ${alert.patient.firstName}!`);
    } catch { toast.error('Failed to send reminder'); }
    finally { setSending(null); }
  };

  const filtered = refills.filter(r => {
    if (filter === 'overdue')    return r.daysUntilRefill < 0;
    if (filter === 'due_today')  return r.daysUntilRefill >= 0 && r.daysUntilRefill <= 1;
    if (filter === 'due_week')   return r.daysUntilRefill >= 0 && r.daysUntilRefill <= 7;
    return true;
  });

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const overdue    = refills.filter(r => r.daysUntilRefill < 0).length;
  const dueToday   = refills.filter(r => r.daysUntilRefill >= 0 && r.daysUntilRefill <= 1).length;
  const dueWeek    = refills.filter(r => r.daysUntilRefill >= 0 && r.daysUntilRefill <= 7).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Pill className="w-6 h-6 text-[#0D7C66]" /> Refill Tracker
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {overdue > 0 && <span className="text-red-600 font-semibold">{overdue} overdue · </span>}
            {dueToday > 0 && <span className="text-amber-600 font-semibold">{dueToday} due today · </span>}
            {refills.length} active prescriptions tracked
          </p>
        </div>
        <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all'       as const, label: `All (${refills.length})`,              color: 'slate' },
          { key: 'overdue'   as const, label: `Overdue (${overdue})`,                color: 'red' },
          { key: 'due_today' as const, label: `Due Today (${dueToday})`,             color: 'amber' },
          { key: 'due_week'  as const, label: `This Week (${dueWeek})`,              color: 'blue' },
        ].map(f => (
          <button key={f.key} onClick={() => { setFilter(f.key); setPage(1); }}
            className={`text-xs font-semibold px-4 py-2 rounded-full border-2 transition-all ${
              filter === f.key
                ? f.color === 'red'   ? 'border-red-500 bg-red-50 text-red-700'
                : f.color === 'amber' ? 'border-amber-500 bg-amber-50 text-amber-700'
                : f.color === 'blue'  ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-[#0D7C66] bg-[#E8F5F0] text-[#0D7C66]'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-20" />
        ))}</div>
      ) : paginated.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-medium">
            {filter === 'all' ? 'No active prescriptions with refill tracking' : 'No prescriptions in this category'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginated.map(alert => {
              const isOverdue = alert.daysUntilRefill < 0;
              const isUrgent  = alert.daysUntilRefill >= 0 && alert.daysUntilRefill <= 3;
              const borderColor = isOverdue ? 'border-red-200' : isUrgent ? 'border-amber-200' : 'border-slate-100';
              const bgColor     = isOverdue ? 'bg-red-50/30' : isUrgent ? 'bg-amber-50/30' : 'bg-white';
              const patName = `${alert.patient?.firstName} ${alert.patient?.lastName || ''}`.trim();

              return (
                <div key={alert.id} className={`rounded-2xl border-2 ${borderColor} ${bgColor} p-5`}>
                  <div className="flex items-start gap-4">
                    {/* Status indicator */}
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-sm font-black ${
                      isOverdue ? 'bg-red-100 text-red-600' :
                      isUrgent  ? 'bg-amber-100 text-amber-600' :
                      'bg-[#E8F5F0] text-[#0D7C66]'
                    }`}>
                      {isOverdue
                        ? Math.abs(alert.daysUntilRefill) + 'd'
                        : alert.daysUntilRefill === 0 ? 'NOW' : alert.daysUntilRefill + 'd'}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-slate-900">{patName}</p>
                        {alert.patient?.healthId && (
                          <span className="text-[10px] font-mono text-slate-400">{alert.patient.healthId}</span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isOverdue ? 'bg-red-100 text-red-700' :
                          isUrgent  ? 'bg-amber-100 text-amber-700' :
                          'bg-[#E8F5F0] text-[#0D7C66]'
                        }`}>
                          {isOverdue ? `${Math.abs(alert.daysUntilRefill)}d overdue` :
                           alert.daysUntilRefill === 0 ? 'Due today' :
                           `Due in ${alert.daysUntilRefill}d`}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        {alert.medications.slice(0, 3).map((m: any, i: number) => (
                          <span key={i} className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            {m.name} {m.dosage}
                          </span>
                        ))}
                        {alert.medications.length > 3 && (
                          <span className="text-[10px] text-slate-400">+{alert.medications.length - 3} more</span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        {alert.patient?.phone && (
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3"/>{alert.patient.phone}</span>
                        )}
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/>Prescribed: {formatDate(alert.lastPrescribed)}</span>
                        <span>{alert.doctorName}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a href={`/clinical/patients/${alert.patient?.id}`}
                        className="text-xs font-semibold text-[#0D7C66] border border-[#0D7C66]/30 px-3 py-1.5 rounded-xl hover:bg-[#E8F5F0] transition-colors">
                        View
                      </a>
                      {alert.patient?.phone && (
                        <button onClick={() => sendRefillReminder(alert)}
                          disabled={sending === alert.id}
                          className="flex items-center gap-1 text-xs font-bold bg-[#25D366] text-white px-3 py-1.5 rounded-xl hover:opacity-90 disabled:opacity-60">
                          {sending === alert.id
                            ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"/>
                            : <Send className="w-3 h-3"/>}
                          Remind
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40">
                  <ChevronLeft className="w-4 h-4"/>
                </button>
                <span className="text-xs text-slate-600 px-3">{page}/{totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40">
                  <ChevronRight className="w-4 h-4"/>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
