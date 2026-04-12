'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Building2, Users, MessageSquare, Calendar, CreditCard,
  Globe, Phone, Mail, MapPin, CheckCircle2, XCircle, AlertTriangle,
  Edit3, Ban, RefreshCw, Trash2, Wifi, Activity, TrendingUp
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock tenant data (replace with API call)
const TENANT = {
  id: '3',
  name: 'Dr. Kiran Heart Centre',
  slug: 'kiran-heart',
  type: 'HOSPITAL',
  status: 'ACTIVE',
  plan: 'ENTERPRISE',
  email: 'admin@kiranheartcentre.com',
  phone: '+91 98765 43210',
  website: 'www.kiranheartcentre.com',
  address: '12, Jubilee Hills',
  city: 'Hyderabad',
  state: 'Telangana',
  country: 'India',
  pincode: '500033',
  waPhoneNumberId: '1234567890',
  waLinked: true,
  logoUrl: null,
  createdAt: '2023-11-02',
  trialEndsAt: null,
  users: 68,
  branches: 3,
  patients: 34200,
  appointments: 1842,
  mrr: 18000,
  outstandingInvoices: 2,
  planRenewsAt: '2025-05-02',
};

const usageData = [
  { month: 'Oct', appointments: 1420, messages: 8200 },
  { month: 'Nov', appointments: 1580, messages: 9400 },
  { month: 'Dec', appointments: 1320, messages: 7800 },
  { month: 'Jan', appointments: 1750, messages: 10200 },
  { month: 'Feb', appointments: 1680, messages: 9600 },
  { month: 'Mar', appointments: 1842, messages: 11400 },
];

