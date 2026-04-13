'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatTime } from '@/lib/utils';
import { Printer, ArrowLeft, Calendar, RefreshCw } from 'lucide-react';

export default function DaySheetPage() {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate]       = useState(today);
  const [appts, setAppts]     = useState<any[]>([]);
  const [tenant, setTenant]   = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/tenants/current').then(r => setTenant(r.data)).catch(() => {});
  }, []);

  const load = async (d = date) => {
    setLoading(true);
    try {
      const res = await api.get('/appointments', {
        params: { date: d, limit: 100, sortBy: 'scheduledAt', sortOrder: 'asc' },
      });
      setAppts(res.data.data ?? []);
    } catch { setAppts([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(date); }, [date]);

  const confirmed  = appts.filter(a => ['CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'].includes(a.status));
  const completed  = appts.filter(a => a.status === 'COMPLETED');
  const cancelled  = appts.filter(a => ['CANCELLED', 'NO_SHOW'].includes(a.status));
  const pending    = appts.filter(a => a.status === 'PENDING');

  const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Toolbar — hidden on print */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3 print:hidden sticky top-0 z-10">
        <a href="/clinical/appointments" className="flex items-center gap-2 text-slate-600 text-sm hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Back
        </a>
        <div className="flex-1 flex items-center gap-3">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:border-[#0D7C66] outline-none" />
          <button onClick={() => load(date)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <span className="text-sm text-slate-500">{appts.length} appointments</span>
        </div>
        <button onClick={() => window.print()}
          className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#0A5E4F]">
          <Printer className="w-4 h-4" /> Print Day Sheet
        </button>
      </div>

      {/* Printable content */}
      <div className="max-w-4xl mx-auto my-6 print:my-0 px-4 print:px-0">
        <div className="bg-white shadow-xl rounded-2xl print:shadow-none print:rounded-none" id="daysheet">

          {/* Header */}
          <div className="border-b-2 border-[#0D7C66] px-8 py-5 flex items-start justify-between">
            <div>
              {tenant?.logoUrl && <img src={tenant.logoUrl} alt="" className="h-8 mb-2 object-contain" />}
              <h1 className="text-xl font-black text-slate-900">{tenant?.name || 'HospiBot Clinic'}</h1>
              {tenant?.address && <p className="text-xs text-slate-500">{tenant.address}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Day Schedule</p>
              <p className="text-lg font-bold text-slate-900 mt-1">{displayDate}</p>
              <p className="text-sm text-slate-500 mt-0.5">
                {appts.length} total · {confirmed.length} confirmed · {completed.length} completed
              </p>
            </div>
          </div>

          {/* Summary row */}
          <div className="grid grid-cols-4 gap-0 border-b border-slate-100">
            {[
              { label: 'Pending',   count: pending.length,   color: '#F59E0B' },
              { label: 'Confirmed', count: confirmed.length, color: '#3B82F6' },
              { label: 'Completed', count: completed.length, color: '#10B981' },
              { label: 'Cancelled', count: cancelled.length, color: '#EF4444' },
            ].map(s => (
              <div key={s.label} className="px-6 py-3 text-center border-r border-slate-100 last:border-0">
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Appointments table */}
          <div className="px-8 py-4">
            {appts.length === 0 ? (
              <div className="py-12 text-center">
                <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No appointments scheduled for {displayDate}</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 pr-4 text-xs font-bold text-slate-400 uppercase tracking-wide w-14">#</th>
                    <th className="text-left py-2 pr-4 text-xs font-bold text-slate-400 uppercase tracking-wide w-20">Time</th>
                    <th className="text-left py-2 pr-4 text-xs font-bold text-slate-400 uppercase tracking-wide">Patient</th>
                    <th className="text-left py-2 pr-4 text-xs font-bold text-slate-400 uppercase tracking-wide">Phone</th>
                    <th className="text-left py-2 pr-4 text-xs font-bold text-slate-400 uppercase tracking-wide">Doctor</th>
                    <th className="text-left py-2 pr-4 text-xs font-bold text-slate-400 uppercase tracking-wide">Dept</th>
                    <th className="text-left py-2 text-xs font-bold text-slate-400 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appts.map((a, idx) => {
                    const statusColors: Record<string, string> = {
                      PENDING:    'text-amber-600',   CONFIRMED:  'text-blue-600',
                      CHECKED_IN: 'text-purple-600',  IN_PROGRESS:'text-indigo-600',
                      COMPLETED:  'text-emerald-600', CANCELLED:  'text-red-400',
                      NO_SHOW:    'text-slate-400',
                    };
                    return (
                      <tr key={a.id} className={`border-b border-slate-50 ${idx % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                        <td className="py-2.5 pr-4 text-xs text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2.5 pr-4 font-semibold text-slate-900 whitespace-nowrap">
                          {a.scheduledAt ? formatTime(a.scheduledAt) : '—'}
                        </td>
                        <td className="py-2.5 pr-4 font-bold text-slate-900">
                          {a.patient?.firstName} {a.patient?.lastName || ''}
                          {a.patient?.healthId && <span className="ml-1.5 text-xs font-mono text-slate-400">{a.patient.healthId}</span>}
                        </td>
                        <td className="py-2.5 pr-4 text-slate-500 text-xs">{a.patient?.phone || '—'}</td>
                        <td className="py-2.5 pr-4 text-slate-600 text-xs">
                          {a.doctor ? `Dr. ${a.doctor.user?.firstName} ${a.doctor.user?.lastName || ''}` : '—'}
                        </td>
                        <td className="py-2.5 pr-4 text-slate-400 text-xs">{a.department?.name || '—'}</td>
                        <td className={`py-2.5 text-xs font-bold ${statusColors[a.status] || 'text-slate-400'}`}>
                          {a.status?.replace('_', ' ')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Notes area for reception */}
          <div className="px-8 pb-6 print:block hidden">
            <div className="border-t border-slate-100 pt-4 mt-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Reception Notes</p>
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="border-b border-slate-200 h-6" />
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-300">
            <p>HospiBot · hospibot.in</p>
            <p>Printed: {new Date().toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 10mm; }
          body { margin: 0; background: white; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          #daysheet { box-shadow: none !important; border-radius: 0 !important; }
        }
      `}</style>
    </div>
  );
}
