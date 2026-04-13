'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate, formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Plus, Search, Download, RefreshCw, X, Loader2, ChevronLeft, ChevronRight, Printer,
  TrendingUp, CreditCard, AlertCircle, CheckCircle2, FileText, Trash2,
  Send, IndianRupee, Percent,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600', SENT: 'bg-blue-100 text-blue-700',
  PAID: 'bg-emerald-100 text-emerald-700', PARTIALLY_PAID: 'bg-amber-100 text-amber-700',
  OVERDUE: 'bg-red-100 text-red-700', CANCELLED: 'bg-slate-100 text-slate-500',
  REFUNDED: 'bg-purple-100 text-purple-700',
};

const GST_RATES = [0, 5, 12, 18, 28];

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] focus:ring-2 focus:ring-[#0D7C66]/10 outline-none transition-all placeholder:text-slate-400';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number; // in rupees for UI, converted to paise on submit
  gstRate: number;
  amount: number;
  gstAmount: number;
}

function newItem(): LineItem {
  const id = Math.random().toString(36).slice(2);
  return { id, description: '', quantity: 1, rate: 0, gstRate: 18, amount: 0, gstAmount: 0 };
}

function calcItem(item: LineItem): LineItem {
  const amount = item.quantity * item.rate;
  const gstAmount = (amount * item.gstRate) / 100;
  return { ...item, amount, gstAmount };
}