const BRANCHES = [
  { id: 'b1', name: 'Dr. Kiran Heart Centre - Main', city: 'Hyderabad', users: 42, status: true },
  { id: 'b2', name: 'Kiran Diagnostics Wing', city: 'Hyderabad', users: 18, status: true },
  { id: 'b3', name: 'Kiran Jubilee Hills OPD', city: 'Hyderabad', users: 8, status: true },
];

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-slate-50 last:border-0">
      <span className="text-sm text-slate-500 w-40 flex-shrink-0">{label}</span>
      <span className="text-sm text-slate-900 font-medium text-right">{value}</span>
    </div>
  );
}

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'branches' | 'billing' | 'whatsapp'>('overview');
  const [showConfirm, setShowConfirm] = useState<null | 'suspend' | 'delete'>(null);

  const t = TENANT;

  const statusColor: Record<string, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-700',
    TRIAL: 'bg-amber-100 text-amber-700',
    SUSPENDED: 'bg-red-100 text-red-700',
  };
  const planColor: Record<string, string> = {
    STARTER: 'bg-slate-100 text-slate-700',
    GROWTH: 'bg-blue-100 text-blue-700',
    ENTERPRISE: 'bg-violet-100 text-violet-700',
  };

  return (
    <div className="space-y-5">
      {/* Back */}
      <Link href="/super-admin/tenants" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#0D7C66] transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Tenants
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#E8F5F0] text-[#0D7C66] flex items-center justify-center text-xl font-bold">
              {t.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{t.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-500">{t.slug}</span>
                <span className="text-slate-300">·</span>
                <span className="text-xs text-slate-500">{t.type.replace(/_/g, ' ')}</span>
                <span className="text-slate-300">·</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${statusColor[t.status]}`}>{t.status}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${planColor[t.plan]}`}>{t.plan}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-xl px-3 py-2 hover:bg-slate-50 transition-colors">
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
            <button
              onClick={() => setShowConfirm('suspend')}
              className="flex items-center gap-1.5 text-xs font-medium text-amber-700 border border-amber-200 bg-amber-50 rounded-xl px-3 py-2 hover:bg-amber-100 transition-colors">
              <Ban className="w-3.5 h-3.5" /> Suspend
            </button>
            <button
              onClick={() => setShowConfirm('delete')}
              className="flex items-center gap-1.5 text-xs font-medium text-red-700 border border-red-200 bg-red-50 rounded-xl px-3 py-2 hover:bg-red-100 transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-5 gap-4 mt-5 pt-5 border-t border-slate-100">
          {[
            { label: 'Users', value: t.users, icon: Users, color: '#0D7C66' },
            { label: 'Branches', value: t.branches, icon: Building2, color: '#3B82F6' },
            { label: 'Patients', value: t.patients.toLocaleString('en-IN'), icon: Activity, color: '#F59E0B' },
            { label: 'Appts (month)', value: t.appointments.toLocaleString('en-IN'), icon: Calendar, color: '#8B5CF6' },
            { label: 'MRR', value: `₹${(t.mrr / 1000).toFixed(0)}K`, icon: TrendingUp, color: '#10B981' },
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
        {(['overview', 'branches', 'billing', 'whatsapp'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`text-sm font-medium px-4 py-1.5 rounded-lg capitalize transition-all ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {tab === 'whatsapp' ? 'WhatsApp' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Contact info */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Contact & Location</h3>
            <InfoRow label="Email" value={t.email} />
            <InfoRow label="Phone" value={t.phone} />
            <InfoRow label="Website" value={t.website} />
            <InfoRow label="Address" value={t.address} />
            <InfoRow label="City" value={`${t.city}, ${t.state}`} />
            <InfoRow label="Pincode" value={t.pincode} />
            <InfoRow label="Country" value={t.country} />
          </div>

          {/* Account */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Account Details</h3>
            <InfoRow label="Tenant ID" value={t.id} />
            <InfoRow label="Slug" value={t.slug} />
            <InfoRow label="Plan" value={t.plan} />
            <InfoRow label="Status" value={t.status} />
            <InfoRow label="Member Since" value={new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} />
            <InfoRow label="Plan Renews" value={t.planRenewsAt ? new Date(t.planRenewsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'} />
            <InfoRow label="Outstanding Invoices" value={String(t.outstandingInvoices)} />
          </div>

          {/* Usage chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-semibold text-slate-900 mb-1">Usage Trends</h3>
            <p className="text-xs text-slate-400 mb-4">Appointments & WhatsApp messages</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={usageData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="appointments" name="Appointments" fill="#0D7C66" radius={[4, 4, 0, 0]} />
                <Bar dataKey="messages" name="WA Messages" fill="#25D366" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab: Branches */}
      {activeTab === 'branches' && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Branches ({BRANCHES.length})</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Branch</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">City</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Staff</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {BRANCHES.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-medium text-slate-900">{b.name}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{b.city}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-700">{b.users} staff</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${b.status ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {b.status ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Billing */}
      {activeTab === 'billing' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Billing Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Current Plan', value: t.plan, sub: '₹4,500/month' },
                { label: 'MRR Contribution', value: `₹${(t.mrr / 1000).toFixed(0)}K`, sub: 'Monthly' },
                { label: 'Outstanding', value: `${t.outstandingInvoices} invoices`, sub: 'Requires attention' },
              ].map((b) => (
                <div key={b.label} className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">{b.label}</p>
                  <p className="text-lg font-bold text-slate-900">{b.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{b.sub}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Change Plan</h3>
            <div className="flex items-center gap-3">
              {['STARTER', 'GROWTH', 'ENTERPRISE'].map((plan) => (
                <button key={plan}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${t.plan === plan ? 'bg-[#0D7C66] text-white border-[#0D7C66]' : 'border-slate-200 text-slate-600 hover:border-[#0D7C66] hover:text-[#0D7C66]'}`}>
                  {plan}
                </button>
              ))}
              <button className="ml-auto bg-[#0D7C66] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#0A5E4F] transition-colors">
                Apply Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: WhatsApp */}
      {activeTab === 'whatsapp' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.waLinked ? 'bg-[#25D366]/15' : 'bg-slate-100'}`}>
              <MessageSquare className={`w-5 h-5 ${t.waLinked ? 'text-[#25D366]' : 'text-slate-400'}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{t.waLinked ? 'WhatsApp Business API Connected' : 'WhatsApp Not Configured'}</p>
              <p className="text-xs text-slate-400">{t.waLinked ? `Phone Number ID: ${t.waPhoneNumberId}` : 'This tenant has not linked a WhatsApp Business account'}</p>
            </div>
            {t.waLinked && <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-semibold">● Live</span>}
          </div>
          {t.waLinked ? (
            <div className="space-y-2">
              <InfoRow label="Phone Number ID" value={t.waPhoneNumberId || '—'} />
              <InfoRow label="Business ID" value="wa_business_3kiran" />
              <InfoRow label="Access Token" value="••••••••••••••••••••••" />
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">WhatsApp not configured</p>
                <p className="text-xs text-amber-700 mt-0.5">This tenant cannot send or receive WhatsApp messages. Contact them to complete setup.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {showConfirm === 'suspend' ? 'Suspend Tenant?' : 'Delete Tenant?'}
            </h3>
            <p className="text-sm text-slate-600 mb-5">
              {showConfirm === 'suspend'
                ? `Suspending "${t.name}" will disable all user logins and WhatsApp services. This can be reversed.`
                : `Permanently deleting "${t.name}" will remove all data including patients, appointments, and invoices. This CANNOT be undone.`}
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button onClick={() => setShowConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium text-white rounded-xl transition-colors ${showConfirm === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'}`}>
                {showConfirm === 'suspend' ? 'Yes, Suspend' : 'Yes, Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
