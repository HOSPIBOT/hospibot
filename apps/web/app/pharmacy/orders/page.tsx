'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate, formatTime, formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  ShoppingCart, Plus, Search, RefreshCw, X, Loader2,
  CheckCircle2, Send, AlertTriangle, ChevronLeft, ChevronRight, Pill,
} from 'lucide-react';

const NAV_COLOR = '#166534';
const STATUS_COLORS: Record<string, string> = {
  PENDING:  'bg-amber-100 text-amber-700',
  DISPENSED:'bg-emerald-100 text-emerald-700',
  PARTIAL:  'bg-blue-100 text-blue-700',
  CANCELLED:'bg-red-100 text-red-700',
};
const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/10 outline-none transition-all placeholder:text-slate-400';

function CreateOrderModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [patSearch, setPatSearch]   = useState('');
  const [patients, setPatients]     = useState<any[]>([]);
  const [products, setProducts]     = useState<any[]>([]);
  const [prodSearch, setProdSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    patientId: '', patientName: '', notes: '', discount: 0,
    items: [] as { productId: string; productName: string; unitPrice: number; quantity: number }[],
  });

  useEffect(() => {
    if (patSearch.length < 2) { setPatients([]); return; }
    const t = setTimeout(() => {
      api.get('/patients', { params: { search: patSearch, limit: 5 } }).then(r => setPatients(r.data.data || [])).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [patSearch]);

  useEffect(() => {
    if (prodSearch.length < 2) { setProducts([]); return; }
    const t = setTimeout(() => {
      api.get('/pharmacy/products', { params: { search: prodSearch, limit: 8 } }).then(r => setProducts(r.data.data || [])).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [prodSearch]);

  const addProduct = (p: any) => {
    if (form.items.some(i => i.productId === p.id)) return;
    setForm(f => ({ ...f, items: [...f.items, { productId: p.id, productName: p.name, unitPrice: p.sellingPrice, quantity: 1 }] }));
    setProdSearch(''); setProducts([]);
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty < 1) return;
    setForm(f => ({ ...f, items: f.items.map(i => i.productId === productId ? { ...i, quantity: qty } : i) }));
  };

  const removeItem = (productId: string) => setForm(f => ({ ...f, items: f.items.filter(i => i.productId !== productId) }));

  const subtotal = form.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const billAmount = subtotal - (form.discount * 100);

  const handleSubmit = async () => {
    if (!form.patientId || form.items.length === 0) { toast.error('Select patient and add medicines'); return; }
    setSubmitting(true);
    try {
      await api.post('/pharmacy/dispensing', {
        patientId: form.patientId,
        items: form.items.map(i => ({ productId: i.productId, quantity: i.quantity })),
        discountAmount: Math.round(form.discount * 100),
        notes: form.notes,
      });
      toast.success('Order created! Click Dispense to complete and send receipt via WhatsApp.');
      onCreated(); onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create order');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-lg font-bold text-slate-900">New Dispensing Order</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-5">
          {/* Patient */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Patient <span className="text-red-500">*</span></label>
            {form.patientId ? (
              <div className="flex items-center justify-between bg-emerald-50 rounded-xl px-4 py-2.5 border border-emerald-200">
                <span className="text-sm font-semibold text-emerald-800">{form.patientName}</span>
                <button onClick={() => setForm(f => ({ ...f, patientId: '', patientName: '' }))}><X className="w-4 h-4 text-emerald-400" /></button>
              </div>
            ) : (
              <div className="relative">
                <input className={inputCls} placeholder="Search patient…" value={patSearch} onChange={e => setPatSearch(e.target.value)} />
                {patients.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
                    {patients.map(p => (
                      <button key={p.id} onClick={() => { setForm(f => ({ ...f, patientId: p.id, patientName: `${p.firstName} ${p.lastName || ''}` })); setPatSearch(''); setPatients([]); }}
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

          {/* Add medicines */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Add Medicines <span className="text-red-500">*</span></label>
            <div className="relative">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-slate-400" />
                <input className="bg-transparent text-sm outline-none flex-1" placeholder="Search drugs…"
                  value={prodSearch} onChange={e => setProdSearch(e.target.value)} />
              </div>
              {products.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
                  {products.map(p => (
                    <button key={p.id} onClick={() => addProduct(p)}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{p.name}</p>
                          <p className="text-xs text-slate-400">{p.form} · Stock: {p.currentStock}</p>
                        </div>
                        <p className="text-sm font-bold text-slate-900">₹{(p.sellingPrice / 100).toFixed(2)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected items */}
          {form.items.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 grid grid-cols-12 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <span className="col-span-5">Medicine</span>
                <span className="col-span-3 text-center">Price</span>
                <span className="col-span-3 text-center">Qty</span>
                <span className="col-span-1" />
              </div>
              <div className="divide-y divide-slate-50">
                {form.items.map(item => (
                  <div key={item.productId} className="px-4 py-2.5 grid grid-cols-12 items-center">
                    <span className="col-span-5 text-sm text-slate-900 font-medium">{item.productName}</span>
                    <span className="col-span-3 text-center text-sm text-slate-600">₹{(item.unitPrice / 100).toFixed(2)}</span>
                    <div className="col-span-3 flex items-center justify-center gap-2">
                      <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors">-</button>
                      <span className="text-sm font-bold text-slate-900 w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors">+</button>
                    </div>
                    <button onClick={() => removeItem(item.productId)} className="col-span-1 flex justify-end text-slate-300 hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Totals */}
          {form.items.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span>₹{(subtotal / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Discount (₹)</span>
                <input type="number" min={0} className="w-24 text-right border border-slate-200 rounded-lg px-2 py-1 text-sm outline-none focus:border-[#166534] bg-white"
                  value={form.discount || ''} placeholder="0"
                  onChange={e => setForm(f => ({ ...f, discount: Number(e.target.value) }))} />
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-2">
                <span>Total</span>
                <span>₹{Math.max(billAmount / 100, 0).toFixed(2)}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Notes</label>
            <textarea className={`${inputCls} resize-none`} rows={2}
              placeholder="Prescription number, special instructions…"
              value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting || !form.patientId || form.items.length === 0}
            className="text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
            style={{ background: NAV_COLOR }}>
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Order
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DispensingPage() {
  const [orders, setOrders]         = useState<any[]>([]);
  const [meta, setMeta]             = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading]       = useState(true);
  const [statusFilter, setStatus]   = useState('');
  const [search, setSearch]         = useState('');
  const [debSearch, setDebSearch]   = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [dispensing, setDispensing] = useState<string | null>(null);

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
      const res = await api.get('/pharmacy/dispensing', { params });
      setOrders(res.data.data ?? []);
      setMeta(res.data.meta ?? { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, [statusFilter, debSearch]);

  useEffect(() => { load(1); }, [load]);

  const dispenseOrder = async (id: string) => {
    setDispensing(id);
    try {
      const res = await api.post(`/pharmacy/dispensing/${id}/dispense`);
      toast.success('Medicines dispensed! WhatsApp receipt sent to patient.');
      load(meta.page);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Dispensing failed');
    } finally { setDispensing(null); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dispensing Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">{meta.total.toLocaleString('en-IN')} total orders</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load(meta.page)} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
            style={{ background: NAV_COLOR }}>
            <Plus className="w-4 h-4" /> New Order
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1">
          <Search className="w-4 h-4 text-slate-400" />
          <input className="bg-transparent text-sm outline-none flex-1 placeholder:text-slate-400"
            placeholder="Search by order number or patient name…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-1">
          {['', 'PENDING', 'DISPENSED', 'CANCELLED'].map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${statusFilter === s ? 'text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              style={statusFilter === s ? { background: NAV_COLOR } : {}}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-24" />)
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center">
            <ShoppingCart className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-medium">No dispensing orders</p>
            <button onClick={() => setShowCreate(true)}
              className="mt-3 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity mx-auto flex items-center gap-2"
              style={{ background: NAV_COLOR }}>
              <Plus className="w-4 h-4" /> Create First Order
            </button>
          </div>
        ) : orders.map(order => (
          <div key={order.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl text-white flex items-center justify-center flex-shrink-0 font-bold text-sm"
                style={{ background: NAV_COLOR }}>
                <Pill className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 font-mono">{order.orderNumber}</p>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-600'}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{formatDate(order.createdAt)} {formatTime(order.createdAt)}</p>
                </div>
                <p className="text-sm font-semibold text-slate-700">{order.patient?.firstName} {order.patient?.lastName || ''}</p>
                <p className="text-xs text-slate-400 mb-2">{order.patient?.phone}</p>
                <div className="flex flex-wrap gap-1.5">
                  {(order.items || []).map((item: any, i: number) => (
                    <span key={i} className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {item.product?.name} × {item.quantity}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-bold text-slate-900">{formatINR(order.billAmount)}</p>
                {order.discountAmount > 0 && <p className="text-xs text-emerald-600">- {formatINR(order.discountAmount)} off</p>}
                {order.status === 'PENDING' && (
                  <button onClick={() => dispenseOrder(order.id)} disabled={dispensing === order.id}
                    className="mt-3 flex items-center gap-1.5 text-xs font-bold text-white px-3 py-2 rounded-xl hover:opacity-90 disabled:opacity-60 transition-all"
                    style={{ background: '#25D366' }}>
                    {dispensing === order.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Dispense + Send Receipt
                  </button>
                )}
                {order.status === 'DISPENSED' && (
                  <span className="mt-2 flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Receipt sent via WhatsApp
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {!loading && meta.total > 0 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-xs text-slate-500">Showing {(meta.page-1)*meta.limit+1}–{Math.min(meta.page*meta.limit, meta.total)} of {meta.total}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => load(meta.page-1)} disabled={meta.page===1} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-xs text-slate-600 px-3">{meta.page} / {meta.totalPages}</span>
            <button onClick={() => load(meta.page+1)} disabled={meta.page>=meta.totalPages} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {showCreate && <CreateOrderModal onClose={() => setShowCreate(false)} onCreated={() => load(1)} />}
    </div>
  );
}
