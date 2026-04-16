'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate, formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  AlertTriangle, Package, Clock, XCircle, RefreshCw,
  ShoppingCart, ArrowRight, CheckCircle2, Loader2,
} from 'lucide-react';

const NAV_COLOR = '#166534';

type Tab = 'low_stock' | 'near_expiry' | 'out_of_stock';

const TABS: { key: Tab; label: string; icon: any; color: string; emptyMsg: string }[] = [
  { key: 'low_stock',    label: 'Low Stock',    icon: AlertTriangle, color: '#F59E0B', emptyMsg: 'No products below reorder level'  },
  { key: 'near_expiry',  label: 'Near Expiry',  icon: Clock,         color: '#F97316', emptyMsg: 'No batches expiring within 90 days' },
  { key: 'out_of_stock', label: 'Out of Stock', icon: XCircle,       color: '#EF4444', emptyMsg: 'All products are in stock'          },
];

export default function PharmacyAlertsPage() {
  const [alerts,    setAlerts]    = useState<{ lowStock: any[]; nearExpiry: any[]; outOfStock: any[] } | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState<Tab>('low_stock');
  const [ordering,  setOrdering]  = useState<string | null>(null);
    // @ts-ignore
  const [ordered,   setOrdered]   = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/pharmacy/alerts');
      setAlerts(res.data);
    } catch { toast.error('Failed to load pharmacy alerts'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const reorder = async (productId: string, productName: string, quantity = 100) => {
    setOrdering(productId);
    try {
      // Get first available supplier to attach the PO
      const suppliersRes = await api.get('/pharmacy/suppliers').catch(() => ({ data: [] }));
      const suppliers: any[] = suppliersRes.data ?? [];

      if (suppliers.length === 0) {
        // No suppliers — link to purchase orders page
        toast('No suppliers found. Add a supplier first.', { icon: '⚠️' });
        return;
      }

      await api.post('/pharmacy/purchase-orders', {
        supplierId : suppliers[0].id,
        expectedAt : new Date(Date.now() + 3 * 86400000).toISOString(),
        notes      : `Auto-reorder from Low Stock alert`,
        items      : [{ productId, quantity, unitCost: 0 }],
      });

  // @ts-ignore
      setOrdered(prev => new Set([...prev, productId]));
      toast.success(`Reorder PO created for ${productName}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Reorder failed');
    } finally {
      setOrdering(null);
    }
  };

  const current = alerts
    ? tab === 'low_stock'    ? alerts.lowStock
    : tab === 'near_expiry'  ? alerts.nearExpiry
    : alerts.outOfStock
    : [];

  const tabInfo = TABS.find((t: any) => t.key === tab)!;

  const totalAlerts = alerts
    ? alerts.outOfStock.length + alerts.lowStock.length + alerts.nearExpiry.length
    : 0;

  const daysUntilExpiry = (date: string) => {
    const d = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
    return d;
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" /> Inventory Alerts
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? 'Loading…' : `${totalAlerts} alert${totalAlerts !== 1 ? 's' : ''} require attention`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/pharmacy/purchase-orders"
            className="flex items-center gap-1.5 text-sm font-medium text-slate-600 border border-slate-200 px-3.5 py-2 rounded-xl hover:bg-slate-50 transition-colors">
            <ShoppingCart className="w-4 h-4" /> View POs
          </a>
          <button onClick={load}
            className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map((i: any) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-20" />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {TABS.map((t: any) => {
            const count = alerts
              ? t.key === 'low_stock'    ? alerts.lowStock.length
              : t.key === 'near_expiry'  ? alerts.nearExpiry.length
              : alerts.outOfStock.length
              : 0;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`text-left bg-white rounded-2xl border-2 p-5 transition-all hover:shadow-md ${
                  tab === t.key ? 'border-current' : 'border-slate-100'
                }`}
                style={tab === t.key ? { borderColor: t.color } : {}}>
                <div className="flex items-center gap-2 mb-2">
                  <t.icon className="w-4 h-4" style={{ color: t.color }} />
                  <p className="text-xs text-slate-500 font-medium">{t.label}</p>
                </div>
                <p className="text-3xl font-bold" style={{ color: count > 0 ? t.color : '#10B981' }}>
                  {count}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {count === 0 ? '✓ All clear' : `product${count !== 1 ? 's' : ''}`}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {TABS.map((t: any) => {
          const count = alerts
            ? t.key === 'low_stock'    ? alerts.lowStock.length
            : t.key === 'near_expiry'  ? alerts.nearExpiry.length
            : alerts.outOfStock.length
            : 0;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-all ${
                tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>
              <t.icon className="w-3.5 h-3.5" style={{ color: tab === t.key ? t.color : undefined }} />
              {t.label}
              {count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                  tab === t.key ? 'text-white' : 'bg-slate-200 text-slate-600'
                }`} style={tab === t.key ? { background: t.color } : {}}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Alert list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map((i: any) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-20" />)}
        </div>
      ) : current.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <p className="text-slate-600 font-semibold">All clear!</p>
          <p className="text-slate-400 text-sm mt-1">{tabInfo.emptyMsg}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 grid text-xs font-semibold text-slate-500 uppercase tracking-wide"
            style={{ gridTemplateColumns: tab === 'near_expiry' ? '2fr 1fr 1fr 1fr 1fr' : '2fr 1fr 1fr 1fr' }}>
            <span>Product</span>
            {tab === 'near_expiry' && <span>Batch</span>}
            {tab === 'near_expiry' && <span>Expiry</span>}
            {tab !== 'near_expiry' && <span>Current Stock</span>}
            {tab === 'low_stock' && <span>Reorder Level</span>}
            {tab === 'near_expiry' ? <span>Qty Remaining</span> : <span>Category</span>}
            <span className="text-right">Action</span>
          </div>

          <div className="divide-y divide-slate-50">
            {current.map((item: any) => {
              const id      = item.id ?? item.productId;
              const name    = item.name ?? item.product?.name ?? 'Product';
              const isDone  = ordered.has(id);

              if (tab === 'near_expiry') {
                const days = daysUntilExpiry(item.expiryDate);
                return (
                  <div key={item.id} className="px-5 py-4 grid items-center gap-4"
                    style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr' }}>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.product?.name ?? '—'}</p>
                      <p className="text-xs text-slate-400">{item.product?.category ?? ''}</p>
                    </div>
                    <p className="text-xs font-mono text-slate-600">{item.batchNumber}</p>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: days < 30 ? '#EF4444' : '#F97316' }}>
                        {formatDate(item.expiryDate)}
                      </p>
                      <p className="text-[10px] text-slate-400">{days}d remaining</p>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{item.remaining} units</p>
                    <div className="flex justify-end">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        days < 30 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {days < 30 ? 'Critical' : 'Review'}
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <div key={id} className="px-5 py-4 grid items-center gap-4"
                  style={{ gridTemplateColumns: tab === 'low_stock' ? '2fr 1fr 1fr 1fr' : '2fr 1fr 1fr 1fr' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${NAV_COLOR}10` }}>
                      <Package className="w-4 h-4" style={{ color: NAV_COLOR }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{name}</p>
                      <p className="text-xs text-slate-400">{item.manufacturer ?? item.category ?? ''}</p>
                    </div>
                  </div>

                  <p className={`text-sm font-bold ${
                    tab === 'out_of_stock' ? 'text-red-600' : 'text-amber-600'
                  }`}>
                    {tab === 'out_of_stock' ? '0' : item.currentStock ?? 0} units
                  </p>

                  {tab === 'low_stock' && (
                    <p className="text-sm text-slate-500">{item.reorderLevel ?? 10} units</p>
                  )}
                  {tab === 'out_of_stock' && (
                    <p className="text-xs text-slate-400 capitalize">{item.category ?? 'General'}</p>
                  )}

                  <p className="text-xs text-slate-400 capitalize">{item.category ?? 'General'}</p>

                  <div className="flex justify-end">
                    {isDone ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                        <CheckCircle2 className="w-3.5 h-3.5" /> PO Created
                      </span>
                    ) : (
                      <button
                        onClick={() => reorder(id, name)}
                        disabled={ordering === id}
                        className="flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-1.5 rounded-xl disabled:opacity-50 transition-all"
                        style={{ background: NAV_COLOR }}>
                        {ordering === id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <ShoppingCart className="w-3.5 h-3.5" />}
                        Reorder
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">{current.length} items shown</p>
            <a href="/pharmacy/purchase-orders"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1">
              View all purchase orders <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
