'use client';

import { useState, useEffect } from 'react';
import { Check, Edit3, TrendingUp, Users, Building2, Zap, RefreshCw } from 'lucide-react';
import { getAllTenants } from '@/lib/super-admin-api';
import { api } from '@/lib/api';

// Live plan data fetched below — static fallback shown here
const plans = [
  {
    key: 'STARTER',
    name: 'Starter',
    price: 500,
    color: '#64748B',
    gradient: 'from-slate-500 to-slate-400',
    tenants: 89,
    mrr: 44500,
    features: [
      'Up to 3 users',
      '1 branch only',
      '1,000 WhatsApp messages/mo',
      'Basic appointment scheduling',
      'Patient records (up to 5,000)',
      'Basic analytics',
      'Email support',
    ],
    limits: { users: 3, branches: 1, waMessages: 1000, patients: 5000 },
  },
  {
    key: 'GROWTH',
    name: 'Growth',
    price: 1200,
    color: '#3B82F6',
    gradient: 'from-blue-500 to-blue-400',
    tenants: 87,
    mrr: 104400,
    features: [
      'Up to 15 users',
      'Up to 3 branches',
      '5,000 WhatsApp messages/mo',
      'Full appointment management',
      'Unlimited patients',
      'Revenue engine automation',
      'Advanced analytics',
      'Priority email + chat support',
    ],
    limits: { users: 15, branches: 3, waMessages: 5000, patients: -1 },
  },
  {
    key: 'ENTERPRISE',
    name: 'Enterprise',
    price: 4500,
    color: '#7C3AED',
    gradient: 'from-violet-600 to-violet-500',
    tenants: 24,
    mrr: 108000,
    features: [
      'Unlimited users',
      'Unlimited branches',
      'Unlimited WhatsApp messages',
      'Multi-branch management',
      'Custom WhatsApp flows',
      'Dedicated account manager',
      'SLA: 99.9% uptime',
      'White-label option',
      'API access',
      'Phone + priority support',
    ],
    limits: { users: -1, branches: -1, waMessages: -1, patients: -1 },
  },
];

function EditModal({ plan, onClose }: { plan: typeof plans[0]; onClose: () => void }) {
  const [price, setPrice] = useState(plan.price);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Edit {plan.name} Plan</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Monthly Price (₹)</label>
            <input type="number" className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] outline-none transition-all"
              value={price} onChange={(e) => setPrice(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">WA Messages Limit/mo (-1 = unlimited)</label>
            <input type="number" defaultValue={plan.limits.waMessages}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] outline-none transition-all" />
          </div>
        </div>
        <div className="flex items-center gap-3 justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-white bg-[#0D7C66] rounded-xl hover:bg-[#0A5E4F] transition-colors">Save Changes</button>
        </div>
      </div>
    </div>
  );
}

export default function PlansPage() {
  const [editing, setEditing] = useState<typeof plans[0] | null>(null);
  const [liveCounts, setLiveCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all(
      plans.map((p: any) =>
        getAllTenants({ page: 1, limit: 1, plan: p.key as any, status: 'ALL' })
          .then(r => ({ key: p.key, count: r.meta.total }))
          .catch(() => ({ key: p.key, count: 0 }))
      )
    ).then(results => {
      const counts: Record<string, number> = {};
      results.forEach((r: any) => { counts[r.key] = r.count; });
      setLiveCounts(counts);
    }).finally(() => setLoading(false));
  }, []);

  const getPlanTenants = (key: string) => liveCounts[key] ?? plans.find((p: any) => p.key === key)?.tenants ?? 0;
  const getPlanMrr = (key: string) => {
    const plan = plans.find((p: any) => p.key === key);
    if (!plan) return 0;
    return getPlanTenants(key) * plan.price;
  };
  const totalMrr = plans.reduce((sum: number, p: any) => sum + getPlanMrr(p.key), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Plans & Billing</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage subscription plans and pricing</p>
        </div>
        {loading && <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />}
      </div>

      {/* MRR summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-[#0D7C66]" />
            <span className="text-xs text-slate-500 font-medium">Total Platform MRR</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">₹{(totalMrr / 1000).toFixed(1)}K</p>
        </div>
        {plans.map((p) => (
          <div key={p.key} className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
              <span className="text-xs text-slate-500 font-medium">{p.name} MRR</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">₹{(getPlanMrr(p.key) / 1000).toFixed(1)}K</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {loading ? '…' : getPlanTenants(p.key)} tenants
            </p>
          </div>
        ))}
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-3 gap-5">
        {plans.map((plan) => (
          <div key={plan.key} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className={`bg-gradient-to-br ${plan.gradient} p-5`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">{plan.key}</p>
                  <h3 className="text-white text-xl font-bold mt-0.5">{plan.name}</h3>
                </div>
                <button onClick={() => setEditing(plan)}
                  className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                  <Edit3 className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-bold text-white">₹{plan.price.toLocaleString('en-IN')}</span>
                <span className="text-white/70 text-sm ml-1">/month</span>
              </div>
            </div>

            {/* Stats */}
            <div className="px-5 py-4 border-b border-slate-100">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center bg-slate-50 rounded-xl py-2.5">
                  <p className="text-lg font-bold text-slate-900">{loading ? '…' : getPlanTenants(plan.key)}</p>
                  <p className="text-xs text-slate-400">Tenants</p>
                </div>
                <div className="text-center bg-slate-50 rounded-xl py-2.5">
                  <p className="text-lg font-bold text-slate-900">₹{(getPlanMrr(plan.key) / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-slate-400">MRR</p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="px-5 py-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Includes</p>
              <ul className="space-y-2">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Limits */}
            <div className="px-5 pb-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Limits</p>
              <div className="space-y-1.5">
                {[
                  { label: 'Users', value: plan.limits.users },
                  { label: 'Branches', value: plan.limits.branches },
                  { label: 'WA Messages/mo', value: plan.limits.waMessages },
                  { label: 'Patients', value: plan.limits.patients },
                ].map((l) => (
                  <div key={l.label} className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">{l.label}</span>
                    <span className={`font-semibold ${l.value === -1 ? 'text-[#0D7C66]' : 'text-slate-900'}`}>
                      {l.value === -1 ? 'Unlimited' : l.value.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && <EditModal plan={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
