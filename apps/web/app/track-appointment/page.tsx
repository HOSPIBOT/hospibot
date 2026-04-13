'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';
import { CheckCircle2, Clock, AlertTriangle, Phone, Calendar, User, Loader2 } from 'lucide-react';

const TIMELINE = [
  { status: 'PENDING',     label: 'Booked',          icon: Calendar },
  { status: 'CONFIRMED',   label: 'Confirmed',        icon: CheckCircle2 },
  { status: 'CHECKED_IN',  label: 'Checked In',       icon: User },
  { status: 'IN_PROGRESS', label: 'With Doctor',      icon: Clock },
  { status: 'COMPLETED',   label: 'Consultation Done',icon: CheckCircle2 },
];

export default function TrackAppointmentPage() {
  const params  = useSearchParams();
  const apptId  = params?.get('id');
  const phone   = params?.get('phone'); // For verification

  const [appt, setAppt]     = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    if (!apptId) { setError('No appointment ID provided'); setLoading(false); return; }
    Promise.all([
      api.get(`/appointments/${apptId}`),
      api.get('/tenants/current').catch(() => ({ data: {} })),
    ]).then(([a, t]) => {
      setAppt(a.data);
      setTenant(t.data);
    }).catch(() => setError('Appointment not found. Please check your booking confirmation.'))
      .finally(() => setLoading(false));
  }, [apptId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E8F5F0] to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0D7C66] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E8F5F0] to-white flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  const currentStepIdx = TIMELINE.findIndex(s => s.status === appt.status);
  const isCompleted   = appt.status === 'COMPLETED';
  const isCancelled   = ['CANCELLED', 'NO_SHOW'].includes(appt.status);

  const patientName = `${appt.patient?.firstName} ${appt.patient?.lastName || ''}`.trim();
  const doctorName  = appt.doctor
    ? `Dr. ${appt.doctor.user?.firstName} ${appt.doctor.user?.lastName || ''}`.trim()
    : '—';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F5F0] to-white">
      {/* Header */}
      <div className="bg-[#0D7C66] px-5 py-5 text-white">
        <div className="max-w-md mx-auto">
          {tenant?.logoUrl && <img src={tenant.logoUrl} alt="" className="h-7 mb-3 object-contain" />}
          <p className="font-black text-lg">{tenant?.name || 'HospiBot Clinic'}</p>
          <p className="text-emerald-200 text-xs mt-0.5">Appointment Status Tracker</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-5">

        {/* Appointment card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-black text-slate-900 text-lg">{patientName}</p>
              {appt.patient?.healthId && (
                <p className="text-xs font-mono text-slate-400">{appt.patient.healthId}</p>
              )}
            </div>
            {isCancelled ? (
              <span className="text-xs font-bold bg-red-100 text-red-700 px-3 py-1.5 rounded-full">
                {appt.status === 'NO_SHOW' ? 'No Show' : 'Cancelled'}
              </span>
            ) : isCompleted ? (
              <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Completed
              </span>
            ) : (
              <span className="text-xs font-bold bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full animate-pulse">
                Live
              </span>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-50">
            {[
              { l: 'Appointment',  v: `${appt.scheduledAt ? formatDate(appt.scheduledAt) : '—'} at ${appt.scheduledAt ? formatTime(appt.scheduledAt) : '—'}` },
              { l: 'Doctor',       v: doctorName },
              { l: 'Department',   v: appt.department?.name || '—' },
              { l: 'Booking Ref',  v: appt.id?.slice(0, 8).toUpperCase() },
            ].map(r => (
              <div key={r.l} className="flex justify-between text-sm">
                <span className="text-slate-400">{r.l}</span>
                <span className="font-semibold text-slate-800">{r.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status timeline */}
        {!isCancelled && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Journey</p>
            <div className="space-y-0">
              {TIMELINE.map((step, i) => {
                const done    = i <= currentStepIdx;
                const current = i === currentStepIdx;
                const Icon    = step.icon;
                return (
                  <div key={step.status} className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        done
                          ? current
                            ? 'bg-[#0D7C66] ring-4 ring-[#0D7C66]/20'
                            : 'bg-[#0D7C66]'
                          : 'bg-slate-100'
                      }`}>
                        <Icon className={`w-4 h-4 ${done ? 'text-white' : 'text-slate-300'}`} />
                      </div>
                      {i < TIMELINE.length - 1 && (
                        <div className={`w-0.5 h-6 ${i < currentStepIdx ? 'bg-[#0D7C66]' : 'bg-slate-100'}`} />
                      )}
                    </div>
                    <div className={`pb-4 ${i < TIMELINE.length - 1 ? '' : ''}`}>
                      <p className={`text-sm font-semibold ${current ? 'text-[#0D7C66]' : done ? 'text-slate-700' : 'text-slate-300'}`}>
                        {step.label}
                        {current && !isCompleted && <span className="ml-2 text-[10px] font-bold bg-[#E8F5F0] text-[#0D7C66] px-1.5 py-0.5 rounded-full">Current</span>}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Cancelled state */}
        {isCancelled && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="font-semibold text-red-700">
              {appt.status === 'NO_SHOW' ? 'This appointment was marked as No Show' : 'This appointment was cancelled'}
            </p>
            {appt.cancellationReason && (
              <p className="text-sm text-red-500 mt-1">{appt.cancellationReason}</p>
            )}
            <a href={`/book?clinic=${tenant?.slug || ''}`}
              className="mt-4 inline-block bg-[#0D7C66] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#0A5E4F]">
              Book New Appointment
            </a>
          </div>
        )}

        {/* Completed */}
        {isCompleted && appt.visit && (
          <div className="bg-[#E8F5F0] border border-[#0D7C66]/20 rounded-2xl p-4">
            <p className="text-xs font-bold text-[#0D7C66] uppercase tracking-widest mb-2">Consultation Summary</p>
            {appt.visit.diagnosisText && (
              <p className="text-sm text-[#0A5E4F]"><strong>Diagnosis:</strong> {appt.visit.diagnosisText}</p>
            )}
            {appt.visit.followUpDays && (
              <p className="text-sm text-[#0A5E4F] mt-1">
                <strong>Follow-up:</strong> After {appt.visit.followUpDays} days
              </p>
            )}
          </div>
        )}

        {/* Help */}
        <div className="text-center space-y-1">
          {tenant?.phone && (
            <a href={`tel:${tenant.phone}`}
              className="flex items-center justify-center gap-2 text-sm text-[#0D7C66] hover:underline">
              <Phone className="w-4 h-4" /> Call {tenant.phone}
            </a>
          )}
          <p className="text-xs text-slate-300">Powered by HospiBot · hospibot.in</p>
        </div>
      </div>
    </div>
  );
}
