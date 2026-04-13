'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Package, AlertTriangle, Clock, RefreshCw, Plus, X, Loader2, ChevronDown,
} from 'lucide-react';

const NAV_COLOR = '#166534';
const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/10 outline-none transition-all placeholder:text-slate-400';

function AddBatchModal({ productId, productName, onClose, onAdded }: {
  productId: string; productName: string; onClose: () => void; onAdded: () => void;
}) {
  const [form, setForm] = useState({ batchNumber: '', expiryDate: '', quantity: '', costPrice: '', sellingPrice: '' });
  const [submitting, setSubmitting] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.batchNumber || !form.expiryDate || !form.quantity) {
      toast.error('Batch number, expiry date, and quantity are required');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/pharmacy/products/${productId}/batches`, {
        batchNumber: form.batchNumber,
        expiryDate: form.expiryDate,
        quantity: Number(form.quantity),
        costPrice: Number(form.costPrice) || 0,
        sellingPrice: Number(form.sellingPrice) || 0,
      });
      toast.success(`${Number(form.quantity)} units added. Stock updated.`);
      onAdded(); onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add batch');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Add Stock Batch</h2>
            <p className="text-xs text-slate-400 mt-0.5">{productName}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Batch Number <span className="text-red-500">*</span></label>
            <input className={inputCls} placeholder="e.g. BN24045A" value={form.batchNumber} onChange={set('batchNumber')} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Expiry Date <span className="text-red-500">*</span></label>
            <input type="date" className={inputCls} value={form.expiryDate} onChange={set('expiryDate')} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Quantity (units) <span className="text-red-500">*</span></label>
            <input type="number" min={1} className={inputCls} placeholder="100" value={form.quantity} onChange={set('quantity')} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Cost Price per unit (₹)</label>
            <input type="number" min={0} step={0.01} className={inputCls} placeholder="80.00" value={form.costPrice} onChange={set('costPrice')} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Selling Price per unit (₹)</label>
            <input type="number" min={0} step={0.01} className={inputCls} placeholder="100.00" value={form.sellingPrice} onChange={set('sellingPrice')} />
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting}
            className="text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
            style={{ background: NAV_COLOR }}>
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Add to Stock
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const [alerts, setAlerts]     = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setTab]     = useState<'lowStock' | 'nearExpiry' | 'outOfStock'>('outOfStock');
  const [addBatch, setAddBatch] = useState<{ id: string; name: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/pharmacy/alerts');
      setAlerts(res.data);
    } catch { toast.error('Failed to load alerts'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const daysToExpiry = (date: string) => {
    const diff = new Date(date).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const expiryColor = (days: number) => {
    if (days < 30) return 'text-red-600';
    if (days < 60) return 'text-amber-600';
    return 'text-orange-600';
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Alerts</h1>
          <p className="text-sm text-slate-500 mt-0.5">Stock levels, expiry tracking, and reorder management</p>
        </div>
        <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Alert summary cards */}
      {alerts && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { key: 'outOfStock',  label: 'Out of Stock',    count: alerts.outOfStock?.length || 0,  icon: Package,       color: '#EF4444', bg: '#FFF1F2' },
            { key: 'lowStock',    label: 'Low Stock',        count: alerts.lowStock?.length || 0,    icon: AlertTriangle, color: '#F59E0B', bg: '#FFFBEB' },
            { key: 'nearExpiry',  label: 'Expiring (90d)',   count: alerts.nearExpiry?.length || 0,  icon: Clock,         color: '#EA580C', bg: '#FFF7ED' },
          ].map(s => (
            <button key={s.key} onClick={() => setTab(s.key as any)}
              className={`rounded-2xl border p-5 text-center transition-all hover:shadow-md ${activeTab === s.key ? 'ring-2' : ''}`}
              style={{
                background: s.bg,
                borderColor: activeTab === s.key ? s.color : 'transparent',
                // ringColor: s.color,
              }}>
              <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: `${s.color}20` }}>
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <p className="text-3xl font-bold" style={{ color: s.color }}>{s.count}</p>
              <p className="text-xs font-semibold text-slate-600 mt-1">{s.label}</p>
            </button>
          ))}
        </div>
      )}

      {/* Alert lists */}
      {!loading && alerts && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center gap-1 px-5 py-3 border-b border-slate-100 bg-slate-50">
            {[
              { key: 'outOfStock', label: 'Out of Stock' },
              { key: 'lowStock',   label: 'Low Stock' },
              { key: 'nearExpiry', label: 'Near Expiry' },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key as any)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${activeTab === t.key ? 'text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                style={activeTab === t.key ? { background: NAV_COLOR } : {}}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Out of Stock */}
          {activeTab === 'outOfStock' && (
            <div className="divide-y divide-slate-50">
              {alerts.outOfStock?.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">✅ No products are out of stock</div>
              ) : alerts.outOfStock?.map((p: any) => (
                <div key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.form} · {p.strength} · Min. stock: {p.minimumStock}</p>
                  </div>
                  <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-full">0 {p.unit}s</span>
                  <button onClick={() => setAddBatch({ id: p.id, name: p.name })}
                    className="text-xs font-bold text-white px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    style={{ background: NAV_COLOR }}>
                    + Add Stock
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Low Stock */}
          {activeTab === 'lowStock' && (
            <div className="divide-y divide-slate-50">
              {alerts.lowStock?.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">✅ All products are adequately stocked</div>
              ) : alerts.lowStock?.map((p: any) => (
                <div key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.form} · {p.strength}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-amber-600">{p.currentStock} {p.unit}s left</p>
                    <p className="text-xs text-slate-400">Min: {p.minimumStock}</p>
                  </div>
                  <button onClick={() => setAddBatch({ id: p.id, name: p.name })}
                    className="text-xs font-bold text-white px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    style={{ background: NAV_COLOR }}>
                    + Restock
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Near Expiry */}
          {activeTab === 'nearExpiry' && (
            <div className="divide-y divide-slate-50">
              {alerts.nearExpiry?.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">✅ No batches expiring within 90 days</div>
              ) : alerts.nearExpiry?.map((batch: any) => {
                const days = daysToExpiry(batch.expiryDate);
                return (
                  <div key={batch.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">{batch.product?.name}</p>
                      <p className="text-xs text-slate-400">Batch: {batch.batchNumber} · {batch.remaining} units remaining</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${expiryColor(days)}`}>
                        {days < 0 ? 'EXPIRED' : `${days} days`}
                      </p>
                      <p className="text-xs text-slate-400">Exp: {formatDate(batch.expiryDate)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {addBatch && (
        <AddBatchModal
          productId={addBatch.id}
          productName={addBatch.name}
          onClose={() => setAddBatch(null)}
          onAdded={load}
        />
      )}
    </div>
  );
}
