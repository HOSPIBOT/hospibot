'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatDate, formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Truck, Phone, Mail, MapPin, Building2,
  ShoppingCart, Package, TrendingUp, RefreshCw,
  FileText, CheckCircle2, Clock, AlertTriangle,
} from 'lucide-react';

const NAV_COLOR = '#166534';

const PO_STATUS_COLORS: Record<string, string> = {
  DRAFT:    'bg-slate-100 text-slate-600',
  SENT:     'bg-blue-100 text-blue-700',
  PARTIAL:  'bg-amber-100 text-amber-700',
  RECEIVED: 'bg-emerald-100 text-emerald-700',
  CANCELLED:'bg-red-100 text-red-700',
};

export default function SupplierDetailPage() {
  const id = (useParams() as any)?.['id'] ?? '';
  const router    = useRouter();
  const [supplier, setSupplier] = useState<any>(null);
  const [orders,   setOrders]   = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    // Load supplier detail and their PO history concurrently
    Promise.all([
      api.get(`/pharmacy/suppliers/${id}`).catch(() => null),
      api.get('/pharmacy/purchase-orders', { params: { supplierId: id, limit: 20 } }).catch(() => ({ data: { data: [] } })),
    ]).then(([supplierRes, ordersRes]) => {
      if (supplierRes?.data) {
        setSupplier(supplierRes.data);
      } else {
        // Fallback: load all suppliers and find this one
        api.get('/pharmacy/suppliers').then(r => {
          const all: any[] = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
          setSupplier(all.find((s: any) => s.id === id) ?? null);
        }).catch(() => setSupplier(null));
      }
      setOrders(ordersRes.data?.data ?? []);
    }).finally(() => {
      setLoading(false);
      setLoadingOrders(false);
    });
  }, [id]);

  const totalSpend   = orders.filter((o: any) => o.status === 'RECEIVED').reduce((s: any, o: any) => s + (o.totalAmount ?? 0), 0);
  const pendingOrders = orders.filter((o: any) => ['SENT', 'PARTIAL', 'DRAFT'].includes(o.status)).length;
  const lastOrderDate = orders.length > 0 ? orders[0].createdAt : null;

  if (loading) {
    return (
      <div className="space-y-4 max-w-4xl">
        {[1,2,3].map((i: any) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-24" />)}
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="text-center py-20">
        <Truck className="w-12 h-12 text-slate-200 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">Supplier not found</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-emerald-700 hover:underline">
          ← Back to suppliers
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Back + header */}
      <div className="flex items-start gap-4">
        <button onClick={() => router.back()}
          className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50 mt-1 flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl text-white flex items-center justify-center text-lg font-bold flex-shrink-0"
              style={{ background: NAV_COLOR }}>
              {supplier.name?.[0] ?? 'S'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{supplier.name}</h1>
              {supplier.contactPerson && (
                <p className="text-sm text-slate-500 mt-0.5">Contact: {supplier.contactPerson}</p>
              )}
            </div>
          </div>
        </div>
        <a href={`/pharmacy/purchase-orders`}
          className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl flex-shrink-0"
          style={{ background: NAV_COLOR }}>
          <ShoppingCart className="w-4 h-4" /> New PO
        </a>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Orders',    value: orders.length,           icon: FileText,     color: NAV_COLOR  },
          { label: 'Total Spend',     value: formatINR(totalSpend),   icon: TrendingUp,   color: '#10B981'  },
          { label: 'Pending Orders',  value: pendingOrders,           icon: Clock,        color: '#F59E0B'  },
          { label: 'Last Order',      value: lastOrderDate ? formatDate(lastOrderDate) : 'Never', icon: Package, color: '#3B82F6' },
        ].map((k: any) => (
          <div key={k.label} className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center gap-2 mb-2">
              <k.icon className="w-4 h-4" style={{ color: k.color }} />
              <p className="text-xs text-slate-500">{k.label}</p>
            </div>
            <p className="text-xl font-bold text-slate-900 truncate">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Contact info + PO history */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Contact card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
          <h3 className="font-semibold text-slate-900">Contact Details</h3>
          {[
            { icon: Phone,     value: supplier.phone },
            { icon: Mail,      value: supplier.email },
            { icon: MapPin,    value: supplier.address ? `${supplier.address}${supplier.city ? ', ' + supplier.city : ''}` : supplier.city },
            { icon: Building2, value: supplier.gstNumber ? `GST: ${supplier.gstNumber}` : null },
            { icon: FileText,  value: supplier.drugLicence ? `Drug Lic: ${supplier.drugLicence}` : null },
          ].filter((f: any) => f.value).map((f, i) => (
            <div key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
              <f.icon className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <span className="truncate">{f.value}</span>
            </div>
          ))}
          {supplier.creditDays && (
            <div className="mt-3 pt-3 border-t border-slate-50">
              <p className="text-xs text-slate-500">Credit Terms</p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">{supplier.creditDays} days</p>
            </div>
          )}
        </div>

        {/* PO history */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Purchase Order History</h3>
          </div>
          {loadingOrders ? (
            <div className="p-5 space-y-3">
              {[1,2,3].map((i: any) => <div key={i} className="animate-pulse bg-slate-100 rounded-xl h-12" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingCart className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No purchase orders yet</p>
              <a href="/pharmacy/purchase-orders"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900">
                Create first PO →
              </a>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['PO Number', 'Date', 'Amount', 'Status', ''].map((h: any) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.map((po: any) => (
                  <tr key={po.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-700 font-semibold">
                      {po.orderNumber ?? po.id?.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(po.createdAt)}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 text-sm">{formatINR(po.totalAmount ?? 0)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${PO_STATUS_COLORS[po.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <a href="/pharmacy/purchase-orders"
                        className="text-xs text-emerald-700 font-semibold hover:underline">
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
