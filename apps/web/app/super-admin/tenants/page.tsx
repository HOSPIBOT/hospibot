'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Plus, Filter, Download, Building2, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';

type Status = 'ALL' | 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'CANCELLED';
type Plan = 'ALL' | 'STARTER' | 'GROWTH' | 'ENTERPRISE';

const MOCK_TENANTS = [
  { id: '1', name: 'Apollo Specialty Clinic', slug: 'apollo-specialty', type: 'CLINIC', city: 'Mumbai', state: 'Maharashtra', plan: 'ENTERPRISE', status: 'ACTIVE', users: 42, patients: 12480, mrr: 12000, joined: '2024-01-15', waLinked: true },
  { id: '2', name: 'Sunrise Diagnostics', slug: 'sunrise-diagnostics', type: 'DIAGNOSTIC_CENTER', city: 'Pune', state: 'Maharashtra', plan: 'GROWTH', status: 'TRIAL', users: 8, patients: 940, mrr: 6000, joined: '2024-03-28', waLinked: false },
  { id: '3', name: 'Dr. Kiran Heart Centre', slug: 'kiran-heart', type: 'HOSPITAL', city: 'Hyderabad', state: 'Telangana', plan: 'ENTERPRISE', status: 'ACTIVE', users: 68, patients: 34200, mrr: 18000, joined: '2023-11-02', waLinked: true },
  { id: '4', name: 'Lotus IVF Centre', slug: 'lotus-ivf', type: 'IVF_CENTER', city: 'Bangalore', state: 'Karnataka', plan: 'GROWTH', status: 'ACTIVE', users: 14, patients: 2890, mrr: 9000, joined: '2024-02-10', waLinked: true },
  { id: '5', name: 'MedFirst Pharmacy', slug: 'medfirst', type: 'PHARMACY', city: 'Chennai', state: 'Tamil Nadu', plan: 'STARTER', status: 'TRIAL', users: 3, patients: 120, mrr: 2000, joined: '2024-04-01', waLinked: false },
  { id: '6', name: 'Healing Hands Hospital', slug: 'healing-hands', type: 'HOSPITAL', city: 'Delhi', state: 'Delhi', plan: 'ENTERPRISE', status: 'ACTIVE', users: 94, patients: 56000, mrr: 18000, joined: '2023-08-20', waLinked: true },
  { id: '7', name: 'CureMD Polyclinic', slug: 'curemd', type: 'CLINIC', city: 'Ahmedabad', state: 'Gujarat', plan: 'GROWTH', status: 'SUSPENDED', users: 11, patients: 3200, mrr: 0, joined: '2024-01-05', waLinked: false },
  { id: '8', name: 'BrightPath Labs', slug: 'brightpath-labs', type: 'DIAGNOSTIC_CENTER', city: 'Kolkata', state: 'West Bengal', plan: 'STARTER', status: 'ACTIVE', users: 6, patients: 1840, mrr: 2000, joined: '2023-12-18', waLinked: true },
  { id: '9', name: 'SwasthyaKare Clinic', slug: 'swasthyakare', type: 'CLINIC', city: 'Jaipur', state: 'Rajasthan', plan: 'GROWTH', status: 'ACTIVE', users: 9, patients: 4100, mrr: 6000, joined: '2024-02-28', waLinked: true },
  { id: '10', name: 'NovaCare Home Health', slug: 'novacare', type: 'HOME_HEALTHCARE', city: 'Gurgaon', state: 'Haryana', plan: 'GROWTH', status: 'ACTIVE', users: 18, patients: 890, mrr: 6000, joined: '2024-03-10', waLinked: false },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-700',
    TRIAL: 'bg-amber-100 text-amber-700',
    SUSPENDED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-slate-100 text-slate-500',
  };
  return <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${map[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>;
}

function PlanBadge({ plan }: { plan: string }) {
  const map: Record<string, string> = {
    STARTER: 'bg-slate-100 text-slate-600',
    GROWTH: 'bg-blue-100 text-blue-700',
    ENTERPRISE: 'bg-violet-100 text-violet-700',
  };
  return <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${map[plan] || 'bg-slate-100'}`}>{plan}</span>;
}

export default function TenantsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status>('ALL');
  const [planFilter, setPlanFilter] = useState<Plan>('ALL');
  const [page, setPage] = useState(1);
  const perPage = 8;

  const filtered = MOCK_TENANTS.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.city.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchPlan = planFilter === 'ALL' || t.plan === planFilter;
    return matchSearch && matchStatus && matchPlan;
  });

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const stats = {
    total: MOCK_TENANTS.length,
    active: MOCK_TENANTS.filter(t => t.status === 'ACTIVE').length,
    trial: MOCK_TENANTS.filter(t => t.status === 'TRIAL').length,
    suspended: MOCK_TENANTS.filter(t => t.status === 'SUSPENDED').length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hospitals & Clinics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage all tenants on the platform</p>
        </div>
        <Link href="/super-admin/tenants/new">
          <button className="flex items-center gap-2 bg-[#0D7C66] hover:bg-[#0A5E4F] text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> Add Tenant
          </button>
        </Link>
      </div>

      {/* Stat pills */}
      <div className="flex items-center gap-3 flex-wrap">
        {[
          { label: 'Total', value: stats.total, color: 'bg-slate-100 text-slate-700' },
          { label: 'Active', value: stats.active, color: 'bg-emerald-100 text-emerald-700' },
          { label: 'Trial', value: stats.trial, color: 'bg-amber-100 text-amber-700' },
          { label: 'Suspended', value: stats.suspended, color: 'bg-red-100 text-red-700' },
        ].map((s) => (
          <span key={s.label} className={`${s.color} text-xs font-semibold px-3 py-1.5 rounded-full`}>
            {s.label}: {s.value}
          </span>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1 min-w-64">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              className="bg-transparent text-sm outline-none flex-1 text-slate-700 placeholder:text-slate-400"
              placeholder="Search by name, city, or slug..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as Status); setPage(1); }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none cursor-pointer">
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="TRIAL">Trial</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Plan filter */}
          <select
            value={planFilter}
            onChange={(e) => { setPlanFilter(e.target.value as Plan); setPage(1); }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none cursor-pointer">
            <option value="ALL">All Plans</option>
            <option value="STARTER">Starter</option>
            <option value="GROWTH">Growth</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>

          <button className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Organization</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Location</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Plan</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Users</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Patients</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">MRR</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">WA</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginated.map((t) => (
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
                <td className="px-5 py-3.5 text-sm text-slate-600">{t.city}, {t.state}</td>
                <td className="px-5 py-3.5"><PlanBadge plan={t.plan} /></td>
                <td className="px-5 py-3.5"><StatusBadge status={t.status} /></td>
                <td className="px-5 py-3.5 text-sm font-medium text-slate-800">{t.users}</td>
                <td className="px-5 py-3.5 text-sm text-slate-600">{t.patients.toLocaleString('en-IN')}</td>
                <td className="px-5 py-3.5 text-sm font-semibold text-slate-900">
                  {t.status === 'SUSPENDED' ? <span className="text-slate-400">—</span> : `₹${(t.mrr / 1000).toFixed(0)}K`}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`w-2 h-2 rounded-full inline-block ${t.waLinked ? 'bg-[#25D366]' : 'bg-slate-300'}`} title={t.waLinked ? 'WhatsApp linked' : 'Not linked'} />
                </td>
                <td className="px-4 py-3.5">
                  <button className="text-slate-400 hover:text-slate-700 transition-colors opacity-0 group-hover:opacity-100">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Showing {Math.min((page - 1) * perPage + 1, filtered.length)}–{Math.min(page * perPage, filtered.length)} of {filtered.length} tenants
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className={`w-7 h-7 text-xs rounded-lg font-medium transition-colors ${page === i + 1 ? 'bg-[#0D7C66] text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
