'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatDate, formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';
import { ArrowLeft, Package, Truck, CheckCircle2, Clock, Loader2, MessageSquare } from 'lucide-react';

const PIPELINE = [
  { status: 'PENDING',   label: 'Order Placed',   color: '#64748B' },
  { status: 'CONFIRMED', label: 'Confirmed',       color: '#3B82F6' },
  { status: 'SHIPPED',   label: 'Shipped',         color: '#8B5CF6' },
  { status: 'DELIVERED', label: 'Delivered',       color: '#10B981' },
  { status: 'CANCELLED', label: 'Cancelled',       color: '#EF4444' },
];

const ADVANCE: Record<string, string> = {
  PENDING: 'CONFIRMED', CONFIRMED: 'SHIPPED', SHIPPED: 'DELIVERED',
};

export default function EquipmentOrderDetailPage() {
  const { id }    = useParams<{ id: string }>();
  const router    = useRouter();
  const [order, setOrder]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    api.get(`/marketplace/orders/${id}`)
      .then(r => setOrder(r.data))
      .catch(() => toast.error('Order not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const advance = async () => {
    const next = ADVANCE[order?.status];
    if (!next) return;
    setUpdating(true);
    try {
      await api.patch(`/marketplace/orders/${id}`, { status: next });
      setOrder((o: any) => ({ ...o, status: next }));
      toast.success(`Order status updated to ${next}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update');
    } finally { setUpdating(false); }
  };

  const notifyCustomer = async () => {
    try {
      await api.post('/whatsapp/send', {
        to: order.customer?.phone || order.tenantPhone,
        message: `Hi, your order ${order.orderNumber} has been ${order.status.toLowerCase()}. For any queries please contact us.`,
      });
      toast.success('Customer notified via WhatsApp!');
    } catch { toast.error('Failed to send notification'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-[#1E40AF] animate-spin" /></div>;
  if (!order)  return <div className="text-center py-20 text-slate-400">Order not found</div>;

  const currentIdx  = PIPELINE.findIndex(s => s.status === order.status);
  const nextStep    = ADVANCE[order.status] ? PIPELINE.find(s => s.status === ADVANCE[order.status]) : null;
  const items       = order.items ?? order.products ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900 font-mono">{order.orderNumber || order.id?.slice(0,10).toUpperCase()}</h1>
          <p className="text-sm text-slate-500">{formatDate(order.createdAt)} · {items.length} item{items.length !== 1 ? 's' : ''}</p>
        </div>
        <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
          order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700' :
          order.status === 'SHIPPED'   ? 'bg-purple-100 text-purple-700' :
          order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
          order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
          'bg-slate-100 text-slate-600'
        }`}>{order.status}</span>
      </div>

      {/* Status pipeline */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          {PIPELINE.filter(s => s.status !== 'CANCELLED').map((step, i) => {
            const done    = currentIdx >= i && order.status !== 'CANCELLED';
            const current = currentIdx === i;
            return (
              <div key={step.status} className="flex-1 flex flex-col items-center gap-1.5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  done ? 'text-white shadow-sm' : 'bg-slate-100 text-slate-400'
                }`} style={done ? { background: step.color } : {}}>
                  {i < currentIdx && order.status !== 'CANCELLED' ? '✓' : i + 1}
                </div>
                <p className={`text-[10px] font-semibold text-center ${current ? 'text-slate-900' : 'text-slate-400'}`}>
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>

        {nextStep && order.status !== 'CANCELLED' && (
          <div className="flex items-center gap-3 justify-center mt-3">
            <button onClick={advance} disabled={updating}
              className="flex items-center gap-2 text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-60"
              style={{ background: nextStep.color }}>
              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
              Mark as: {nextStep.label}
            </button>
            <button onClick={notifyCustomer}
              className="flex items-center gap-2 bg-[#25D366] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90">
              <MessageSquare className="w-4 h-4" /> Notify Customer
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Customer / Tenant */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
          <h3 className="font-semibold text-slate-900">Customer Details</h3>
          {[
            { l: 'Name',      v: order.tenantName || order.customer?.name || '—' },
            { l: 'Phone',     v: order.customer?.phone || order.tenantPhone || '—' },
            { l: 'Email',     v: order.customer?.email || order.tenantEmail || '—' },
            { l: 'Order Date',v: formatDate(order.createdAt) },
            { l: 'Total',     v: order.totalAmount ? formatINR(order.totalAmount) : '—' },
          ].map(f => (
            <div key={f.l} className="flex justify-between text-sm">
              <span className="text-slate-500">{f.l}</span>
              <span className="font-semibold text-slate-900">{f.v}</span>
            </div>
          ))}
        </div>

        {/* Order items */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-[#1E40AF]" /> Items Ordered
          </h3>
          {items.length === 0 ? (
            <p className="text-slate-400 text-sm">No items data available</p>
          ) : (
            <div className="space-y-2">
              {items.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.name || item.productName || '—'}</p>
                    {item.sku && <p className="text-xs text-slate-400">SKU: {item.sku}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">× {item.quantity || 1}</p>
                    {item.price && <p className="text-xs text-slate-500">{formatINR(item.price)}</p>}
                  </div>
                </div>
              ))}
              {order.totalAmount && (
                <div className="flex justify-between pt-2 text-sm font-bold text-slate-900 border-t border-slate-100">
                  <span>Total</span>
                  <span>{formatINR(order.totalAmount)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Shipping details */}
      {order.shippingAddress && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#1E40AF]" /> Shipping Address
          </h3>
          <p className="text-sm text-slate-600">{order.shippingAddress}</p>
        </div>
      )}

      {order.notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">Order Notes</p>
          <p className="text-sm text-amber-800">{order.notes}</p>
        </div>
      )}
    </div>
  );
}
