'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { formatDate, formatINR } from '@/lib/utils';
import { Printer, ArrowLeft, CreditCard, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  PAID:    'bg-emerald-100 text-emerald-700',
  PARTIAL: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-amber-100 text-amber-700',
  OVERDUE: 'bg-red-100 text-red-700',
};

export default function PatientLedgerPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const [patient, setPatient]   = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [tenant, setTenant]     = useState<any>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/patients/${patientId}`),
      api.get('/billing/invoices', { params: { patientId, limit: 100 } }),
      api.get('/tenants/current').catch(() => ({ data: {} })),
    ]).then(([p, inv, t]) => {
      setPatient(p.data);
      setInvoices(inv.data.data ?? []);
      setTenant(t.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [patientId]);

  useEffect(() => {
    if (!loading && patient) setTimeout(() => window.print(), 500);
  }, [loading, patient]);

  if (loading) return <div className="flex items-center justify-center h-screen text-slate-400">Loading…</div>;
  if (!patient) return <div className="text-center py-20 text-slate-400">Patient not found</div>;

  const totalBilled  = invoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
  const totalPaid    = invoices.reduce((s, i) => s + (i.paidAmount  || 0), 0);
  const totalDue     = invoices.reduce((s, i) => s + (i.dueAmount   || 0), 0);
  const patName      = `${patient.firstName} ${patient.lastName || ''}`.trim();

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3 print:hidden">
        <button onClick={() => window.history.back()} className="flex items-center gap-2 text-slate-600 text-sm hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-slate-300">|</span>
        <p className="text-sm font-semibold text-slate-700">{patName} · Billing Ledger</p>
        <div className="flex-1" />
        <button onClick={() => window.print()}
          className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#0A5E4F]">
          <Printer className="w-4 h-4" /> Print Ledger
        </button>
      </div>

      <div className="max-w-3xl mx-auto my-6 print:my-0 px-4 print:px-0">
        <div className="bg-white shadow-xl rounded-2xl print:shadow-none print:rounded-none" id="ledger">

          {/* Header */}
          <div className="border-b-2 border-[#0D7C66] px-8 py-5 flex items-start justify-between">
            <div>
              {tenant?.logoUrl && <img src={tenant.logoUrl} alt="" className="h-8 mb-2 object-contain" />}
              <p className="font-black text-slate-900 text-lg">{tenant?.name || 'HospiBot Clinic'}</p>
              {tenant?.address && <p className="text-xs text-slate-500">{tenant.address}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Patient Billing Ledger</p>
              <p className="text-sm font-bold text-slate-900 mt-1">{patName}</p>
              {patient.healthId && <p className="text-xs font-mono text-slate-400">{patient.healthId}</p>}
              {patient.phone && <p className="text-xs text-slate-400">{patient.phone}</p>}
              <p className="text-xs text-slate-300 mt-1">As of {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-0 border-b border-slate-100">
            {[
              { l: 'Total Billed',  v: formatINR(totalBilled), icon: CreditCard,    color: '#334155' },
              { l: 'Amount Paid',   v: formatINR(totalPaid),   icon: CheckCircle2,  color: '#10B981' },
              { l: 'Balance Due',   v: formatINR(totalDue),    icon: AlertTriangle, color: totalDue > 0 ? '#EF4444' : '#10B981' },
            ].map(s => (
              <div key={s.l} className="px-6 py-4 text-center border-r border-slate-100 last:border-0">
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.v}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>

          {/* Invoices */}
          <div className="px-8 py-4">
            {invoices.length === 0 ? (
              <p className="text-center text-slate-300 py-10 text-sm">No invoices on record</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Invoice #', 'Date', 'Description', 'Billed', 'Paid', 'Balance', 'Status'].map(h => (
                      <th key={h} className="text-left py-2.5 pr-3 text-xs font-bold text-slate-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv, i) => (
                    <tr key={inv.id} className={`border-b border-slate-50 ${i % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                      <td className="py-2.5 pr-3 font-mono text-xs text-slate-600">{inv.invoiceNumber || inv.id?.slice(0, 8).toUpperCase()}</td>
                      <td className="py-2.5 pr-3 text-slate-500 text-xs whitespace-nowrap">{formatDate(inv.createdAt)}</td>
                      <td className="py-2.5 pr-3 text-slate-700 max-w-32 truncate">
                        {inv.items?.[0]?.description || inv.notes || 'Consultation'}
                        {inv.items?.length > 1 && <span className="text-slate-400 text-xs"> +{inv.items.length - 1}</span>}
                      </td>
                      <td className="py-2.5 pr-3 font-semibold text-slate-900">{formatINR(inv.totalAmount || 0)}</td>
                      <td className="py-2.5 pr-3 text-emerald-600 font-semibold">{formatINR(inv.paidAmount || 0)}</td>
                      <td className={`py-2.5 pr-3 font-bold ${(inv.dueAmount || 0) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {formatINR(inv.dueAmount || 0)}
                      </td>
                      <td className="py-2.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[inv.status] || 'bg-slate-100 text-slate-500'}`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200">
                    <td colSpan={3} className="pt-3 text-xs font-bold text-slate-600 uppercase">Total</td>
                    <td className="pt-3 font-black text-slate-900">{formatINR(totalBilled)}</td>
                    <td className="pt-3 font-black text-emerald-600">{formatINR(totalPaid)}</td>
                    <td className={`pt-3 font-black ${totalDue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatINR(totalDue)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-300">
            <p>Confidential — for patient and clinic use only</p>
            <p>HospiBot · hospibot.in</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          body { margin: 0; background: white; }
          .print\\:hidden { display: none !important; }
          #ledger { box-shadow: none !important; border-radius: 0 !important; }
        }
      `}</style>
    </div>
  );
}
