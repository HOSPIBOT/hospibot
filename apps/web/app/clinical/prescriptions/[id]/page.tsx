'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Printer, ArrowLeft, MessageSquare, Loader2, Pill } from 'lucide-react';

export default function PrescriptionDetailPage() {
  const id = (useParams() as any)?.['id'] ?? '';
  const [rx, setRx]         = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/prescriptions/${id}`),
      api.get('/tenants/current').catch(() => ({ data: {} })),
    ]).then(([r, t]) => {
      setRx(r.data);
      setTenant(t.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!loading && rx) setTimeout(() => window.print(), 500);
  }, [loading, rx]);

  const sendWhatsApp = async () => {
    setSending(true);
    try {
      await api.post(`/prescriptions/${id}/send`);
      alert('Prescription sent via WhatsApp!');
    } catch { alert('Send failed'); }
    finally { setSending(false); }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 text-[#0D7C66] animate-spin" /></div>;
  }
  if (!rx) {
    return <div className="text-center py-20 text-slate-400">Prescription not found</div>;
  }

  const meds     = rx.medications as any[];
  const patient  = rx.patient;
  const doctor   = rx.doctor;
  const drName   = doctor ? `Dr. ${doctor.user?.firstName} ${doctor.user?.lastName || ''}`.trim() : '—';
  const patName  = patient ? `${patient.firstName} ${patient.lastName || ''}`.trim() : '—';
  const age      = patient?.dateOfBirth
    ? `${Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / 3.156e10)} yrs`
    : '';

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3 print:hidden">
        <button onClick={() => window.history.back()} className="flex items-center gap-2 text-slate-600 text-sm hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex-1" />
        <button onClick={sendWhatsApp} disabled={sending}
          className="flex items-center gap-2 bg-[#25D366] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-60">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
          Send via WhatsApp
        </button>
        <button onClick={() => window.print()}
          className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#0A5E4F]">
          <Printer className="w-4 h-4" /> Print
        </button>
      </div>

      {/* A5 prescription pad */}
      <div className="max-w-2xl mx-auto my-8 print:my-0">
        <div className="bg-white shadow-xl rounded-2xl print:shadow-none print:rounded-none overflow-hidden" id="rx-print">

          {/* Header */}
          <div className="border-b-4 border-[#0D7C66] px-8 py-5">
            <div className="flex items-start justify-between">
              <div>
                {tenant?.logoUrl && <img src={tenant.logoUrl} alt="" className="h-10 mb-2 object-contain" />}
                <h1 className="text-xl font-black text-slate-900">{tenant?.name || 'HospiBot Clinic'}</h1>
                {tenant?.address && <p className="text-xs text-slate-500 mt-0.5">{tenant.address}{tenant.city ? `, ${tenant.city}` : ''}</p>}
                {tenant?.phone && <p className="text-xs text-slate-500">Ph: {tenant.phone}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Prescription</p>
                <p className="text-xs font-mono text-slate-400 mt-0.5">{rx.id?.slice(0, 8).toUpperCase()}</p>
                <p className="text-xs text-slate-400 mt-1">{formatDate(rx.createdAt)}</p>
                {/* Rx symbol */}
                <p className="text-4xl font-black text-[#0D7C66] mt-1 leading-none">℞</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-5">
            {/* Patient + Doctor */}
            <div className="grid grid-cols-2 gap-6 mb-5 pb-5 border-b border-dashed border-slate-200">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Patient</p>
                <p className="font-bold text-slate-900">{patName}</p>
                {age && <p className="text-xs text-slate-500">{age} · {patient?.gender}</p>}
                {patient?.phone && <p className="text-xs text-slate-500">{patient.phone}</p>}
                {(patient?.allergies?.length ?? 0) > 0 && (
                  <p className="text-xs text-red-600 font-semibold mt-1">⚠ Allergic: {patient.allergies.join(', ')}</p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Doctor</p>
                <p className="font-bold text-slate-900">{drName}</p>
                {doctor?.specialization && <p className="text-xs text-slate-500">{doctor.specialization}</p>}
                {doctor?.regNumber && <p className="text-xs text-slate-400">Reg: {doctor.regNumber}</p>}
              </div>
            </div>

            {/* Medications table */}
            <div className="mb-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Medications</p>
              <table className="w-full">
                <thead>
                  <tr className="bg-[#E8F5F0] rounded-xl">
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-[#0D7C66] uppercase rounded-l-xl">#</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-[#0D7C66] uppercase">Drug Name</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-[#0D7C66] uppercase">Dosage</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-[#0D7C66] uppercase">Frequency</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-[#0D7C66] uppercase rounded-r-xl">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {meds.map((m, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="px-3 py-2.5 text-sm text-slate-400">{i + 1}</td>
                      <td className="px-3 py-2.5">
                        <p className="text-sm font-bold text-slate-900">{m.name}</p>
                        {m.genericName && <p className="text-[10px] text-slate-400">{m.genericName}</p>}
                      </td>
                      <td className="px-3 py-2.5 text-sm text-slate-700">{m.dosage || '—'}</td>
                      <td className="px-3 py-2.5 text-sm text-slate-700">{m.frequency || '—'}</td>
                      <td className="px-3 py-2.5 text-sm text-slate-700">{m.duration || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Special instructions per med */}
              {meds.filter(m => m.instructions).map((m, i) => (
                <p key={i} className="text-xs text-slate-500 mt-1.5 px-3">
                  <span className="font-semibold">{m.name}:</span> {m.instructions}
                </p>
              ))}
            </div>

            {/* Notes */}
            {rx.notes && (
              <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">Doctor's Advice</p>
                <p className="text-sm text-amber-800 whitespace-pre-wrap">{rx.notes}</p>
              </div>
            )}

            {/* Follow-up */}
            {rx.followUpDays && (
              <p className="text-sm text-slate-600 mb-4">
                🗓 <strong>Follow-up:</strong> After {rx.followUpDays} days ({formatDate(new Date(Date.now() + rx.followUpDays * 86400000).toISOString())})
              </p>
            )}

            {/* Signature + footer */}
            <div className="flex items-end justify-between pt-4 border-t border-slate-100">
              <div>
                <p className="text-xs text-slate-400">This prescription is valid for 30 days from date of issue.</p>
                <p className="text-xs text-slate-300 mt-0.5">Generated via HospiBot · hospibot.in</p>
              </div>
              <div className="text-right">
                <div className="w-40 border-b border-slate-400 mb-1" />
                <p className="text-xs font-semibold text-slate-600">{drName}</p>
                {doctor?.regNumber && <p className="text-[10px] text-slate-400">Reg: {doctor.regNumber}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A5 landscape; margin: 8mm; }
          body { margin: 0; background: white; }
          .print\\:hidden { display: none !important; }
          #rx-print { box-shadow: none !important; border-radius: 0 !important; }
        }
      `}</style>
    </div>
  );
}
