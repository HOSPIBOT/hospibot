'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Building2, Users, MessageSquare, Calendar, CreditCard,
  Edit3, Ban, Trash2, AlertTriangle, Activity, TrendingUp, RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  getTenantById, updateTenantStatus, updateTenantPlan, deleteTenant,
  type Tenant, type PlanType,
} from '@/lib/super-admin-api';

const PLAN_MRR: Record<string, number> = { STARTER: 500, GROWTH: 1200, ENTERPRISE: 4500 };

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-slate-50 last:border-0">
      <span className="text-sm text-slate-500 w-44 flex-shrink-0">{label}</span>
      <span className="text-sm text-slate-900 font-medium text-right">{value || '—'}</span>
    </div>
  );
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700', TRIAL: 'bg-amber-100 text-amber-700',
  SUSPENDED: 'bg-red-100 text-red-700', CANCELLED: 'bg-slate-100 text-slate-500',
};
const PLAN_COLORS: Record<string, string> = {
  STARTER: 'bg-slate-100 text-slate-700', GROWTH: 'bg-blue-100 text-blue-700',
  ENTERPRISE: 'bg-violet-100 text-violet-700',
};

export default function TenantDetailPage() {
  const id = (useParams() as any)?.['id'] ?? '';
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'branches' | 'billing' | 'whatsapp'>('overview');
  const [confirm, setConfirm] = useState<null | 'suspend' | 'activate' | 'cancel' | 'delete'>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('GROWTH');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTenantById(id);
      setTenant(data);
      setSelectedPlan(data.plan);
    } catch {
      toast.error('Tenant not found');
      router.push('/super-admin/tenants');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleStatusAction = async () => {
    if (!confirm || confirm === 'delete') return;
    setActionLoading(true);
    try {
      const action = confirm === 'suspend' ? 'SUSPEND' : confirm === 'activate' ? 'ACTIVATE' : 'CANCEL';
      const updated = await updateTenantStatus(id, action);
      setTenant(prev => prev ? { ...prev, status: updated.status } : prev);
      toast.success(`Tenant ${action.toLowerCase()}d successfully`);
      setConfirm(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await deleteTenant(id);
      toast.success('Tenant permanently deleted');
      router.push('/super-admin/tenants');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePlanChange = async () => {
    if (!tenant || selectedPlan === tenant.plan) return;
    setActionLoading(true);
    try {
      const updated = await updateTenantPlan(id, selectedPlan);
      setTenant(prev => prev ? { ...prev, plan: updated.plan } : prev);
      toast.success(`Plan changed to ${selectedPlan}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Plan update failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!tenant) return (
    <div className="p-6">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
        <div>Tenant not found or failed to load. <Link href="/super-admin/tenants" className="underline font-medium">Back to tenants list</Link></div>
      </div>
    </div>
  );

  const mrr = PLAN_MRR[tenant.plan] || 0;

  return (
    <div className="space-y-5">
      <Link href="/super-admin/tenants" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#0D7C66] transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Tenants
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#E8F5F0] text-[#0D7C66] flex items-center justify-center text-xl font-bold">
              {tenant.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{tenant.name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-slate-500">{tenant.slug}</span>
                <span className="text-slate-300">·</span>
                <span className="text-xs text-slate-500">{tenant.type.replace(/_/g, ' ')}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[tenant.status]}`}>{tenant.status}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${PLAN_COLORS[tenant.plan]}`}>{tenant.plan}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={load} className="p-2 text-slate-400 hover:text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors" title="Refresh">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            {tenant.status !== 'ACTIVE' && (
              <button onClick={() => setConfirm('activate')}
                className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 border border-emerald-200 bg-emerald-50 rounded-xl px-3 py-2 hover:bg-emerald-100 transition-colors">
                <CheckCircle2 className="w-3.5 h-3.5" /> Activate
              </button>
            )}
            {tenant.status === 'ACTIVE' && (
              <button onClick={() => setConfirm('suspend')}
                className="flex items-center gap-1.5 text-xs font-medium text-amber-700 border border-amber-200 bg-amber-50 rounded-xl px-3 py-2 hover:bg-amber-100 transition-colors">
                <Ban className="w-3.5 h-3.5" /> Suspend
              </button>
            )}
            <button onClick={() => setConfirm('delete')}
              className="flex items-center gap-1.5 text-xs font-medium text-red-700 border border-red-200 bg-red-50 rounded-xl px-3 py-2 hover:bg-red-100 transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-5 gap-4 mt-5 pt-5 border-t border-slate-100">
          {[
            { label: 'Users',        value: tenant._count?.users       ?? '—', icon: Users,        color: '#0D7C66' },
            { label: 'Branches',     value: tenant._count?.branches    ?? '—', icon: Building2,    color: '#3B82F6' },
            { label: 'Patients',     value: (tenant._count?.patients ?? 0).toLocaleString('en-IN'), icon: Activity, color: '#F59E0B' },
            { label: 'Appointments', value: (tenant._count?.appointments ?? 0).toLocaleString('en-IN'), icon: Calendar, color: '#8B5CF6' },
            { label: 'MRR',          value: `₹${(mrr / 1000).toFixed(1)}K`, icon: TrendingUp, color: '#10B981' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="w-9 h-9 rounded-xl mx-auto flex items-center justify-center mb-2" style={{ background: `${s.color}15` }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <p className="text-lg font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {(['overview', 'branches', 'billing', 'whatsapp'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`text-sm font-medium px-4 py-1.5 rounded-lg capitalize transition-all ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t === 'whatsapp' ? 'WhatsApp' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Contact & Location</h3>
            <InfoRow label="Email"    value={tenant.email} />
            <InfoRow label="Phone"    value={tenant.phone} />
            <InfoRow label="Website"  value={tenant.website} />
            <InfoRow label="Address"  value={tenant.address} />
            <InfoRow label="City"     value={[tenant.city, tenant.state].filter(Boolean).join(', ')} />
            <InfoRow label="Pincode"  value={tenant.pincode} />
            <InfoRow label="Country"  value={tenant.country} />
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Account Details</h3>
            <InfoRow label="Tenant ID"   value={tenant.id} />
            <InfoRow label="Slug"        value={tenant.slug} />
            <InfoRow label="Plan"        value={tenant.plan} />
            <InfoRow label="Status"      value={tenant.status} />
            <InfoRow label="Member Since" value={new Date(tenant.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />
            <InfoRow label="Last Updated" value={new Date(tenant.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />
          </div>
        </div>
      )}

      {/* Tab: Branches */}
      {tab === 'branches' && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Branches ({tenant.branches?.length ?? 0})</h3>
          </div>
          {(!tenant.branches || tenant.branches.length === 0) ? (
            <div className="py-12 text-center text-slate-400 text-sm">No branches found.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Branch</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Code</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">City</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tenant.branches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-slate-900">{b.name}</td>
                    <td className="px-5 py-3.5 text-xs font-mono text-slate-500">{b.code}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">{b.city}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${b.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {b.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Billing */}
      {tab === 'billing' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Billing Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Current Plan', value: tenant.plan, sub: `₹${PLAN_MRR[tenant.plan]?.toLocaleString('en-IN') || '—'}/month` },
                { label: 'MRR Contribution', value: `₹${(mrr / 1000).toFixed(1)}K`, sub: 'Monthly' },
                { label: 'Invoices', value: String(tenant._count?.invoices ?? '—'), sub: 'Total issued' },
              ].map((b) => (
                <div key={b.label} className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">{b.label}</p>
                  <p className="text-xl font-bold text-slate-900">{b.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{b.sub}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Change Plan</h3>
            <div className="flex items-center gap-3">
              {(['STARTER', 'GROWTH', 'ENTERPRISE'] as PlanType[]).map((plan) => (
                <button key={plan} onClick={() => setSelectedPlan(plan)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${selectedPlan === plan ? 'bg-[#0D7C66] text-white border-[#0D7C66]' : 'border-slate-200 text-slate-600 hover:border-[#0D7C66] hover:text-[#0D7C66]'}`}>
                  {plan}
                </button>
              ))}
              <button onClick={handlePlanChange} disabled={actionLoading || selectedPlan === tenant.plan}
                className="ml-auto bg-[#0D7C66] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#0A5E4F] disabled:opacity-50 transition-colors">
                {actionLoading ? 'Saving…' : 'Apply Change'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: WhatsApp */}
      {tab === 'whatsapp' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tenant.waPhoneNumberId ? 'bg-[#25D366]/15' : 'bg-slate-100'}`}>
              <MessageSquare className={`w-5 h-5 ${tenant.waPhoneNumberId ? 'text-[#25D366]' : 'text-slate-400'}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {tenant.waPhoneNumberId ? 'WhatsApp Business API Connected' : 'WhatsApp Not Configured'}
              </p>
              <p className="text-xs text-slate-400">
                {tenant.waPhoneNumberId ? `Phone Number ID: ${tenant.waPhoneNumberId}` : 'No WhatsApp Business account linked'}
              </p>
            </div>
            {tenant.waPhoneNumberId && (
              <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-semibold">● Live</span>
            )}
          </div>
          {tenant.waPhoneNumberId ? (
            <>
              <InfoRow label="Phone Number ID" value={tenant.waPhoneNumberId} />
              <InfoRow label="Business ID"     value={tenant.waBusinessId || 'Not set'} />
              <InfoRow label="Access Token"    value="••••••••••••••••••••••" />
            </>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">WhatsApp not configured</p>
                <p className="text-xs text-amber-700 mt-0.5">Contact this tenant to complete WhatsApp Business API setup.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirm dialog */}
      {confirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !actionLoading && setConfirm(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {confirm === 'delete' ? 'Delete Tenant?' :
               confirm === 'suspend' ? 'Suspend Tenant?' :
               confirm === 'activate' ? 'Activate Tenant?' : 'Cancel Tenant?'}
            </h3>
            <p className="text-sm text-slate-600 mb-5">
              {confirm === 'delete'
                ? `Permanently deleting "${tenant.name}" will erase all data including patients, appointments, and invoices. This CANNOT be undone.`
                : confirm === 'suspend'
                ? `Suspending "${tenant.name}" will disable all logins and WhatsApp services. This can be reversed.`
                : confirm === 'activate'
                ? `Re-activating "${tenant.name}" will restore full access for all users.`
                : `Cancelling "${tenant.name}" marks the account as cancelled. It can be reactivated.`}
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button onClick={() => setConfirm(null)} disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button
                onClick={confirm === 'delete' ? handleDelete : handleStatusAction}
                disabled={actionLoading}
                className={`px-4 py-2 text-sm font-medium text-white rounded-xl transition-colors disabled:opacity-60 ${
                  confirm === 'delete' ? 'bg-red-600 hover:bg-red-700' :
                  confirm === 'suspend' ? 'bg-amber-500 hover:bg-amber-600' :
                  'bg-[#0D7C66] hover:bg-[#0A5E4F]'}`}>
                {actionLoading ? 'Processing…' :
                 confirm === 'delete' ? 'Yes, Delete Permanently' :
                 confirm === 'suspend' ? 'Yes, Suspend' :
                 confirm === 'activate' ? 'Yes, Activate' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
