'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Shield, ChevronLeft, ChevronRight, MoreHorizontal, RefreshCw, Download } from 'lucide-react';
import { getAllUsers, type PlatformUser } from '@/lib/super-admin-api';
import toast from 'react-hot-toast';

const ALL_ROLES = ['ALL', 'SUPER_ADMIN', 'TENANT_ADMIN', 'BRANCH_ADMIN', 'DOCTOR', 'RECEPTIONIST', 'BILLING_STAFF', 'NURSE', 'LAB_TECHNICIAN', 'PHARMACIST', 'MARKETING_USER'];

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-violet-100 text-violet-700',   TENANT_ADMIN: 'bg-[#E8F5F0] text-[#0D7C66]',
  BRANCH_ADMIN: 'bg-blue-100 text-blue-700',      DOCTOR: 'bg-amber-100 text-amber-700',
  RECEPTIONIST: 'bg-slate-100 text-slate-600',    BILLING_STAFF: 'bg-orange-100 text-orange-700',
  NURSE: 'bg-pink-100 text-pink-700',             LAB_TECHNICIAN: 'bg-cyan-100 text-cyan-700',
  PHARMACIST: 'bg-indigo-100 text-indigo-700',    MARKETING_USER: 'bg-rose-100 text-rose-700',
};

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />;
}

export default function UsersPage() {
  const [users, setUsers]     = useState<PlatformUser[]>([]);
  const [total, setTotal]     = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch]       = useState('');
  const [debSearch, setDebSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [page, setPage]           = useState(1);
  const perPage = 15;

  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllUsers({ page, limit: perPage, search: debSearch || undefined, role: roleFilter });
      setUsers(res?.data ?? []);
      setTotal(res?.meta?.total ?? 0);
      setTotalPages(res?.meta?.totalPages ?? 1);
    } catch { setUsers([]); } finally { setLoading(false); }
  }, [page, debSearch, roleFilter]);

  useEffect(() => { setPage(1); }, [debSearch, roleFilter]);
  useEffect(() => { load(); }, [load]);

  const [exporting, setExporting] = useState(false);
  const exportCSV = async () => {
    setExporting(true);
    try {
      const res = await getAllUsers({ page: 1, limit: 5000, search: debSearch || undefined, role: roleFilter });
      const all: PlatformUser[] = res.data;
      const header = ['First Name', 'Last Name', 'Email', 'Role', 'Tenant', 'Status', 'Last Login'];
      const rows = all.map((u: any) => [
        u.firstName ?? '', u.lastName ?? '', u.email ?? '',
        u.role?.replace(/_/g, ' ') ?? '',
        (u as any).tenant?.name ?? '',
        u.isActive !== false ? 'Active' : 'Inactive',
        u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('en-IN') : 'Never',
      ]);
      const csv  = [header, ...rows].map((r: any) => r.map((v: any) => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `platform-users-${new Date().toISOString().slice(0,10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
      toast.success(`Exported ${all.length} users`);
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  // Aggregate counts
  const superAdminCount = users.filter((u: any) => u.role === 'SUPER_ADMIN').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Users</h1>
          <p className="text-sm text-slate-500 mt-0.5">{loading ? 'Loading…' : `${total.toLocaleString('en-IN')} total users across all tenants`}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} disabled={exporting || loading}
            className="flex items-center gap-1.5 text-sm text-slate-600 border border-slate-200 bg-white px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
            <Download className="w-4 h-4" /> {exporting ? 'Exporting…' : 'Export'}
          </button>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1.5 text-sm text-slate-600 border border-slate-200 bg-white px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1 min-w-56">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input className="bg-transparent text-sm outline-none flex-1 placeholder:text-slate-400"
              placeholder="Search by name, email, or tenant…"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none cursor-pointer">
            {ALL_ROLES.map((r: any) => <option key={r} value={r}>{r === 'ALL' ? 'All Roles' : r.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : users.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm">No users found.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['User', 'Role', 'Tenant', 'Status', 'Last Login', ''].map((h: any) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#E8F5F0] text-[#0D7C66] flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {u.firstName[0]}{(u.lastName || '')[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${ROLE_COLORS[u.role] || 'bg-slate-100 text-slate-600'}`}>
                      {u.role.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{u.tenant?.name || '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {u.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never'}
                  </td>
                  <td className="px-4 py-3.5 relative">
                    <div className="relative group/menu">
                      <button className="text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition-all p-1 rounded-lg hover:bg-slate-100">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      <div className="absolute right-0 top-8 hidden group-hover/menu:block bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-1 min-w-[160px]">
                        <a href={`/super-admin/tenants`}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors">
                          <Shield className="w-3.5 h-3.5 text-slate-400" />
                          View Tenant
                        </a>
                        <button
                          onClick={() => navigator.clipboard.writeText(u.email).then(() => {/* silent */})}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors w-full text-left">
                          <MoreHorizontal className="w-3.5 h-3.5 text-slate-400" />
                          Copy Email
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && users.length > 0 && (
          <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Showing {Math.min((page-1)*perPage+1, total)}–{Math.min(page*perPage, total)} of {total.toLocaleString('en-IN')}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => (
                <button key={i+1} onClick={() => setPage(i+1)}
                  className={`w-7 h-7 text-xs rounded-lg font-medium transition-colors ${page===i+1 ? 'bg-[#0D7C66] text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{i+1}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}
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
