'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatDate, formatTime, formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';
import { ArrowLeft, Printer, CheckCircle2, Package, Loader2, MessageSquare } from 'lucide-react';

export default function DispenseOrderDetailPage() {
  const { id }    = useParams<{ id: string }>();
  const router    = useRouter();
  const [order, setOrder]     = useState<any>(null);
  const [tenant, setTenant]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dispensing, setDispensing] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/pharmacy/dispensing/${id}`),
      api.get('/tenants/current').catch(() => ({ data: {} })),
    ]).then(([o, t]) => { setOrder(o.data); setTenant(t.data); })
      .catch(() => toast.error('Order not found'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!loading && order?.status === 'DISPENSED') setTimeout(() => window.print(), 400);
  }, [loading, order?.status]);

  const dispense = async () => {
    setDispensing(true);
    try {
      await api.post(`/pharmacy/dispensing/${id}/dispense`);
      const res = await api.get(`/pharmacy/dispensing/${id}`);
      setOrder(res.data);
      toast.success('Order dispensed! Receipt sent via WhatsApp.');
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to dispense'); }
    finally { setDispensing(false); }
  };

  const sendWhatsApp = async () => {
    if (!order?.patient?.phone) { toast.error('No phone number for patient'); return; }
    try {
      const meds = (order.items ?? []).map((i: any) => `${i.productName || i.name} × ${i.quantity}`).join(', ');
      await api.post('/whatsapp/send', {
        to: order.patient.phone,
        message: `Hi ${order.patient?.firstName}, your prescription from ${tenant?.name || 'our clinic'} has been dispensed.\n\nMedicines: ${meds}\n\nTotal: ${formatINR(order.totalAmount || 0)}\n\nPlease follow dosage instructions carefully. Get well soon! 💊`,
      });
      toast.success('Receipt sent via WhatsApp!');
    } catch { toast.error('Failed to send WhatsApp'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-[#166834] animate-spin" /></div>;
  if (!order)  return <div className="text-center py-20 text-slate-400">Dispensing order not found</div>;

  const items   = order.items ?? order.medications ?? [];
  const patient = order.patient;
  const doctor  = order.doctor;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3 print:hidden sticky top-0 z-10">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-600 text-sm hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex-1 flex items-center gap-3">
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
            order.status === 'DISPENSED' ? 'bg-emerald-100 text-emerald-700' :
            order.status === 'PENDING'   ? 'bg-amber-100 text-amber-700' :
            'bg-slate-100 text-slate-600'
          }`}>{order.status}</span>
          {order.orderNumber && <span className="text-sm font-mono text-slate-400">{order.orderNumber}</span>}
        </div>
        {order.status !== 'DISPENSED' && (
          <button onClick={dispense} disabled={dispensing}
            className="flex items-center gap-2 bg-[#166834] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-60">
            {dispensing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {dispensing ? 'Dispensing…' : 'Mark Dispensed'}
          </button>
        )}
        <button onClick={sendWhatsApp}
          className="flex items-center gap-2 bg-[#25D366] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90">
          <MessageSquare className="w-4 h-4" /> WhatsApp
        </button>
        <button onClick={() => window.print()}
          className="flex items-center gap-2 bg-slate-700 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-slate-800">
          <Printer className="w-4 h-4" /> Print
        </button>
      </div>

      {/* Receipt */}
      <div className="max-w-md mx-auto my-6 print:my-0 px-4 print:px-0">
        <div className="bg-white shadow-xl rounded-2xl print:shadow-none print:rounded-none overflow-hidden" id="receipt">

          {/* Header */}
          <div className="bg-[#166834] px-6 py-5 text-white text-center">
            {tenant?.logoUrl && <img src={tenant.logoUrl} alt="" className="h-8 mx-auto mb-2 object-contain" />}
            <p className="font-black text-lg">{tenant?.name || 'HospiBot Pharmacy'}</p>
            {tenant?.address && <p className="text-green-200 text-xs mt-0.5">{tenant.address}</p>}
            <p className="text-[10px] text-green-300 mt-0.5 font-mono">
              {tenant?.settings?.pharmacy?.licenseNumber || 'Drug License: —'}
            </p>
          </div>

          <div className="px-6 py-5 space-y-4">
            {/* Receipt header */}
            <div className="flex items-start justify-between border-b border-dashed border-slate-200 pb-4">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Dispensing Receipt</p>
                <p className="font-mono text-sm font-bold text-slate-700">{order.orderNumber || id?.slice(0,8).toUpperCase()}</p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p>{formatDate(order.createdAt)}</p>
                <p className="mt-0.5">{formatTime(order.createdAt)}</p>
                {order.status === 'DISPENSED' && (
                  <span className="inline-flex items-center gap-1 mt-1 text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-3 h-3" /> Dispensed
                  </span>
                )}
              </div>
            </div>

            {/* Patient & Doctor */}
            <div className="grid grid-cols-2 gap-4 border-b border-dashed border-slate-200 pb-4">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Patient</p>
                <p className="font-bold text-slate-900 text-sm">{patient ? `${patient.firstName} ${patient.lastName || ''}` : '—'}</p>
                {patient?.healthId && <p className="text-xs font-mono text-slate-400">{patient.healthId}</p>}
                {patient?.phone && <p className="text-xs text-slate-500">{patient.phone}</p>}
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Prescribed By</p>
                {doctor ? (
                  <>
                    <p className="font-semibold text-slate-800 text-sm">Dr. {doctor.user?.firstName} {doctor.user?.lastName || ''}</p>
                    {doctor.regNumber && <p className="text-xs text-slate-400">Reg: {doctor.regNumber}</p>}
                  </>
                ) : <p className="text-slate-400 text-sm">—</p>}
              </div>
            </div>

            {/* Items */}
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">Medicines Dispensed</p>
              <div className="space-y-2">
                {items.length === 0 ? (
                  <p className="text-slate-400 text-sm">No items</p>
                ) : (
                  items.map((item: any, i: number) => (
                    <div key={i} className="flex items-start justify-between py-1.5 border-b border-slate-50 last:border-0">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900">{item.productName || item.name || '—'}</p>
                        {(item.dosage || item.instructions) && (
                          <p className="text-xs text-slate-400 mt-0.5">{item.dosage || item.instructions}</p>
                        )}
                        {item.batchNumber && <p className="text-[10px] text-slate-300 mt-0.5">Batch: {item.batchNumber}</p>}
                      </div>
                      <div className="text-right ml-3">
                        <p className="text-sm font-bold text-slate-900">× {item.quantity || 1}</p>
                        {item.unitPrice && <p className="text-xs text-slate-500">{formatINR(item.unitPrice)}/unit</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Total */}
            {order.totalAmount && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <p className="font-bold text-slate-900">Total Amount</p>
                <p className="text-xl font-black text-[#166834]">{formatINR(order.totalAmount)}</p>
              </div>
            )}

            {/* Notes */}
            {order.notes && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                <p className="text-xs font-semibold text-amber-700 mb-0.5">Pharmacist Notes</p>
                <p className="text-xs text-amber-800">{order.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="text-center pt-2 border-t border-slate-100 space-y-1">
              <p className="text-xs text-slate-500 font-medium">Please follow dosage instructions carefully</p>
              <p className="text-xs text-slate-400">Keep medicines out of reach of children</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <div className="h-px flex-1 bg-slate-200" />
                <p className="text-[10px] text-slate-300">HospiBot Pharmacy</p>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: 80mm auto; margin: 0; }
          body { margin: 0; background: white; }
          .print\\:hidden { display: none !important; }
          #receipt { box-shadow: none !important; border-radius: 0 !important; }
        }
      `}</style>
    </div>
  );
}
