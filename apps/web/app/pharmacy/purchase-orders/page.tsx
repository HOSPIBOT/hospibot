'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate, formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  TrendingUp, Plus, RefreshCw, Search, X, Loader2,
  CheckCircle2, Package, ChevronLeft, ChevronRight, Truck, Users,
} from 'lucide-react';

const NAV_COLOR = '#166534';
const STATUS_COLORS: Record<string, string> = {
  DRAFT:    'bg-slate-100 text-slate-600',
  SENT:     'bg-blue-100 text-blue-700',
  PARTIAL:  'bg-amber-100 text-amber-700',
  RECEIVED: 'bg-emerald-100 text-emerald-700',
  CANCELLED:'bg-red-100 text-red-700',
};
const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/10 outline-none transition-all placeholder:text-slate-400';

function AddSupplierModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', contactPerson: '', phone: '', email: '', address: '', gstNumber: '', drugLicence: '' });
  const [submitting, setSubmitting] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name || !form.phone) { toast.error('Name and phone are required'); return; }
    setSubmitting(true);
    try {
      await api.post('/pharmacy/suppliers', form);
      toast.success('Supplier added!');
      onCreated(); onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Add Supplier</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Company Name <span className="text-red-500">*</span></label>
            <input className={inputCls} placeholder="Sun Pharma Distributors" value={form.name} onChange={set('name')} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Contact Person</label>
            <input className={inputCls} placeholder="Rajesh Kumar" value={form.contactPerson} onChange={set('contactPerson')} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Phone <span className="text-red-500">*</span></label>
            <input className={inputCls} placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Email</label>
            <input className={inputCls} type="email" value={form.email} onChange={set('email')} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">GST Number</label>
            <input className={inputCls} placeholder="29AAAAA0000A1Z5" value={form.gstNumber} onChange={set('gstNumber')} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Drug Licence No.</label>
            <input className={inputCls} placeholder="TN/04/xxx" value={form.drugLicence} onChange={set('drugLicence')} />
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting}
            className="text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
            style={{ background: NAV_COLOR }}>
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Add Supplier
          </button>
        </div>
      </div>
    </div>
  );
}

