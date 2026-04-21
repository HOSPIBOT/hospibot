'use client';
import { useState } from 'react';

const API_GROUPS = [
  { group: 'Authentication', endpoints: [
    { method: 'POST', path: '/auth/register', desc: 'Register new tenant + admin user', auth: false },
    { method: 'POST', path: '/auth/login', desc: 'Login with email/password', auth: false },
    { method: 'POST', path: '/auth/refresh', desc: 'Refresh JWT access token', auth: true },
  ]},
  { group: 'Diagnostic Core', endpoints: [
    { method: 'GET', path: '/diagnostic/dashboard', desc: 'Dashboard KPIs for tenant', auth: true },
    { method: 'GET', path: '/diagnostic/patients', desc: 'List patients (paginated)', auth: true },
    { method: 'POST', path: '/diagnostic/patients', desc: 'Create new patient', auth: true },
    { method: 'GET', path: '/diagnostic/patients/:id', desc: 'Get patient details', auth: true },
    { method: 'GET', path: '/diagnostic/lab-orders', desc: 'List lab orders', auth: true },
    { method: 'POST', path: '/diagnostic/lab-orders', desc: 'Create lab order', auth: true },
    { method: 'PATCH', path: '/diagnostic/lab-orders/:id', desc: 'Update lab order', auth: true },
    { method: 'GET', path: '/diagnostic/test-catalog', desc: 'Get test catalog', auth: true },
    { method: 'GET', path: '/diagnostic/results', desc: 'List results', auth: true },
    { method: 'PATCH', path: '/diagnostic/results/:id/approve', desc: 'Approve result (ComplianceGuard)', auth: true },
    { method: 'GET', path: '/diagnostic/analytics', desc: 'Analytics data', auth: true },
  ]},
  { group: 'Billing & Payments', endpoints: [
    { method: 'GET', path: '/diagnostic/billing/invoices', desc: 'List invoices', auth: true },
    { method: 'POST', path: '/diagnostic/billing/invoices', desc: 'Create invoice', auth: true },
    { method: 'POST', path: '/diagnostic/billing/recharge', desc: 'Create wallet recharge order', auth: true },
    { method: 'POST', path: '/diagnostic/billing/verify-payment', desc: 'Verify Razorpay payment', auth: true },
    { method: 'GET', path: '/diagnostic/billing/wallet', desc: 'Get wallet balance', auth: true },
    { method: 'GET', path: '/diagnostic/letterhead', desc: 'Get letterhead config', auth: true },
    { method: 'PATCH', path: '/diagnostic/letterhead', desc: 'Update letterhead', auth: true },
  ]},
  { group: 'WhatsApp & Communication', endpoints: [
    { method: 'POST', path: '/whatsapp/send', desc: 'Send WhatsApp message', auth: true },
    { method: 'POST', path: '/whatsapp/webhook', desc: 'Receive WhatsApp webhook', auth: false },
    { method: 'GET', path: '/whatsapp/conversations', desc: 'List conversations', auth: true },
    { method: 'GET', path: '/whatsapp/templates', desc: 'List message templates', auth: true },
  ]},
  { group: 'Portal (Public)', endpoints: [
    { method: 'GET', path: '/portal/families', desc: 'List portal families', auth: false },
    { method: 'GET', path: '/portal/families/:slug/groups', desc: 'Get diagnostic groups', auth: false },
    { method: 'GET', path: '/portal/families/:slug/groups/:group/subtypes', desc: 'Get subtypes', auth: false },
    { method: 'GET', path: '/portal/tier-configs', desc: 'Get tier pricing', auth: false },
    { method: 'GET', path: '/portal/feature-gates', desc: 'Get feature gates', auth: false },
  ]},
  { group: 'Super Admin', endpoints: [
    { method: 'GET', path: '/super-admin/tenants', desc: 'List all tenants', auth: true },
    { method: 'GET', path: '/super-admin/tenants/:id', desc: 'Get tenant detail', auth: true },
    { method: 'GET', path: '/super-admin/wallets', desc: 'Wallet overview', auth: true },
    { method: 'GET', path: '/super-admin/subscription-tracker', desc: 'Subscription tracker', auth: true },
    { method: 'GET', path: '/super-admin/gateway-charges', desc: 'Gateway config', auth: true },
    { method: 'PATCH', path: '/super-admin/gateway-charges', desc: 'Update gateway config', auth: true },
    { method: 'POST', path: '/super-admin/auto-disable-overdue', desc: 'Auto-disable overdue tenants', auth: true },
    { method: 'GET', path: '/super-admin/communications', desc: 'Communication providers', auth: true },
  ]},
  { group: 'Health', endpoints: [
    { method: 'GET', path: '/health', desc: 'Health check + DB status', auth: false },
  ]},
];

const methodColors: Record<string, string> = {
  GET: 'bg-emerald-100 text-emerald-700',
  POST: 'bg-blue-100 text-blue-700',
  PATCH: 'bg-amber-100 text-amber-700',
  DELETE: 'bg-red-100 text-red-700',
  PUT: 'bg-purple-100 text-purple-700',
};

export default function APIExplorerPage() {
  const [search, setSearch] = useState('');
  const total = API_GROUPS.reduce((s, g) => s + g.endpoints.length, 0);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">API Explorer</h1>
          <p className="text-sm text-slate-500 mt-1">{total} endpoints across {API_GROUPS.length} groups — Swagger docs at /api/docs</p>
        </div>
        <a href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/api/docs`} target="_blank" rel="noopener"
          className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700">
          Open Swagger UI →
        </a>
      </div>

      <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search endpoints..."
        className="w-full px-4 py-2.5 rounded-lg border text-sm mb-6" />

      {API_GROUPS.map(g => {
        const filtered = search ? g.endpoints.filter(e => 
          e.path.includes(search) || e.desc.toLowerCase().includes(search.toLowerCase())
        ) : g.endpoints;
        if (filtered.length === 0) return null;
        return (
          <div key={g.group} className="mb-6">
            <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3">{g.group}</h2>
            <div className="bg-white rounded-xl border overflow-hidden">
              {filtered.map((e, i) => (
                <div key={i} className={`flex items-center gap-3 px-4 py-2.5 text-sm ${i > 0 ? 'border-t' : ''}`}>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${methodColors[e.method]}`}>{e.method}</span>
                  <code className="text-slate-800 font-mono text-xs flex-1">{e.path}</code>
                  <span className="text-slate-500 text-xs">{e.desc}</span>
                  {e.auth ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">AUTH</span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-600">PUBLIC</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
