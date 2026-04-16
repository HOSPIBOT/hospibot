'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { formatDate, formatINR } from '@/lib/utils';
import { Printer, ArrowLeft, MessageSquare, Loader2, Download } from 'lucide-react';
import { RazorpayCheckout } from '@/components/ui/RazorpayCheckout';

export default function InvoicePrintPage() {
  const id = (useParams() as any)?.['id'] ?? '';
  const [invoice, setInvoice] = useState<any>(null);
  const [tenant, setTenant]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/billing/invoices/${id}`),
      api.get('/tenants/current'),
    ]).then(([inv, ten]) => {
      setInvoice(inv.data);
      setTenant(ten.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const sendWhatsApp = async () => {
    if (!invoice) return;
    setSending(true);
    try {
      await api.post(`/billing/invoices/${id}/send`);
      alert('Invoice sent to patient via WhatsApp!');
    } catch { alert('Failed to send'); }
    finally { setSending(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#0D7C66] animate-spin" />
      </div>
    );
  }

  if (!invoice) {
    return <div className="text-center py-20 text-slate-400">Invoice not found</div>;
  }

  const items = invoice.items as any[];
  const subtotal = items.reduce((s: any, i: any) => s + (i.unitPrice * i.quantity), 0);
  const gstTotal = items.reduce((s: any, i: any) => s + (i.gstAmount || 0), 0);
  const discount = invoice.discountAmount || 0;
  const total    = invoice.totalAmount;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Toolbar — hidden on print */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3 print:hidden">
        <button onClick={() => window.history.back()} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex-1" />
        <button onClick={sendWhatsApp} disabled={sending}
          className="flex items-center gap-2 bg-[#25D366] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-60 transition-opacity">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
          Send via WhatsApp
        </button>
        {invoice && invoice.paymentStatus !== 'PAID' && (
          <RazorpayCheckout
            invoiceId={id!}
            invoiceNumber={invoice.invoiceNumber}
            amount={invoice.dueAmount || invoice.totalAmount}
            patientName={`${invoice.patient?.firstName} ${invoice.patient?.lastName || ''}`.trim()}
            patientPhone={invoice.patient?.phone}
            patientEmail={invoice.patient?.email}
            onSuccess={() => window.location.reload()}
          />
        )}
        <button onClick={() => window.print()}
          className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#0A5E4F] transition-colors">
          <Printer className="w-4 h-4" /> Print / PDF
        </button>
      </div>

      {/* A4 Invoice */}
      <div className="max-w-3xl mx-auto my-8 print:my-0">
        <div className="bg-white shadow-xl rounded-2xl print:shadow-none print:rounded-none overflow-hidden" id="invoice-print">

          {/* Header */}
          <div className="bg-gradient-to-r from-[#0D7C66] to-[#0A5E4F] px-8 py-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                {tenant?.logoUrl && (
                  <img src={tenant.logoUrl} alt="Logo" className="h-12 mb-3 object-contain" />
                )}
                <h1 className="text-2xl font-bold">{tenant?.name || 'HospiBot Clinic'}</h1>
                {tenant?.address && <p className="text-emerald-200 text-sm mt-0.5">{tenant.address}</p>}
                {tenant?.city && <p className="text-emerald-200 text-sm">{tenant.city}</p>}
                {tenant?.phone && <p className="text-emerald-200 text-sm">Ph: {tenant.phone}</p>}
                {tenant?.gstNumber && <p className="text-emerald-300 text-xs mt-1">GSTIN: {tenant.gstNumber}</p>}
              </div>
              <div className="text-right">
                <p className="text-emerald-200 text-sm font-semibold uppercase tracking-widest">Tax Invoice</p>
                <p className="text-3xl font-bold mt-1">{invoice.invoiceNumber}</p>
                <p className="text-emerald-200 text-sm mt-1">{formatDate(invoice.createdAt)}</p>
                <div className={`mt-3 px-3 py-1.5 rounded-full text-xs font-bold ${
                  invoice.paymentStatus === 'PAID' ? 'bg-emerald-400 text-white' :
                  invoice.paymentStatus === 'OVERDUE' ? 'bg-red-400 text-white' :
                  'bg-amber-400 text-white'
                }`}>
                  {invoice.paymentStatus}
                </div>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 space-y-6">
            {/* Bill To */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Bill To</p>
                <p className="font-bold text-slate-900 text-base">
                  {invoice.patient?.firstName} {invoice.patient?.lastName || ''}
                </p>
                <p className="text-sm text-slate-500 mt-0.5">{invoice.patient?.phone}</p>
                {invoice.patient?.email && <p className="text-sm text-slate-500">{invoice.patient.email}</p>}
                {invoice.patient?.healthId && (
                  <p className="text-xs text-slate-400 mt-1 font-mono">Health ID: {invoice.patient.healthId}</p>
                )}
              </div>
              {invoice.doctor && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Consulting Doctor</p>
                  <p className="font-bold text-slate-900">
                    Dr. {invoice.doctor?.user?.firstName} {invoice.doctor?.user?.lastName || ''}
                  </p>
                  {invoice.doctor?.specialization && (
                    <p className="text-sm text-slate-500">{invoice.doctor.specialization}</p>
                  )}
                </div>
              )}
            </div>

            {/* Line items table */}
            <div>
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 rounded-xl">
                    <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wide px-4 py-3 rounded-l-xl">#</th>
                    <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wide px-4 py-3">Description</th>
                    <th className="text-center text-xs font-bold text-slate-500 uppercase tracking-wide px-4 py-3">Qty</th>
                    <th className="text-right text-xs font-bold text-slate-500 uppercase tracking-wide px-4 py-3">Unit Price</th>
                    <th className="text-right text-xs font-bold text-slate-500 uppercase tracking-wide px-4 py-3">GST</th>
                    <th className="text-right text-xs font-bold text-slate-500 uppercase tracking-wide px-4 py-3 rounded-r-xl">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {items.map((item: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-sm text-slate-400">{i + 1}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">{item.description}</p>
                        {item.hsnCode && <p className="text-xs text-slate-400">HSN: {item.hsnCode}</p>}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-slate-700 text-right">₹{(item.unitPrice / 100).toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-slate-500 text-right">
                        {item.gstRate ? `${item.gstRate}%` : '—'}
                        {item.gstAmount ? ` (₹${(item.gstAmount/100).toFixed(2)})` : ''}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-slate-900 text-right">
                        ₹{((item.unitPrice * item.quantity + (item.gstAmount || 0)) / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm text-slate-600 py-1">
                  <span>Subtotal</span>
                  <span>₹{(subtotal / 100).toFixed(2)}</span>
                </div>
                {gstTotal > 0 && (
                  <div className="flex justify-between text-sm text-slate-600 py-1">
                    <span>GST</span>
                    <span>₹{(gstTotal / 100).toFixed(2)}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600 py-1">
                    <span>Discount</span>
                    <span>- ₹{(discount / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg text-slate-900 border-t border-slate-200 pt-2">
                  <span>Total</span>
                  <span>₹{(total / 100).toFixed(2)}</span>
                </div>
                {invoice.paidAmount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600 py-1">
                    <span>Paid</span>
                    <span>₹{(invoice.paidAmount / 100).toFixed(2)}</span>
                  </div>
                )}
                {invoice.paymentStatus !== 'PAID' && (
                  <div className="flex justify-between font-bold text-red-600 border-t border-slate-100 pt-2">
                    <span>Balance Due</span>
                    <span>₹{((total - (invoice.paidAmount || 0)) / 100).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment QR / UPI */}
            {invoice.paymentStatus !== 'PAID' && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Payment Options</p>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-300 text-xs text-center p-2">
                    QR Code (UPI)
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Pay via UPI</p>
                    <p className="text-xs text-slate-400 mt-0.5">{tenant?.upiId || 'UPI ID not configured'}</p>
                    <p className="text-xs text-slate-400 mt-1">Reference: {invoice.invoiceNumber}</p>
                    {invoice.paymentLink && (
                      <a href={invoice.paymentLink} target="_blank" rel="noreferrer"
                        className="text-xs text-[#0D7C66] underline mt-1 block">
                        Online Payment Link →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {invoice.notes && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Notes</p>
                <p className="text-sm text-slate-500">{invoice.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs text-slate-400">
              <p>Generated via HospiBot · hospibot.in</p>
              <p>This is a computer-generated invoice and does not require a signature</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { margin: 0; }
          .print\\:hidden { display: none !important; }
          #invoice-print { box-shadow: none !important; border-radius: 0 !important; }
        }
      `}</style>
    </div>
  );
}