export default function BillingPage() {
  const [invoices, setInvoices]   = useState<any[]>([]);
  const [meta, setMeta]           = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [revenue, setRevenue]     = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [statusFilter, setStatus] = useState('');
  const [search, setSearch]       = useState('');
  const [debSearch, setDebSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [patients, setPatients]   = useState<any[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<any[]>([]);

  const [form, setForm] = useState({
    patientId: '', patientName: '', notes: '', discount: 0,
    items: [newItem()] as LineItem[],
  });

  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (debSearch) params.search = debSearch;
      const [invRes, revRes] = await Promise.all([
        api.get('/billing/invoices', { params }),
        api.get('/billing/revenue?period=month').catch(() => ({ data: null })),
      ]);
      setInvoices(invRes.data.data ?? []);
      setMeta(invRes.data.meta ?? { page: 1, limit: 20, total: 0, totalPages: 1 });
      setRevenue(revRes.data);
    } catch { toast.error('Failed to load billing'); }
    finally { setLoading(false); }
  }, [statusFilter, debSearch]);

  useEffect(() => { load(1); }, [load]);

  useEffect(() => {
    if (patientSearch.length < 2) { setPatientResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await api.get('/patients', { params: { search: patientSearch, limit: 5 } });
        setPatientResults(r.data.data ?? []);
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(t);
  }, [patientSearch]);

  // Line item management
  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setForm(f => ({
      ...f,
      items: f.items.map(item => item.id === id ? calcItem({ ...item, [field]: value }) : item),
    }));
  };
  const addItem = () => setForm(f => ({ ...f, items: [...f.items, newItem()] }));
  const removeItem = (id: string) => setForm(f => ({ ...f, items: f.items.filter(i => i.id !== id) }));

  // Totals
  const subtotal  = form.items.reduce((s, i) => s + i.amount, 0);
  const gstTotal  = form.items.reduce((s, i) => s + i.gstAmount, 0);
  const discount  = form.discount;
  const total     = subtotal + gstTotal - discount;

  const handleCreate = async () => {
    if (!form.patientId) { toast.error('Select a patient'); return; }
    if (form.items.every(i => !i.description)) { toast.error('Add at least one item'); return; }
    setSubmitting(true);
    try {
      await api.post('/billing/invoices', {
        patientId: form.patientId,
        items: form.items.filter(i => i.description).map(i => ({
          description: i.description,
          quantity: i.quantity,
          rate: Math.round(i.rate * 100), // convert to paise
          gstRate: i.gstRate,
          amount: Math.round(i.amount * 100),
        })),
        subtotal:    Math.round(subtotal * 100),
        gstAmount:   Math.round(gstTotal * 100),
        discount:    Math.round(discount * 100),
        totalAmount: Math.round(total * 100),
        notes: form.notes,
      });
      toast.success('Invoice created! Payment link can now be sent via WhatsApp.');
      setShowCreate(false);
      setForm({ patientId: '', patientName: '', notes: '', discount: 0, items: [newItem()] });
      load(1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create invoice');
    } finally { setSubmitting(false); }
  };

  const recordPayment = async () => {
    if (!payInvoice || !payAmount) { toast.error('Enter payment amount'); return; }
    setRecording(true);
    try {
      await api.post(`/billing/invoices/${payInvoice.id}/payments`, {
        amount: Math.round(Number(payAmount) * 100), // convert to paise
        method: payMethod,
        reference: payRef || undefined,
      });
      toast.success(`Payment of ₹${payAmount} recorded!`);
      setPayInvoice(null); setPayAmount(''); setPayRef('');
      load(meta.page);
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setRecording(false); }
  };


  const exportTally = async () => {
    try {
      const res = await api.get('/billing/export/tally', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tally-export-${new Date().toISOString().slice(0,7)}.xml`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Tally XML exported! Import via Gateway → Import Data in Tally.');
    } catch { toast.error('Tally export failed. Please try again.'); }
  };

  const sendPaymentLink = async (invoiceId: string) => {
    try {
      const res = await api.post(`/billing/invoices/${invoiceId}/payment-link`);
      if (res.data?.paymentLink) {
        await navigator.clipboard.writeText(res.data.paymentLink).catch(() => {});
      }
      toast.success('Payment link sent via WhatsApp!');
    } catch { toast.error('Failed to send payment link'); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Billing & Invoices</h1>
          <p className="text-sm text-slate-500 mt-0.5">{meta.total.toLocaleString('en-IN')} total invoices</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load(meta.page)} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-[#0D7C66] hover:bg-[#0A5E4F] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Create Invoice
          </button>
        </div>
      </div>

      {/* Revenue KPIs */}
      {revenue && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'This Month Revenue', value: formatINR(revenue.totalRevenue ?? 0),    color: '#0D7C66', icon: TrendingUp },
            { label: 'Total Collected',    value: formatINR(revenue.totalCollected ?? 0),  color: '#10B981', icon: CheckCircle2 },
            { label: 'Outstanding',        value: formatINR(revenue.totalOutstanding ?? 0), color: '#EF4444', icon: AlertCircle },
            { label: 'Invoices (Month)',   value: (revenue.invoiceCount ?? 0).toLocaleString('en-IN'), color: '#3B82F6', icon: FileText },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
                <span className="text-xs text-slate-500">{s.label}</span>
              </div>
              <p className="text-xl font-bold text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1 min-w-52">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input className="bg-transparent text-sm outline-none flex-1 placeholder:text-slate-400"
            placeholder="Search by invoice no. or patient…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={statusFilter} onChange={e => setStatus(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-[#0D7C66] cursor-pointer">
          <option value="">All Statuses</option>
          {['DRAFT','SENT','PAID','PARTIALLY_PAID','OVERDUE','CANCELLED'].map(s => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
        <button className="flex items-center gap-1.5 border border-slate-200 text-slate-600 text-sm px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      {/* Invoice table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Invoice #</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Patient</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Paid</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Due</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 8 }).map((__, j) => (
                  <td key={j} className="px-5 py-4"><div className="animate-pulse bg-slate-200 rounded h-4" /></td>
                ))}</tr>
              ))
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-20 text-center">
                  <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm font-medium">No invoices found</p>
                </td>
              </tr>
            ) : invoices.map(inv => (
              <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors group">
                <td className="px-5 py-3.5 font-mono text-sm font-bold text-[#0D7C66]">{inv.invoiceNumber}</td>
                <td className="px-5 py-3.5 text-sm text-slate-900 font-medium">
                  {inv.patient?.firstName} {inv.patient?.lastName || ''}
                </td>
                <td className="px-5 py-3.5 text-sm text-slate-500">{formatDate(inv.createdAt)}</td>
                <td className="px-5 py-3.5 text-sm font-bold text-slate-900">{formatINR(inv.totalAmount)}</td>
                <td className="px-5 py-3.5 text-sm text-emerald-700 font-medium">{formatINR(inv.paidAmount)}</td>
                <td className="px-5 py-3.5 text-sm font-bold">
                  <span className={inv.dueAmount > 0 ? 'text-red-600' : 'text-slate-300'}>{formatINR(inv.dueAmount)}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[inv.status] || 'bg-slate-100 text-slate-600'}`}>
                    {inv.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <a href={`/clinical/billing/${inv.id}`} target="_blank" rel="noreferrer"
                      className="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1">
                      <Printer className="w-3 h-3" /> Print
                    </a>
                    {inv.status !== 'PAID' && inv.dueAmount > 0 && (
                      <button onClick={() => { setPayInvoice(inv); setPayAmount((inv.dueAmount / 100).toString()); }}
                        className="text-[11px] font-semibold text-[#0D7C66] bg-[#E8F5F0] border border-[#0D7C66]/30 px-2.5 py-1.5 rounded-lg hover:bg-[#0D7C66]/10 transition-colors flex items-center gap-1">
                        ₹ Record
                      </button>
                    )}
                    {inv.status !== 'PAID' && (
                      <button onClick={() => sendPaymentLink(inv.id)}
                        className="text-[11px] font-semibold text-white bg-[#25D366] px-2.5 py-1.5 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1">
                        <Send className="w-3 h-3" /> Pay Link
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && meta.total > 0 && (
          <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">Showing {(meta.page-1)*meta.limit+1}–{Math.min(meta.page*meta.limit, meta.total)} of {meta.total}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => load(meta.page-1)} disabled={meta.page===1} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-600 px-3">{meta.page} / {meta.totalPages}</span>
              <button onClick={() => load(meta.page+1)} disabled={meta.page>=meta.totalPages} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-lg font-bold text-slate-900">Create Invoice</h2>
              <button onClick={() => setShowCreate(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Patient */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Patient <span className="text-red-500">*</span></label>
                {form.patientId ? (
                  <div className="flex items-center justify-between bg-[#E8F5F0] rounded-xl px-4 py-2.5 border border-[#0D7C66]/30">
                    <span className="text-sm font-semibold text-[#0D7C66]">{form.patientName}</span>
                    <button onClick={() => setForm(f => ({ ...f, patientId: '', patientName: '' }))}><X className="w-4 h-4 text-slate-400" /></button>
                  </div>
                ) : (
                  <div className="relative">
                    <input className={inputCls} placeholder="Search patient…" value={patientSearch} onChange={e => setPatientSearch(e.target.value)} />
                    {patientResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
                        {patientResults.map(p => (
                          <button key={p.id} onClick={() => { setForm(f => ({ ...f, patientId: p.id, patientName: `${p.firstName} ${p.lastName || ''}` })); setPatientSearch(''); setPatientResults([]); }}
                            className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0">
                            <p className="text-sm font-medium text-slate-900">{p.firstName} {p.lastName || ''}</p>
                            <p className="text-xs text-slate-400">{p.phone}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Line items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Invoice Items</label>
                  <button onClick={addItem} className="text-xs font-medium text-[#0D7C66] flex items-center gap-1 hover:underline">
                    <Plus className="w-3.5 h-3.5" /> Add Item
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Description</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500 w-16">Qty</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500 w-24">Rate (₹)</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500 w-20">GST %</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500 w-24">Amount</th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {form.items.map(item => (
                        <tr key={item.id}>
                          <td className="px-3 py-2">
                            <input className="w-full text-sm outline-none bg-transparent placeholder:text-slate-300 focus:placeholder:text-slate-400"
                              placeholder="Consultation fee, Lab test…"
                              value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} />
                          </td>
                          <td className="px-3 py-2">
                            <input type="number" min={1} className="w-full text-sm text-center outline-none bg-transparent"
                              value={item.quantity} onChange={e => updateItem(item.id, 'quantity', Number(e.target.value))} />
                          </td>
                          <td className="px-3 py-2">
                            <input type="number" min={0} className="w-full text-sm text-center outline-none bg-transparent"
                              value={item.rate || ''} placeholder="0"
                              onChange={e => updateItem(item.id, 'rate', Number(e.target.value))} />
                          </td>
                          <td className="px-3 py-2">
                            <select className="w-full text-sm text-center outline-none bg-transparent cursor-pointer"
                              value={item.gstRate} onChange={e => updateItem(item.id, 'gstRate', Number(e.target.value))}>
                              {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-2 text-right text-sm font-semibold text-slate-900">
                            ₹{(item.amount + item.gstAmount).toFixed(0)}
                          </td>
                          <td className="px-2 py-2">
                            {form.items.length > 1 && (
                              <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST</span>
                    <span>₹{gstTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Discount (₹)</span>
                    <input type="number" min={0} max={total + discount}
                      className="w-24 text-right border border-slate-200 rounded-lg px-2 py-1 text-sm outline-none focus:border-[#0D7C66]"
                      value={form.discount || ''} placeholder="0"
                      onChange={e => setForm(f => ({ ...f, discount: Number(e.target.value) }))} />
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 text-base border-t border-slate-200 pt-2">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Notes</label>
                <textarea className={`${inputCls} resize-none`} rows={2} placeholder="Payment terms, special instructions…"
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
              <button onClick={() => setShowCreate(false)} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors">Cancel</button>
              <div className="flex items-center gap-2">
                <p className="text-sm text-slate-500">Total: <span className="font-bold text-slate-900">₹{total.toFixed(2)}</span></p>
                <button onClick={handleCreate} disabled={submitting}
                  className="bg-[#0D7C66] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#0A5E4F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Creating…' : 'Create Invoice'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {payInvoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setPayInvoice(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Record Payment</h2>
                <p className="text-xs text-slate-400 mt-0.5">{payInvoice.invoiceNumber} · Due: ₹{(payInvoice.dueAmount/100).toLocaleString('en-IN')}</p>
              </div>
              <button onClick={() => setPayInvoice(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4"/></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Amount (₹) *</label>
                <input type="number" min={0} step={1} className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] outline-none"
                  value={payAmount} onChange={e => setPayAmount(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Payment Method</label>
                <div className="grid grid-cols-4 gap-2">
                  {['CASH','CARD','UPI','CHEQUE'].map(m => (
                    <button key={m} onClick={() => setPayMethod(m)}
                      className={`py-2 text-xs font-bold rounded-xl border-2 transition-all ${payMethod === m ? 'border-[#0D7C66] bg-[#E8F5F0] text-[#0D7C66]' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Reference / Transaction ID</label>
                <input className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] outline-none"
                  placeholder="UPI ref, cheque no., etc." value={payRef} onChange={e => setPayRef(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
              <button onClick={() => setPayInvoice(null)} className="text-sm text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-100">Cancel</button>
              <button onClick={recordPayment} disabled={recording || !payAmount}
                className="bg-[#0D7C66] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#0A5E4F] disabled:opacity-50 flex items-center gap-2">
                {recording && <Loader2 className="w-4 h-4 animate-spin"/>}
                Record ₹{Number(payAmount || 0).toLocaleString('en-IN')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
