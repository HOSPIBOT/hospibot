'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate, formatTime, formatINR } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  FlaskConical, Plus, Search, RefreshCw, Loader2,
  Clock, CheckCircle2, AlertTriangle, ChevronRight, X, Zap,
} from 'lucide-react';

const NAVY = '#1E3A5F';
const TEAL = '#0D7C66';

const STAGES = [
  { key: 'ORDERED',          label: 'Ordered',       color: '#94A3B8', bg: '#F8FAFC' },
  { key: 'SAMPLE_COLLECTED', label: 'Collected',     color: '#3B82F6', bg: '#EFF6FF' },
  { key: 'DISPATCHED',       label: 'Dispatched',    color: '#8B5CF6', bg: '#F5F3FF' },
  { key: 'RECEIVED_AT_LAB',  label: 'At Lab',        color: '#06B6D4', bg: '#ECFEFF' },
  { key: 'IN_PROGRESS',      label: 'In Progress',   color: '#F59E0B', bg: '#FFFBEB' },
  { key: 'RESULTED',         label: 'Results Ready', color: '#F97316', bg: '#FFF7ED' },
  { key: 'VALIDATED',        label: 'Validated',     color: '#22C55E', bg: '#F0FDF4' },
  { key: 'DELIVERED',        label: 'Delivered',     color: '#10B981', bg: '#ECFDF5' },
  { key: 'CANCELLED',        label: 'Cancelled',     color: '#EF4444', bg: '#FEF2F2' },
  { key: 'REJECTED',         label: 'Rejected',      color: '#DC2626', bg: '#FEF2F2' },
];

const NEXT_STATUS: Record<string, { to: string; label: string; color: string }> = {
  ORDERED:          { to: 'SAMPLE_COLLECTED', label: 'Collect Sample', color: '#3B82F6' },
  SAMPLE_COLLECTED: { to: 'DISPATCHED',       label: 'Dispatch',       color: '#8B5CF6' },
  DISPATCHED:       { to: 'RECEIVED_AT_LAB',  label: 'Mark Received',  color: '#06B6D4' },
  RECEIVED_AT_LAB:  { to: 'IN_PROGRESS',      label: 'Start Testing',  color: '#F59E0B' },
};

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/10 outline-none transition-all placeholder:text-slate-400';

function StatusBadge({ status, isStat }: { status: string; isStat?: boolean }) {
  const s = STAGES.find(x => x.key === status);
  return (
    <div className="flex items-center gap-1.5">
      {isStat && <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-black rounded uppercase">STAT</span>}
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
        style={{ background: s?.bg ?? '#F8FAFC', color: s?.color ?? '#94A3B8' }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: s?.color ?? '#94A3B8' }} />
        {s?.label ?? status}
      </span>
    </div>
  );
}

function TatWarning({ createdAt, status }: { createdAt: string; status: string }) {
  if (['DELIVERED', 'CANCELLED', 'REJECTED'].includes(status)) return null;
  const hours = (Date.now() - new Date(createdAt).getTime()) / 3600000;
  if (hours < 18) return null;
  const color = hours > 24 ? '#EF4444' : '#F97316';
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1"
      style={{ background: `${color}15`, color }}>
      <Clock className="w-2.5 h-2.5" />
      {hours > 24 ? 'BREACHED' : 'WARNING'}
    </span>
  );
}

