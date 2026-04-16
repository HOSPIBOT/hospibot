'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { formatDate, formatINR } from '@/lib/utils';
import { Printer, ArrowLeft, Loader2, Shield, Heart, Pill, FlaskConical, CreditCard } from 'lucide-react';

export default function PatientSummaryPage() {
  const id = (useParams() as any)?.['id'] ?? '';
  const [patient, setPatient] = useState<any>(null);
  const [tenant, setTenant]   = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/patients/${id}`),
      api.get('/tenants/current').catch(() => ({ data: {} })),
    ]).then(([p, t]) => {
      setPatient(p.data);
      setTenant(t.data);
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!loading && patient) setTimeout(() => window.print(), 600);
  }, [loading, patient]);

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 text-[#0D7C66] animate-spin" /></div>;
  if (!patient) return <div className="text-center py-20 text-slate-400">Patient not found</div>;

  const age = patient.dateOfBirth
    ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / 3.156e10)
    : null;

  const activePrescriptions = (patient.prescriptions || []).filter((rx: any) => rx.isActive);
  const recentVisits        = (patient.visits || []).slice(0, 3);
  const recentInvoices      = (patient.invoices || []).slice(0, 5);
  const recentLab           = (patient.labOrders || []).slice(0, 4);
  const totalDue            = recentInvoices.reduce((s: any, i: any) => s + (i.dueAmount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3 print:hidden">
        <button onClick={() => window.history.back()} className="flex items-center gap-2 text-slate-600 text-sm hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex-1" />
        <button onClick={() => window.print()}
          className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#0A5E4F]">
          <Printer className="w-4 h-4" /> Print / PDF
        </button>
      </div>

      {/* Summary sheet */}
      <div className="max-w-4xl mx-auto my-6 print:my-0 px-4 print:px-0">
        <div className="bg-white shadow-xl rounded-2xl print:shadow-none print:rounded-none overflow-hidden" id="summary">

          {/* Header */}
          <div className="bg-gradient-to-r from-[#0D7C66] to-[#0A5E4F] px-8 py-5 text-white">
            <div className="flex items-start justify-between">
              <div>
                {tenant?.logoUrl && <img src={tenant.logoUrl} alt="" className="h-8 mb-2 object-contain" />}
                <p className="text-xs font-semibold text-emerald-300 uppercase tracking-widest mb-1">Patient Health Summary</p>
                <h1 className="text-xl font-black">{tenant?.name || 'HospiBot Clinic'}</h1>
                {tenant?.address && <p className="text-emerald-200 text-xs mt-0.5">{tenant.address}</p>}
              </div>
              <div className="text-right text-emerald-200 text-xs">
                <p>Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                {patient.healthId && <p className="mt-1 font-mono font-bold text-white text-sm">{patient.healthId}</p>}
              </div>
            </div>
          </div>

          <div className="px-8 py-6 space-y-5">
            {/* Patient demographics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Patient Information</h2>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  {[
                    { l: 'Full Name',    v: `${patient.firstName} ${patient.lastName || ''}`.trim() },
                    { l: 'Phone',        v: patient.phone },
                    { l: 'Age / Gender', v: [age ? `${age} years` : null, patient.gender?.toLowerCase()].filter(Boolean).join(' · ') || '—' },
                    { l: 'Email',        v: patient.email || '—' },
                    { l: 'Date of Birth',v: patient.dateOfBirth ? formatDate(patient.dateOfBirth) : '—' },
                    { l: 'Address',      v: [patient.address, patient.city, patient.pincode].filter(Boolean).join(', ') || '—' },
                  ].map((f: any) => (
                    <div key={f.l}>
                      <span className="text-slate-400 text-xs">{f.l}: </span>
                      <span className="font-semibold text-slate-900">{f.v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Clinical Flags</h2>
                <div className={`rounded-xl px-3 py-2 flex items-center gap-2 ${patient.bloodGroup ? 'bg-red-50 border border-red-100' : 'bg-slate-50 border border-slate-100'}`}>
                  <Heart className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  <span className="text-xs font-semibold text-slate-700">Blood Group: <strong>{patient.bloodGroup || 'Unknown'}</strong></span>
                </div>
                {(patient.allergies?.length ?? 0) > 0 && (
                  <div className="rounded-xl px-3 py-2 bg-red-50 border border-red-200">
                    <p className="text-xs font-bold text-red-700">⚠ ALLERGIES</p>
                    <p className="text-xs text-red-600 mt-0.5">{patient.allergies.join(', ')}</p>
                  </div>
                )}
                {(patient.chronicConditions?.length ?? 0) > 0 && (
                  <div className="rounded-xl px-3 py-2 bg-amber-50 border border-amber-200">
                    <p className="text-xs font-bold text-amber-700">Chronic Conditions</p>
                    <p className="text-xs text-amber-600 mt-0.5">{patient.chronicConditions.join(', ')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Active Prescriptions */}
            {activePrescriptions.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Pill className="w-3.5 h-3.5" /> Active Prescriptions ({activePrescriptions.length})
                </h2>
                <div className="space-y-2">
                  {activePrescriptions.slice(0, 3).map((rx: any, i: number) => {
                    const meds = rx.medications as any[];
                    return (
                      <div key={i} className="border border-slate-100 rounded-xl px-4 py-2.5 flex items-start gap-3">
                        <div className="flex-1">
                          <p className="text-xs text-slate-400 mb-1">{formatDate(rx.createdAt)}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {meds.slice(0, 4).map((m: any, j: number) => (
                              <span key={j} className="text-[10px] font-medium bg-[#E8F5F0] text-[#0D7C66] px-2 py-0.5 rounded-full">
                                {m.name} {m.dosage} · {m.frequency}
                              </span>
                            ))}
                            {meds.length > 4 && <span className="text-[10px] text-slate-400">+{meds.length - 4} more</span>}
                          </div>
                        </div>
                        {rx.refillDueDate && (
                          <span className="text-[10px] text-amber-600 flex-shrink-0">Refill: {formatDate(rx.refillDueDate)}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Lab Orders */}
            {recentLab.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <FlaskConical className="w-3.5 h-3.5" /> Recent Lab Orders
                </h2>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>{['Order #', 'Tests', 'Date', 'Status'].map((h: any) => (
                        <th key={h} className="px-3 py-2 text-left font-semibold text-slate-500 uppercase">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {recentLab.map((o: any, i: number) => (
                        <tr key={i}>
                          <td className="px-3 py-2 font-mono text-slate-600">{o.orderNumber}</td>
                          <td className="px-3 py-2 text-slate-700">
                            {(o.tests as any[])?.slice(0, 2).map((t: any) => t.testName || t).join(', ')}
                            {(o.tests as any[])?.length > 2 && ` +${(o.tests as any[]).length - 2}`}
                          </td>
                          <td className="px-3 py-2 text-slate-500">{formatDate(o.createdAt)}</td>
                          <td className="px-3 py-2">
                            <span className={`font-bold px-2 py-0.5 rounded-full ${o.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                              {o.status?.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Recent Visits */}
            {recentVisits.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Recent Visits</h2>
                <div className="space-y-2">
                  {recentVisits.map((v: any, i: number) => (
                    <div key={i} className="border border-slate-100 rounded-xl px-4 py-2.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-semibold text-slate-900">{formatDate(v.createdAt)}</p>
                          {v.diagnosisText && <p className="text-xs text-slate-600 mt-0.5"><span className="font-medium">Dx:</span> {v.diagnosisText}</p>}
                          {v.chiefComplaint && <p className="text-xs text-slate-500 mt-0.5">{v.chiefComplaint}</p>}
                        </div>
                        {v.followUpDays && (
                          <span className="text-[10px] text-blue-600 flex-shrink-0">Follow-up: {v.followUpDays}d</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Billing summary */}
            {recentInvoices.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5" /> Billing Summary
                </h2>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {[
                    { l: 'Total Invoices', v: recentInvoices.length },
                    { l: 'Total Billed',   v: formatINR(recentInvoices.reduce((s: any, i: any) => s + (i.totalAmount || 0), 0)) },
                    { l: 'Balance Due',    v: formatINR(totalDue), highlight: totalDue > 0 },
                  ].map((s: any) => (
                    <div key={s.l} className={`rounded-xl px-3 py-2 border ${s.highlight ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
                      <p className="text-[10px] text-slate-400">{s.l}</p>
                      <p className={`text-sm font-bold ${s.highlight ? 'text-red-700' : 'text-slate-900'}`}>{s.v}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs text-slate-300">
              <p className="flex items-center gap-1"><Shield className="w-3 h-3" /> DPDPA Compliant · HospiBot</p>
              <p>This is a confidential medical summary. Handle with care.</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          body { margin: 0; background: white; }
          .print\\:hidden { display: none !important; }
          #summary { box-shadow: none !important; border-radius: 0 !important; }
        }
      `}</style>
    </div>
  );
}
