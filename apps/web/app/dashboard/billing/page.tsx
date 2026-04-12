'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatINR, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { TrendingUp, CreditCard, AlertCircle, CheckCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600', SENT: 'badge-info', PAID: 'badge-success',
  PARTIALLY_PAID: 'badge-warning', OVERDUE: 'badge-danger', CANCELLED: 'bg-gray-100 text-gray-500',
};

export default function BillingPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [revenue, setRevenue] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const [invRes, revRes] = await Promise.all([
        api.get('/billing/invoices', { params }),
        api.get('/billing/revenue?period=month'),
      ]);
      setInvoices(invRes.data.data);
      setMeta(invRes.data.meta);
      setRevenue(revRes.data);
    } catch { toast.error('Failed to load billing data'); }
    finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Billing</h1>

      {revenue && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="card">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatINR(revenue.totalRevenue)}</p>
            <p className="text-xs text-gray-400 mt-1">This month</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">Collected</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{formatINR(revenue.totalCollected)}</p>
            <p className="text-xs text-emerald-500 mt-1">{revenue.collectionRate}% collection rate</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">Outstanding</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{formatINR(revenue.totalDue)}</p>
            <p className="text-xs text-gray-400 mt-1">{revenue.invoiceCount - revenue.paidCount} unpaid invoices</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">Invoices</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{revenue.invoiceCount}</p>
            <p className="text-xs text-emerald-500 mt-1">{revenue.paidCount} paid</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 px-4 py-2.5 flex-1">
          <Search className="w-4 h-4 text-gray-400" />
          <input className="flex-1 text-sm outline-none" placeholder="Search by invoice number or patient..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-field w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="SENT">Sent</option>
          <option value="PAID">Paid</option>
          <option value="PARTIALLY_PAID">Partial</option>
          <option value="OVERDUE">Overdue</option>
        </select>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No invoices found</div>
        ) : (
          invoices.map(inv => (
            <div key={inv.id} className="card flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 font-mono text-sm">{inv.invoiceNumber}</p>
                  <span className={`badge ${statusColors[inv.status] || 'badge-info'}`}>{inv.status.replace('_', ' ')}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {inv.patient?.firstName} {inv.patient?.lastName || ''} &bull; {formatDate(inv.createdAt)}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-gray-900">{formatINR(inv.totalAmount)}</p>
                {inv.dueAmount > 0 && <p className="text-xs text-red-500">Due: {formatINR(inv.dueAmount)}</p>}
                {inv.dueAmount === 0 && inv.status === 'PAID' && <p className="text-xs text-emerald-500">Fully paid</p>}
              </div>
            </div>
          ))
        )}
      </div>

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {meta.page} of {meta.totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => fetchData(meta.page - 1)} disabled={meta.page <= 1} className="btn-outline text-sm disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => fetchData(meta.page + 1)} disabled={meta.page >= meta.totalPages} className="btn-outline text-sm disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