function CreatePOModal({ suppliers, onClose, onCreated }: { suppliers: any[]; onClose: () => void; onCreated: () => void }) {
  const [products, setProducts]     = useState<any[]>([]);
  const [prodSearch, setProdSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    supplierId: '', expectedAt: '', notes: '',
    items: [] as { productId: string; productName: string; quantity: number; unitCost: number }[],
  });

  useEffect(() => {
    if (prodSearch.length < 2) { setProducts([]); return; }
    const t = setTimeout(() => {
      api.get('/pharmacy/products', { params: { search: prodSearch, limit: 6 } }).then(r => setProducts(r.data.data || [])).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [prodSearch]);

  const addProduct = (p: any) => {
    if (form.items.some(i => i.productId === p.id)) return;
    setForm(f => ({ ...f, items: [...f.items, { productId: p.id, productName: p.name, quantity: 1, unitCost: p.costPrice / 100 }] }));
    setProdSearch(''); setProducts([]);
  };

  const updateItem = (id: string, field: string, val: any) => {
    setForm(f => ({ ...f, items: f.items.map(i => i.productId === id ? { ...i, [field]: val } : i) }));
  };

  const total = form.items.reduce((s, i) => s + i.quantity * i.unitCost, 0);

  const handleSubmit = async () => {
    if (!form.supplierId || form.items.length === 0) { toast.error('Select supplier and add items'); return; }
    setSubmitting(true);
    try {
      await api.post('/pharmacy/purchase-orders', {
        supplierId: form.supplierId,
        items: form.items.map(i => ({ productId: i.productId, productName: i.productName, quantity: i.quantity, unitCost: i.unitCost, totalCost: i.quantity * i.unitCost })),
        expectedAt: form.expectedAt || undefined,
        notes: form.notes,
      });
      toast.success('Purchase order created!');
      onCreated(); onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-lg font-bold text-slate-900">Create Purchase Order</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Supplier <span className="text-red-500">*</span></label>
              <select className={inputCls} value={form.supplierId} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))}>
                <option value="">Select supplier…</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Expected Delivery</label>
              <input type="date" className={inputCls} value={form.expectedAt} onChange={e => setForm(f => ({ ...f, expectedAt: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Add Products</label>
            <div className="relative">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-slate-400" />
                <input className="bg-transparent text-sm outline-none flex-1" placeholder="Search products to order…"
                  value={prodSearch} onChange={e => setProdSearch(e.target.value)} />
              </div>
              {products.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
                  {products.map(p => (
                    <button key={p.id} onClick={() => addProduct(p)}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0">
                      <p className="text-sm font-medium text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-400">Stock: {p.currentStock} · Cost: ₹{(p.costPrice/100).toFixed(2)}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {form.items.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 grid grid-cols-12 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <span className="col-span-5">Product</span>
                <span className="col-span-3 text-center">Qty</span>
                <span className="col-span-3 text-center">Unit Cost (₹)</span>
                <span className="col-span-1" />
              </div>
              {form.items.map(item => (
                <div key={item.productId} className="px-4 py-2.5 grid grid-cols-12 items-center border-t border-slate-50">
                  <span className="col-span-5 text-sm text-slate-900 font-medium truncate">{item.productName}</span>
                  <div className="col-span-3 flex justify-center">
                    <input type="number" min={1} className="w-16 text-center border border-slate-200 rounded-lg px-2 py-1 text-sm outline-none focus:border-[#166534]"
                      value={item.quantity} onChange={e => updateItem(item.productId, 'quantity', Number(e.target.value))} />
                  </div>
                  <div className="col-span-3 flex justify-center">
                    <input type="number" min={0} step={0.01} className="w-20 text-center border border-slate-200 rounded-lg px-2 py-1 text-sm outline-none focus:border-[#166534]"
                      value={item.unitCost || ''} onChange={e => updateItem(item.productId, 'unitCost', Number(e.target.value))} />
                  </div>
                  <button onClick={() => setForm(f => ({ ...f, items: f.items.filter(i => i.productId !== item.productId) }))}
                    className="col-span-1 flex justify-end text-slate-300 hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex justify-between text-sm font-bold">
                <span className="text-slate-700">Total</span>
                <span className="text-slate-900">₹{total.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Notes</label>
            <textarea className={`${inputCls} resize-none`} rows={2} placeholder="Special instructions…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting || !form.supplierId || form.items.length === 0}
            className="text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
            style={{ background: NAV_COLOR }}>
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Purchase Order
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PurchaseOrdersPage() {
  const [orders, setOrders]       = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [meta, setMeta]           = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading]     = useState(true);
  const [statusFilter, setStatus] = useState('');
  const [showCreatePO, setCreatePO] = useState(false);
  const [showAddSupplier, setAddSupplier] = useState(false);
  const [activeView, setView]     = useState<'orders' | 'suppliers'>('orders');

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const [ordersRes, suppliersRes] = await Promise.all([
        api.get('/pharmacy/purchase-orders', { params }),
        api.get('/pharmacy/suppliers'),
      ]);
      setOrders(ordersRes.data.data ?? []);
      setMeta(ordersRes.data.meta ?? { page: 1, limit: 20, total: 0, totalPages: 1 });
      setSuppliers(suppliersRes.data ?? []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(1); }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Purchase Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">Procurement from distributors and suppliers</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setAddSupplier(true)}
            className="flex items-center gap-2 border border-slate-200 text-slate-600 text-sm font-medium px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors">
            <Users className="w-4 h-4" /> Add Supplier
          </button>
          <button onClick={() => setCreatePO(true)}
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
            style={{ background: NAV_COLOR }}>
            <Plus className="w-4 h-4" /> Create PO
          </button>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {[['orders', 'Purchase Orders'], ['suppliers', 'Suppliers']].map(([key, label]) => (
          <button key={key} onClick={() => setView(key as any)}
            className={`text-sm font-medium px-4 py-1.5 rounded-lg transition-all ${activeView === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Suppliers list */}
      {activeView === 'suppliers' && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Registered Suppliers ({suppliers.length})</h3>
          </div>
          {suppliers.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No suppliers yet. Add your first supplier.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {suppliers.map((s: any) => (
                <div key={s.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-bold flex-shrink-0"
                    style={{ background: NAV_COLOR }}>{s.name[0]}</div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">{s.name}</p>
                    {s.contactPerson && <p className="text-xs text-slate-500">{s.contactPerson}</p>}
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                      {s.phone && <span>{s.phone}</span>}
                      {s.drugLicence && <span>Lic: {s.drugLicence}</span>}
                      {s.gstNumber && <span>GST: {s.gstNumber}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Purchase Orders list */}
      {activeView === 'orders' && (
        <>
          <div className="flex items-center gap-2">
            {['', 'DRAFT', 'SENT', 'PARTIAL', 'RECEIVED', 'CANCELLED'].map(s => (
              <button key={s} onClick={() => setStatus(s)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${statusFilter === s ? 'text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                style={statusFilter === s ? { background: NAV_COLOR } : {}}>
                {s || 'All'}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-24" />)
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center">
                <Truck className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No purchase orders yet</p>
              </div>
            ) : orders.map(po => (
              <div key={po.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5" style={{ color: NAV_COLOR }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-slate-900 font-mono">{po.orderNumber}</p>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${STATUS_COLORS[po.status] || 'bg-slate-100 text-slate-600'}`}>{po.status}</span>
                    </div>
                    <p className="text-sm text-slate-700">Supplier: <strong>{po.supplier?.name}</strong></p>
                    {po.expectedAt && <p className="text-xs text-slate-400">Expected: {formatDate(po.expectedAt)}</p>}
                    {po.receivedAt && <p className="text-xs text-emerald-600">Received: {formatDate(po.receivedAt)}</p>}
                    {po.notes && <p className="text-xs text-slate-400 mt-1">{po.notes}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900">{formatINR(po.totalAmount)}</p>
                    <p className="text-xs text-slate-400">{formatDate(po.createdAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showCreatePO && <CreatePOModal suppliers={suppliers} onClose={() => setCreatePO(false)} onCreated={() => load(1)} />}
      {showAddSupplier && <AddSupplierModal onClose={() => setAddSupplier(false)} onCreated={() => load(1)} />}
    </div>
  );
}
