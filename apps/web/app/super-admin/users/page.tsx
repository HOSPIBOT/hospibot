'use client';

import { useState } from 'react';
import { Search, Shield, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

const ROLES = ['ALL', 'SUPER_ADMIN', 'TENANT_ADMIN', 'BRANCH_ADMIN', 'DOCTOR', 'RECEPTIONIST', 'BILLING_STAFF', 'NURSE'];

const MOCK_USERS = [
  { id: '1', firstName: 'Vinod', lastName: 'Bysani', email: 'vinod@hospibot.ai', role: 'SUPER_ADMIN', tenantName: 'Platform', status: 'ACTIVE', lastLogin: '10 min ago', createdAt: '2023-06-01' },
  { id: '2', firstName: 'Ravi', lastName: 'Kumar', email: 'ravi@kiranheartcentre.com', role: 'TENANT_ADMIN', tenantName: 'Dr. Kiran Heart Centre', status: 'ACTIVE', lastLogin: '2 hours ago', createdAt: '2023-11-02' },
  { id: '3', firstName: 'Priya', lastName: 'Sharma', email: 'priya.doc@apolloclinic.com', role: 'DOCTOR', tenantName: 'Apollo Specialty Clinic', status: 'ACTIVE', lastLogin: 'Yesterday', createdAt: '2024-01-15' },
  { id: '4', firstName: 'Anita', lastName: 'Reddy', email: 'anita@sunrisediag.com', role: 'TENANT_ADMIN', tenantName: 'Sunrise Diagnostics', status: 'ACTIVE', lastLogin: '3 days ago', createdAt: '2024-03-28' },
  { id: '5', firstName: 'Suresh', lastName: 'Nair', email: 'suresh@healinghands.com', role: 'BRANCH_ADMIN', tenantName: 'Healing Hands Hospital', status: 'ACTIVE', lastLogin: '1 day ago', createdAt: '2023-08-20' },
  { id: '6', firstName: 'Deepa', lastName: 'Menon', email: 'deepa@lotusivf.com', role: 'DOCTOR', tenantName: 'Lotus IVF Centre', status: 'ACTIVE', lastLogin: '5 hours ago', createdAt: '2024-02-10' },
  { id: '7', firstName: 'Rahul', lastName: 'Singh', email: 'rahul@curemd.com', role: 'TENANT_ADMIN', tenantName: 'CureMD Polyclinic', status: 'SUSPENDED', lastLogin: '2 weeks ago', createdAt: '2024-01-05' },
  { id: '8', firstName: 'Kavitha', lastName: 'Iyer', email: 'kavitha@brightpath.com', role: 'BILLING_STAFF', tenantName: 'BrightPath Labs', status: 'ACTIVE', lastLogin: '4 hours ago', createdAt: '2023-12-18' },
  { id: '9', firstName: 'Mohan', lastName: 'Das', email: 'mohan@swasthyakare.com', role: 'RECEPTIONIST', tenantName: 'SwasthyaKare Clinic', status: 'ACTIVE', lastLogin: '1 hour ago', createdAt: '2024-02-28' },
  { id: '10', firstName: 'Sunita', lastName: 'Patil', email: 'sunita@novacare.com', role: 'NURSE', tenantName: 'NovaCare Home Health', status: 'ACTIVE', lastLogin: '30 min ago', createdAt: '2024-03-10' },
];

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-violet-100 text-violet-700',
  TENANT_ADMIN: 'bg-[#E8F5F0] text-[#0D7C66]',
  BRANCH_ADMIN: 'bg-blue-100 text-blue-700',
  DOCTOR: 'bg-amber-100 text-amber-700',
  RECEPTIONIST: 'bg-slate-100 text-slate-600',
  BILLING_STAFF: 'bg-orange-100 text-orange-700',
  NURSE: 'bg-pink-100 text-pink-700',
};

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const perPage = 8;

  const filtered = MOCK_USERS.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) || u.tenantName.toLowerCase().includes(q);
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Users</h1>
        <p className="text-sm text-slate-500 mt-0.5">All users across every tenant</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full">Total: {MOCK_USERS.length}</span>
        <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full">Active: {MOCK_USERS.filter(u => u.status === 'ACTIVE').length}</span>
        <span className="bg-violet-100 text-violet-700 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <Shield className="w-3 h-3" /> Super Admins: {MOCK_USERS.filter(u => u.role === 'SUPER_ADMIN').length}
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1 min-w-64">
            <Search className="w-4 h-4 text-slate-400" />
            <input className="bg-transparent text-sm outline-none flex-1 placeholder:text-slate-400"
              placeholder="Search by name, email, or tenant..."
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none cursor-pointer">
            {ROLES.map(r => <option key={r} value={r}>{r === 'ALL' ? 'All Roles' : r.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Tenant</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Last Login</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginated.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/60 transition-colors group">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#E8F5F0] text-[#0D7C66] flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {u.firstName[0]}{u.lastName[0]}
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
                <td className="px-5 py-3.5 text-sm text-slate-600">{u.tenantName}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${u.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-xs text-slate-500">{u.lastLogin}</td>
                <td className="px-4 py-3.5">
                  <button className="text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition-all">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">Showing {Math.min((page-1)*perPage+1, filtered.length)}–{Math.min(page*perPage, filtered.length)} of {filtered.length}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} onClick={() => setPage(i+1)}
                className={`w-7 h-7 text-xs rounded-lg font-medium transition-colors ${page===i+1 ? 'bg-[#0D7C66] text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{i+1}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
