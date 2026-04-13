'use client';

export const dynamic = 'force-dynamic';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatTime } from '@/lib/utils';
import { Printer, ArrowLeft } from 'lucide-react';

export default function QueueTokenPage() {
  const params       = useSearchParams();
  const appointmentId = params.get('id');
  const [apt, setApt] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tokenNumber, setToken] = useState<string>('');

  useEffect(() => {
    if (!appointmentId) { setLoading(false); return; }
    Promise.all([
      api.get(`/appointments/${appointmentId}`),
      api.get('/tenants/current').catch(() => ({ data: {} })),
    ]).then(([a, t]) => {
      setApt(a.data);
      setTenant(t.data);
      // Token = T-{position padded to 3 digits} — derive from scheduledAt minute offset
      const scheduled = new Date(a.data.scheduledAt);
      const minuteOffset = scheduled.getHours() * 60 + scheduled.getMinutes();
      const tokenNum = Math.floor(minuteOffset / 15) + 1; // 15-min slots
      setToken(`T-${String(tokenNum).padStart(3, '0')}`);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [appointmentId]);

  // Auto-print on load
  useEffect(() => {
    if (!loading && apt) {
      setTimeout(() => window.print(), 600);
    }
  }, [loading, apt]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-slate-400 text-sm">Loading token…</div>;
  }

  if (!apt) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-slate-400 text-sm">No appointment found. Use ?id=appointmentId</p>
        <a href="/clinical/appointments/queue" className="text-[#0D7C66] text-sm underline">← Back to Queue</a>
      </div>
    );
  }

  const patientName = `${apt.patient?.firstName} ${apt.patient?.lastName || ''}`.trim();
  const doctorName  = apt.doctor
    ? `Dr. ${apt.doctor.user?.firstName} ${apt.doctor.user?.lastName || ''}`.trim()
    : 'Doctor';
  const deptName    = apt.department?.name || '';

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      {/* Toolbar — hidden on print */}
      <div className="fixed top-4 left-4 right-4 flex items-center gap-3 print:hidden z-10">
        <a href="/clinical/appointments/queue"
          className="flex items-center gap-2 text-sm text-slate-600 bg-white px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Queue
        </a>
        <div className="flex-1" />
        <button onClick={() => window.print()}
          className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#0A5E4F] shadow-sm">
          <Printer className="w-4 h-4" /> Print Token
        </button>
      </div>

      {/* Token — 80mm thermal receipt format */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-72 print:shadow-none print:rounded-none print:w-full print:max-w-xs print:mx-auto" id="token">

        {/* Header */}
        <div className="bg-[#0D7C66] px-6 py-5 text-white text-center">
          {tenant?.logoUrl && (
            <img src={tenant.logoUrl} alt="Logo" className="h-8 mx-auto mb-2 object-contain" />
          )}
          <p className="text-xs font-semibold text-emerald-200 uppercase tracking-widest">Queue Token</p>
          <p className="text-lg font-bold mt-0.5">{tenant?.name || 'HospiBot Clinic'}</p>
        </div>

        {/* Token number — large display */}
        <div className="px-6 py-8 text-center border-b border-dashed border-slate-200">
          <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Your Token Number</p>
          <p className="text-7xl font-black text-[#0D7C66] tracking-tight">{tokenNumber}</p>
          <p className="text-xs text-slate-400 mt-3">Please wait for your number to be called</p>
        </div>

        {/* Patient details */}
        <div className="px-6 py-4 space-y-3 border-b border-dashed border-slate-200">
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-slate-400">Patient</span>
            <span className="text-sm font-bold text-slate-900">{patientName}</span>
          </div>
          {apt.patient?.healthId && (
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-400">Health ID</span>
              <span className="text-xs font-mono text-slate-600">{apt.patient.healthId}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-slate-400">Doctor</span>
            <span className="text-sm font-semibold text-slate-700">{doctorName}</span>
          </div>
          {deptName && (
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-400">Department</span>
              <span className="text-sm text-slate-600">{deptName}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-slate-400">Appt Time</span>
            <span className="text-sm font-semibold text-slate-700">{formatTime(apt.scheduledAt)}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-slate-400">Date</span>
            <span className="text-sm text-slate-600">{new Date(apt.scheduledAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 text-center space-y-1">
          <p className="text-xs text-slate-500 font-medium">Please keep this token safe</p>
          <p className="text-xs text-slate-400">Arrive 10 minutes before your slot</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="h-px flex-1 bg-slate-200" />
            <p className="text-[10px] text-slate-400">HospiBot</p>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <p className="text-[10px] text-slate-300">{new Date().toLocaleString('en-IN')}</p>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: 80mm auto; margin: 0; }
          body { margin: 0; background: white; }
          .print\\:hidden { display: none !important; }
          #token { box-shadow: none !important; border-radius: 0 !important; }
        }
      `}</style>
    </div>
  );
}