function OrderRow({ order, onRefresh }: { order: any; onRefresh: () => void }) {
  const router = useRouter();
  const [advancing, setAdvancing] = useState(false);
  const p = order.patient ?? {};
  const name = `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || '—';
  const tests = Array.isArray(order.orderItems) ? order.orderItems : (order.tests ?? []);
  const next = NEXT_STATUS[order.status];

  const advance = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!next) return;
    setAdvancing(true);
    try {
      await api.patch(`/diagnostic/orders/${order.id}/status`, { status: next.to })
        .catch(() => api.patch(`/lab/orders/${order.id}/status`, { status: next.to }));
      toast.success(next.label);
      onRefresh();
    } catch { toast.error('Update failed'); }
    finally { setAdvancing(false); }
  };

  return (
    <tr className="hover:bg-slate-50/60 transition-colors cursor-pointer group border-b border-slate-100 last:border-0"
      onClick={() => router.push(`/diagnostic/lab-orders/${order.id}`)}>
      <td className="px-5 py-3.5">
        <p className="text-sm font-bold text-[#1E3A5F] font-mono">{order.orderNumber}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(order.createdAt)} {formatTime(order.createdAt)}</p>
        <TatWarning createdAt={order.createdAt} status={order.status} />
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#1E3A5F]/10 flex items-center justify-center text-[10px] font-bold text-[#1E3A5F] flex-shrink-0">
            {(p.firstName?.[0] ?? '?').toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{name}</p>
            <p className="text-xs text-slate-400">{p.phone}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {tests.slice(0, 3).map((t: any, i: number) => (
            <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
              {t.testCode ?? t.code ?? t.testName ?? t.name ?? String(t)}
            </span>
          ))}
          {tests.length > 3 && <span className="text-[10px] text-slate-400">+{tests.length - 3}</span>}
        </div>
      </td>
      <td className="px-5 py-3.5"><StatusBadge status={order.status} isStat={order.isStat} /></td>
      <td className="px-5 py-3.5">
        {order.totalAmount ? <p className="text-sm font-semibold text-slate-700">{formatINR(order.totalAmount)}</p> : null}
      </td>
      <td className="px-5 py-3.5 text-right">
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {next && (
            <button onClick={advance} disabled={advancing}
              className="text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-1"
              style={{ background: next.color }}>
              {advancing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
              {next.label}
            </button>
          )}
          <ChevronRight className="w-4 h-4 text-slate-300" />
        </div>
      </td>
    </tr>
  );
}

export default function LabOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [statOnly, setStatOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (status) params.status = status;
      if (statOnly) params.statOnly = true;
      const res = await api.get('/diagnostic/orders', { params })
        .catch(() => api.get('/lab/orders', { params }));
      setOrders(res.data.data ?? []);
      setMeta(res.data.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1 });
    } finally { setLoading(false); }
  }, [page, search, status, statOnly, refreshKey]);

  useEffect(() => { load(); }, [load]);

  const statusCounts = orders.reduce((acc: any, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1; return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Lab Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">{meta.total} total orders</p>
        </div>
        <Link href="/diagnostic/lab-orders/new">
          <button className="flex items-center gap-2 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
            style={{ background: NAVY }}>
            <Plus className="w-4 h-4" /> New Order
          </button>
        </Link>
      </div>

      {/* Status filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => { setStatus(''); setStatOnly(false); setPage(1); }}
          className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${!status && !statOnly ? 'text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
          style={!status && !statOnly ? { background: NAVY } : {}}>
          All ({meta.total})
        </button>
        {STAGES.slice(0, 8).map(s => {
          const cnt = statusCounts[s.key] ?? 0;
          const active = status === s.key;
          return (
            <button key={s.key} onClick={() => { setStatus(active ? '' : s.key); setPage(1); }}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${active ? 'text-white border-transparent' : 'bg-white border-slate-200 text-slate-600'}`}
              style={active ? { background: s.color } : {}}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: active ? 'white' : s.color }} />
              {s.label} {cnt > 0 && <span className="font-black">{cnt}</span>}
            </button>
          );
        })}
        <button onClick={() => { setStatOnly(!statOnly); setPage(1); }}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border ${statOnly ? 'bg-red-500 text-white border-transparent' : 'bg-white border-red-200 text-red-600'}`}>
          <Zap className="w-3 h-3" /> STAT
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className={`${inputCls} pl-10`} placeholder="Search by order number, patient name, or phone…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          {search && (
            <button className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              onClick={() => setSearch('')}>
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button onClick={() => setRefreshKey(k => k + 1)}
          className="flex items-center gap-2 text-sm text-slate-600 bg-white border border-slate-200 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              {['Order ID', 'Patient', 'Tests', 'Status', 'Amount', ''].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-100">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="animate-pulse bg-slate-200 rounded-lg h-4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-slate-400">
                  <FlaskConical className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                  <p className="font-semibold text-slate-500">No orders found</p>
                  <p className="text-sm mt-1">{search || status ? 'Try different filters' : 'Create the first order'}</p>
                </td>
              </tr>
            ) : orders.map(o => (
              <OrderRow key={o.id} order={o} onRefresh={() => setRefreshKey(k => k + 1)} />
            ))}
          </tbody>
        </table>

        {meta.totalPages > 1 && (
          <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing {(page - 1) * meta.limit + 1}–{Math.min(page * meta.limit, meta.total)} of {meta.total}
            </p>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-sm text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40">
                Previous
              </button>
              <span className="text-sm text-slate-600">{page} / {meta.totalPages}</span>
              <button disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-sm text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
