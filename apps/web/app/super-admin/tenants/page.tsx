'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Search, Plus, Download, MoreHorizontal,
  ChevronLeft, ChevronRight, RefreshCw,
} from 'lucide-react';
import {
  getAllTenants, type Tenant, type TenantStatus, type PlanType,
} from '@/lib/super-admin-api';

type StatusFilter = 'ALL' | TenantStatus;
type PlanFilter   = 'ALL' | PlanType;

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-700', TRIAL: 'bg-amber-100 text-amber-700',
    SUSPENDED: 'bg-red-100 text-red-700',      CANCELLED: 'bg-slate-100 text-slate-500',
  };
  return <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${map[status] || 'bg-slate-100'}`}>{status}</span>;
}

function PlanBadge({ plan }: { plan: string }) {
  const map: Record<string, string> = {
    STARTER: 'bg-slate-100 text-slate-600', GROWTH: 'bg-blue-100 text-blue-700',
    ENTERPRISE: 'bg-violet-100 text-violet-700',
  };
  return <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${map[plan] || 'bg-slate-100'}`}>{plan}</span>;
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />;
}

const MRR: Record<string, number> = { STARTER: 500, GROWTH: 1200, ENTERPRISE: 4500 };

export default function TenantsPage() {
  const [tenants, setTenants]   = useState<Tenant[]>([]);
  const [total, setTotal]       = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]   = useState(true);

  const [search, setSearch]         = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [planFilter, setPlanFilter]     = useState<PlanFilter>('ALL');
  const [page, setPage]             = useState(1);
  const perPage = 15;

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllTenants({
        page, limit: perPage,
        search: debouncedSearch || undefined,
        status: statusFilter,
        plan: planFilter,
      });
      setTenants(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch { /* show empty state */ }
    finally { setLoading(false); }
  }, [page, debouncedSearch, statusFilter, planFilter]);

  const [exporting, setExporting] = useState(false);

  const exportCSV = async () => {
    setExporting(true);
    try {
      const res = await getAllTenants({
        page: 1, limit: 5000,
        search: debouncedSearch || undefined,
        status: statusFilter,
        plan: planFilter,
      });
      const all: Tenant[] = res.data;
      const header = ['Name', 'Type', 'Plan', 'Status', 'City', 'State', 'Users', 'Patients', 'WhatsApp', 'Created'];
      const MRR: Record<string, number> = { STARTER: 500, GROWTH: 1200, ENTERPRISE: 4500 };
      const rows = all.map(t => [
        t.name, t.type?.replace(/_/g, ' ') ?? '',
        t.plan, t.status,
        t.city ?? '', t.state ?? '',
        t._count?.users ?? 0, t._count?.patients ?? 0,
        t.waPhoneNumberId ? 'Yes' : 'No',
        new Date(t.createdAt ?? '').toLocaleDateString('en-IN'),
      ]);
      const csv  = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `tenants-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${all.length} tenants`);
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, planFilter]);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hospitals & Clinics</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? 'Loading…' : `${total.toLocaleString('en-IN')} tenants on the platform`}
          </p>
        </div>
        <Link href="/super-admin/tenants/new">
          <button className="flex items-center gap-2 bg-[#0D7C66] hover:bg-[#0A5E4F] text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> Add Tenant
          </button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1 min-w-56">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input className="bg-transparent text-sm outline-none flex-1 placeholder:text-slate-400"
              placeholder="Search by name, city, or slug…"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none cursor-pointer">
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="TRIAL">Trial</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value as PlanFilter)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none cursor-pointer">
            <option value="ALL">All Plans</option>
            <option value="STARTER">Starter</option>
            <option value="GROWTH">Growth</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={exportCSV} disabled={exporting}
            className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50">
            <Download className="w-4 h-4" /> {exporting ? 'Exporting…' : 'Export'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : tenants.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-slate-400 text-sm">No tenants found. Try adjusting filters.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Organization', 'Location', 'Plan', 'Status', 'Users', 'Patients', 'MRR', 'WA', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/60 transition-colors group">
                  <td className="px-5 py-3.5">
                    <Link href={`/super-admin/tenants/${t.id}`}>
                      <div className="flex items-center gap-3 cursor-pointer">
                        <div className="w-9 h-9 rounded-xl bg-[#E8F5F0] text-[#0D7C66] flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {t.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 group-hover:text-[#0D7C66] transition-colors">{t.name}</p>
                          <p className="text-xs text-slate-400">{t.type.replace(/_/g, ' ')} · {t.slug}</p>
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{[t.city, t.state].filter(Boolean).join(', ')}</td>
                  <td className="px-5 py-3.5"><PlanBadge plan={t.plan} /></td>
                  <td className="px-5 py-3.5"><StatusBadge status={t.status} /></td>
                  <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{t._count?.users ?? '—'}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{(t._count?.patients ?? 0).toLocaleString('en-IN')}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-slate-900">
                    {t.status === 'SUSPENDED'
                      ? <span className="text-slate-400">—</span>
                      : `₹${((MRR[t.plan] || 0) / 1000).toFixed(1)}K`}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`w-2 h-2 rounded-full inline-block ${t.waPhoneNumberId ? 'bg-[#25D366]' : 'bg-slate-300'}`}
                      title={t.waPhoneNumberId ? 'WhatsApp linked' : 'Not linked'} />
                  </td>
                  <td className="px-4 py-3.5">
                    <button className="text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition-all">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {!loading && tenants.length > 0 && (
          <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Showing {Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} of {total.toLocaleString('en-IN')} tenants
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                const n = i + 1;
                return (
                  <button key={n} onClick={() => setPage(n)}
                    className={`w-7 h-7 text-xs rounded-lg font-medium transition-colors ${page === n ? 'bg-[#0D7C66] text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                    {n}
                  </button>
                );
              })}
              {totalPages > 7 && <span className="text-slate-400 text-xs px-1">…</span>}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
