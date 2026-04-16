'use client';

import { useState } from 'react';
import { Code, Copy, ChevronDown, ChevronUp, Globe, Key, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.hospibot.ai/api/v1';

const API_SECTIONS = [
  {
    name: 'Authentication',
    color: '#0D7C66',
    endpoints: [
      { method:'POST', path:'/auth/register',   desc:'Register new tenant + admin user',          auth: false },
      { method:'POST', path:'/auth/login',       desc:'Login and receive JWT tokens',              auth: false },
      { method:'POST', path:'/auth/refresh',     desc:'Refresh access token using refresh token',  auth: false },
      { method:'GET',  path:'/auth/profile',     desc:'Get current user profile',                  auth: true  },
    ],
  },
  {
    name: 'Patients',
    color: '#3B82F6',
    endpoints: [
      { method:'GET',   path:'/patients',              desc:'List patients with search & pagination',    auth: true },
      { method:'POST',  path:'/patients',              desc:'Create new patient record',                 auth: true },
      { method:'GET',   path:'/patients/:id',          desc:'Get full patient record with relations',    auth: true },
      { method:'PATCH', path:'/patients/:id',          desc:'Update patient details',                    auth: true },
      { method:'GET',   path:'/patients/stats',        desc:'Patient statistics dashboard',              auth: true },
      { method:'GET',   path:'/patients/lookup/phone/:phone', desc:'Cross-provider patient lookup by phone', auth: true },
      { method:'POST',  path:'/patients/:id/tags',     desc:'Add tags to patient',                       auth: true },
    ],
  },
  {
    name: 'Appointments',
    color: '#8B5CF6',
    endpoints: [
      { method:'GET',   path:'/appointments',            desc:'List appointments with filters',            auth: true },
      { method:'POST',  path:'/appointments',            desc:'Create appointment (any type)',              auth: true },
      { method:'GET',   path:'/appointments/:id',        desc:'Get appointment details',                   auth: true },
      { method:'PUT',   path:'/appointments/:id/status', desc:'Update appointment status',                 auth: true },
      { method:'POST',  path:'/appointments/:id/reschedule', desc:'Reschedule appointment',               auth: true },
      { method:'GET',   path:'/appointments/queue',      desc:'Get current queue for a doctor/branch',     auth: true },
    ],
  },
  {
    name: 'WhatsApp',
    color: '#25D366',
    endpoints: [
      { method:'POST', path:'/whatsapp/webhook',         desc:'Meta webhook receiver (verify + messages)', auth: false },
      { method:'POST', path:'/whatsapp/send',            desc:'Send WhatsApp message to a number',         auth: true },
      { method:'GET',  path:'/whatsapp/conversations',   desc:'List all conversations',                    auth: true },
      { method:'GET',  path:'/whatsapp/conversations/:id/messages', desc:'Get messages in conversation',   auth: true },
      { method:'GET',  path:'/whatsapp/templates',       desc:'List approved WhatsApp templates',          auth: true },
      { method:'POST', path:'/whatsapp/broadcast',       desc:'Broadcast template to patient segment',     auth: true },
    ],
  },
  {
    name: 'Billing',
    color: '#F59E0B',
    endpoints: [
      { method:'GET',   path:'/billing/invoices',        desc:'List invoices with status filters',         auth: true },
      { method:'POST',  path:'/billing/invoices',        desc:'Create invoice',                            auth: true },
      { method:'POST',  path:'/billing/invoices/:id/payments', desc:'Record payment against invoice',     auth: true },
      { method:'POST',  path:'/billing/invoices/:id/payment-link', desc:'Generate Razorpay Payment Link — sends UPI/card link via WhatsApp', auth: true },
      { method:'POST',  path:'/billing/invoices/:id/checkout-order', desc:'Create Razorpay checkout order for embedded payment', auth: true },
      { method:'POST',  path:'/billing/verify-payment',  desc:'Verify Razorpay payment signature after checkout', auth: true },
      { method:'POST',  path:'/billing/webhook/razorpay',desc:'Razorpay webhook (payment events, no auth)',  auth: false },
      { method:'POST',  path:'/billing/invoices/:id/tpa/pre-auth', desc:'Submit TPA pre-authorization',   auth: true },
      { method:'POST',  path:'/billing/invoices/:id/tpa/claim',    desc:'Submit insurance claim',         auth: true },
      { method:'GET',   path:'/billing/tpa/claims',      desc:'List all TPA claims',                      auth: true },
      { method:'GET',   path:'/billing/export/tally',    desc:'Export Tally XML for accounting',          auth: true },
    ],
  },
  {
    name: 'Subscriptions (SaaS)',
    color: '#10B981',
    endpoints: [
      { method:'GET',  path:'/subscriptions/plans',           desc:'List all available plans with pricing (public)', auth: false },
      { method:'GET',  path:'/subscriptions/current',         desc:'Get current tenant subscription status',         auth: true  },
      { method:'POST', path:'/subscriptions/payment-link',    desc:'Generate Razorpay Payment Link for plan upgrade', auth: true  },
      { method:'POST', path:'/subscriptions/subscribe',       desc:'Create Razorpay Subscription (recurring monthly)', auth: true },
      { method:'POST', path:'/subscriptions/cancel',          desc:'Cancel subscription at period end',              auth: true  },
      { method:'POST', path:'/subscriptions/webhook/razorpay',desc:'Razorpay webhook (subscription events, no auth)', auth: false },
    ],
  },
  {
    name: 'Lab',
    color: '#EF4444',
    endpoints: [
      { method:'GET',  path:'/lab/catalog',           desc:'List test catalog',                           auth: true },
      { method:'POST', path:'/lab/orders',             desc:'Create lab order',                           auth: true },
      { method:'GET',  path:'/lab/orders',             desc:'List lab orders with status filter',         auth: true },
      { method:'POST', path:'/lab/orders/:id/report',  desc:'Upload/attach report to order',              auth: true },
      { method:'POST', path:'/lab/orders/:id/deliver', desc:'Mark report delivered via WhatsApp',         auth: true },
    ],
  },
  {
    name: 'Pharmacy',
    color: '#166834',
    endpoints: [
      { method:'GET',  path:'/pharmacy/products',     desc:'List pharmacy products/medicines',            auth: true },
      { method:'GET',  path:'/pharmacy/dispensing',   desc:'List dispensing orders',                      auth: true },
      { method:'POST', path:'/pharmacy/dispensing',   desc:'Create dispensing order',                     auth: true },
      { method:'POST', path:'/pharmacy/dispensing/:id/dispense', desc:'Dispense medicines + send receipt', auth: true },
      { method:'GET',  path:'/pharmacy/alerts',       desc:'Low stock and expiry alerts',                 auth: true },
    ],
  },
  {
    name: 'Beds',
    color: '#1E40AF',
    endpoints: [
      { method:'GET',  path:'/beds',              desc:'List beds with filters (ward, status, category)', auth: true },
      { method:'POST', path:'/beds',              desc:'Create bed',                                      auth: true },
      { method:'POST', path:'/beds/bulk',         desc:'Bulk create beds for a ward',                    auth: true },
      { method:'GET',  path:'/beds/dashboard',    desc:'Bed occupancy stats and KPIs',                   auth: true },
      { method:'GET',  path:'/beds/wards',        desc:'Ward summary with availability',                 auth: true },
      { method:'POST', path:'/beds/:id/admit',    desc:'Admit patient to bed',                           auth: true },
      { method:'POST', path:'/beds/:id/discharge',desc:'Discharge patient + queue housekeeping',         auth: true },
    ],
  },
  {
    name: 'CRM',
    color: '#BE185D',
    endpoints: [
      { method:'GET',  path:'/crm/leads',            desc:'List leads with stage filter',                 auth: true },
      { method:'POST', path:'/crm/leads',             desc:'Create lead',                                 auth: true },
      { method:'POST', path:'/crm/leads/:id/convert', desc:'Convert lead to patient',                    auth: true },
      { method:'GET',  path:'/crm/campaigns',         desc:'List broadcast campaigns',                   auth: true },
      { method:'POST', path:'/crm/campaigns',         desc:'Create and send broadcast campaign',         auth: true },
    ],
  },
  {
    name: 'Automation',
    color: '#7C3AED',
    endpoints: [
      { method:'GET',  path:'/automation/rules',                  desc:'List automation rules',           auth: true },
      { method:'POST', path:'/automation/rules',                  desc:'Create automation rule',          auth: true },
      { method:'POST', path:'/automation/rules/:id/toggle',       desc:'Enable/disable rule',             auth: true },
      { method:'GET',  path:'/automation/protocols',              desc:'List pre-built protocol templates', auth: true },
      { method:'POST', path:'/automation/protocols/:id/install',  desc:'Install a protocol template',     auth: true },
    ],
  },
  {
    name: 'Analytics',
    color: '#0369A1',
    endpoints: [
      { method:'GET', path:'/analytics/dashboard',          desc:'Main KPI dashboard',                    auth: true },
      { method:'GET', path:'/analytics/revenue/trend',      desc:'Revenue trend over time',               auth: true },
      { method:'GET', path:'/analytics/doctors/top',        desc:'Top performing doctors',                auth: true },
      { method:'GET', path:'/analytics/patients/demographics', desc:'Patient age/gender demographics',    auth: true },
      { method:'GET', path:'/analytics/whatsapp',           desc:'WhatsApp messaging analytics',          auth: true },
      { method:'GET', path:'/analytics/notifications',      desc:'Actionable alerts for notifications bell', auth: true },
    ],
  },
  {
    name: 'FHIR R4',
    color: '#065F46',
    endpoints: [
      { method:'GET', path:'/fhir/r4/metadata',               desc:'FHIR Capability Statement',           auth: false },
      { method:'GET', path:'/fhir/r4/Patient',                desc:'Search FHIR Patient resources',       auth: true },
      { method:'GET', path:'/fhir/r4/Patient/:id',            desc:'Get FHIR Patient resource',           auth: true },
      { method:'GET', path:'/fhir/r4/Observation',            desc:'Search vital signs observations',      auth: true },
      { method:'GET', path:'/fhir/r4/MedicationRequest',      desc:'Search prescriptions as FHIR',        auth: true },
      { method:'GET', path:'/fhir/r4/DiagnosticReport',       desc:'Search lab reports as FHIR',          auth: true },
      { method:'GET', path:'/fhir/r4/Patient/:id/$everything', desc:'Full patient bundle (everything)',   auth: true },
    ],
  },
  {
    name: 'Universal Health Vault',
    color: '#7C2D12',
    endpoints: [
      { method:'GET',  path:'/vault/lookup?phone=:phone',     desc:'Cross-provider patient lookup',        auth: true },
      { method:'POST', path:'/vault/request-access',          desc:'Request access to patient records',    auth: true },
      { method:'POST', path:'/vault/consent-response',        desc:'Patient approves/denies consent',      auth: true },
      { method:'GET',  path:'/vault/records/:uhrId',          desc:'Get patient health records',           auth: true },
      { method:'POST', path:'/vault/emergency-access',        desc:'Emergency override access',            auth: true },
      { method:'POST', path:'/vault/dependents',              desc:'Add dependent to patient account',     auth: true },
    ],
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET:    'bg-blue-100 text-blue-700',
  POST:   'bg-emerald-100 text-emerald-700',
  PATCH:  'bg-amber-100 text-amber-700',
  PUT:    'bg-orange-100 text-orange-700',
  DELETE: 'bg-red-100 text-red-700',
};

export default function APIDocsPage() {
  const [expanded, setExpanded] = useState<string[]>(['Authentication']);
  const [copied,   setCopied]   = useState('');

  const toggle = (name: string) => {
    setExpanded(e => e.includes(name) ? e.filter((n: any) =>n!==name) : [...e, name]);
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(''), 1500);
      toast.success('Copied!');
    });
  };

  const totalEndpoints = API_SECTIONS.reduce((s: any, sect: any) =>s+sect.endpoints.length, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Code className="w-6 h-6 text-[#0D7C66]" /> API Documentation
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">RESTful API — {totalEndpoints} endpoints across {API_SECTIONS.length} modules</p>
        </div>
      </div>

      {/* Base URL */}
      <div className="bg-[#1E293B] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Base URL</p>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-900/50 text-emerald-400">LIVE</span>
            <span className="text-xs text-slate-400">OpenAPI 3.0 · JSON</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <code className="text-emerald-400 text-sm font-mono flex-1">{API_BASE}</code>
          <button onClick={() => copyText(API_BASE, 'base')}
            className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
            {copied === 'base' ? <CheckCircle2 className="w-4 h-4 text-emerald-400"/> : <Copy className="w-4 h-4"/>}
          </button>
        </div>
      </div>

      {/* Auth header */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Key className="w-4 h-4 text-amber-500"/> Authentication</h3>
        <div className="bg-slate-900 rounded-xl p-4">
          <code className="text-sm font-mono text-emerald-400">
            Authorization: Bearer {'<access_token>'}
          </code>
        </div>
        <p className="text-xs text-slate-400 mt-2">All protected endpoints require the <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">Authorization</code> header with a valid JWT. Use <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">POST /auth/login</code> to get tokens. Tokens expire in 15 minutes; use <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">POST /auth/refresh</code> to get a new one.</p>
      </div>

      {/* Standard response format */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Globe className="w-4 h-4 text-[#0D7C66]"/> Standard Response Format</h3>
        <div className="bg-slate-900 rounded-xl p-4 text-sm font-mono space-y-1">
          <p className="text-slate-400">{'{'}</p>
          <p className="ml-4 text-emerald-400">"success": <span className="text-amber-400">true</span>,</p>
          <p className="ml-4 text-emerald-400">"data": <span className="text-slate-300">{'{ ... }'}</span>,</p>
          <p className="ml-4 text-emerald-400">"meta": <span className="text-slate-300">{'{ "page": 1, "total": 100, "totalPages": 5 }'}</span>,</p>
          <p className="ml-4 text-emerald-400">"errors": <span className="text-slate-300">[]</span></p>
          <p className="text-slate-400">{'}'}</p>
        </div>
      </div>

      {/* Endpoints by section */}
      <div className="space-y-3">
        {API_SECTIONS.map((section: any) => {
          const isOpen = expanded.includes(section.name);
          return (
            <div key={section.name} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <button onClick={() => toggle(section.name)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{background:section.color}}/>
                  <span className="font-bold text-slate-900">{section.name}</span>
                  <span className="text-xs font-medium text-slate-400">{section.endpoints.length} endpoints</span>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400"/> : <ChevronDown className="w-4 h-4 text-slate-400"/>}
              </button>
              {isOpen && (
                <div className="border-t border-slate-100">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50/70">
                        <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase w-20">Method</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Path</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Description</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase w-24">Auth</th>
                        <th className="px-4 py-2.5 w-10"/>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {section.endpoints.map((ep, i) => {
                        const fullPath = `${API_BASE}${ep.path}`;
                        const copyId  = `${section.name}-${i}`;
                        return (
                          <tr key={i} className="hover:bg-slate-50/60 transition-colors group">
                            <td className="px-5 py-3">
                              <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg ${METHOD_COLORS[ep.method]||'bg-slate-100 text-slate-600'}`}>
                                {ep.method}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <code className="text-sm font-mono text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">{ep.path}</code>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">{ep.desc}</td>
                            <td className="px-4 py-3">
                              {ep.auth ? (
                                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">JWT</span>
                              ) : (
                                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Public</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <button onClick={() => copyText(fullPath, copyId)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-[#0D7C66] hover:bg-[#E8F5F0] rounded-lg transition-all">
                                {copied===copyId ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500"/> : <Copy className="w-3.5 h-3.5"/>}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Rate limiting */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="font-bold text-slate-900 mb-3">Rate Limiting & Limits</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          {[
            { label:'Default Rate',     value:'100 req/min per tenant' },
            { label:'WhatsApp Webhook', value:'Unlimited (inbound only)' },
            { label:'Bulk Operations',  value:'50 items per request' },
            { label:'File Uploads',     value:'Max 10MB per file' },
            { label:'Search Results',   value:'Max 1000 per page' },
            { label:'Token Expiry',     value:'Access: 15m · Refresh: 7d' },
          ].map((r: any) =>(
            <div key={r.label} className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-400 font-medium">{r.label}</p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">{r.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
