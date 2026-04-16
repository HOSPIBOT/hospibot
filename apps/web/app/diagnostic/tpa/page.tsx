'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatINR, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Shield, Plus, X, Loader2, CheckCircle2, AlertTriangle,
  FileText, RefreshCw, Building2, IndianRupee,
} from 'lucide-react';

const NAVY = '#1E3A5F';
const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/10 outline-none transition-all placeholder:text-slate-400';
const labelCls = 'block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide';

const INDIA_TPAS = [
  'Medi Assist',  'Star Health',     'United Health Alliance', 'ICICI Lombard',
  'HDFC ERGO',    'Bajaj Allianz',   'New India Assurance',    'National Insurance',
  'Oriental Insurance', 'United India Insurance',
  'CGHS',         'ESI',             'PMJAY (Ayushman Bharat)', 'ECHS (Ex-servicemen)',
];

interface TPAClient {
  id: string;
  name: string;
  tpaCompany: string;
  authCode?: string;
  policyNumber?: string;
  cardNumber?: string;
  rateCardId?: string;
  creditDays: number;
  contactName?: string;
  contactPhone?: string;
  isActive: boolean;
  pendingAmount: number;
}

function AddTPAModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: '', tpaCompany: INDIA_TPAS[0], authCode: '',
    creditDays: '30', contactName: '', contactPhone: '',
  });
  const [saving, setSaving] = useState(false);
  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.name) { toast.error('Client name required'); return; }
    setSaving(true);
    try {
      await api.post('/diagnostic/crm/corporates', {
        companyName: form.name,
        gstin: '',
        hrContactName: form.contactName,
        hrContactMobile: form.contactPhone || '0000000000',
        creditDays: +form.creditDays,
        creditLimit: 500000 * 100,
        billingAddress: `TPA: ${form.tpaCompany} | Auth: ${form.authCode}`,
      });
      toast.success(`${form.name} added`);
      onSaved(); onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Add TPA / Insurance Client</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className={labelCls}>TPA Company</label>
            <select className={inputCls} value={form.tpaCompany} onChange={setF('tpaCompany')}>
              {INDIA_TPAS.map(t => <option key={t} value={t}>{t}</option>)}
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Client / Employer Name *</label>
            <input className={inputCls} placeholder="e.g. Infosys via Medi Assist" value={form.name} onChange={setF('name')} />
          </div>
          <div>
            <label className={labelCls}>Authorisation Code / Provider ID</label>
            <input className={inputCls} placeholder="TPA provider code" value={form.authCode} onChange={setF('authCode')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Contact Name</label>
              <input className={inputCls} placeholder="Claims manager" value={form.contactName} onChange={setF('contactName')} />
            </div>
            <div>
              <label className={labelCls}>Contact Phone</label>
              <input className={inputCls} placeholder="9876543210" value={form.contactPhone} onChange={setF('contactPhone')} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Credit Days</label>
            <select className={inputCls} value={form.creditDays} onChange={setF('creditDays')}>
              {[15, 30, 45, 60, 90].map(d => <option key={d} value={d}>{d} days</option>)}
            </select>
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl text-sm">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-[2] flex items-center justify-center gap-2 py-3 text-white font-bold rounded-xl text-sm hover:opacity-90 disabled:opacity-50"
            style={{ background: NAVY }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            Add TPA Client
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TPAPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/diagnostic/crm/corporates');
      // TPA clients are stored as corporate clients with TPA in billing address
      setClients((res.data ?? []).filter((c: any) => c.billingAddress?.startsWith('TPA:')));
    } finally { setLoading(false); }
  }, [refreshKey]);

  useEffect(() => { load(); }, [load]);

  const totalPending = clients.reduce((s, c) => s + (c.pendingAmount ?? 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">TPA & Insurance Billing</h1>
          <p className="text-sm text-slate-500">Manage insurance panel clients — CGHS, ESI, PMJAY, private TPA</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setRefreshKey(k => k + 1)}
            className="p-2.5 text-slate-500 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-2 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
            style={{ background: NAVY }}>
            <Plus className="w-4 h-4" /> Add TPA Client
          </button>
        </div>
      </div>

      {/* Empanelment guide */}
      {clients.length === 0 && !loading && (
        <div className="bg-gradient-to-r from-[#1E3A5F]/5 to-blue-50 border border-[#1E3A5F]/10 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-[#1E3A5F]" />
            <p className="font-bold text-slate-900">Insurance Empanelment</p>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Add your TPA and insurance empanelment clients to manage credit billing, generate
            batch invoices, and track outstanding dues from insurance companies.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { name: 'CGHS', type: 'Government', color: '#EF4444' },
              { name: 'PMJAY', type: 'Government', color: '#EF4444' },
              { name: 'ESI', type: 'Government', color: '#EF4444' },
              { name: 'Medi Assist', type: 'Private TPA', color: '#3B82F6' },
              { name: 'Star Health', type: 'Private TPA', color: '#3B82F6' },
              { name: 'HDFC ERGO', type: 'Private TPA', color: '#3B82F6' },
            ].map(p => (
              <div key={p.name} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-slate-100">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                <div>
                  <p className="text-xs font-bold text-slate-900">{p.name}</p>
                  <p className="text-[10px] text-slate-400">{p.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      {clients.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1E3A5F]/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[#1E3A5F]" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{clients.length}</p>
              <p className="text-xs text-slate-500">TPA Clients</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{formatINR(totalPending * 100)}</p>
              <p className="text-xs text-slate-500">Total Pending</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{clients.filter(c => c.isActive).length}</p>
              <p className="text-xs text-slate-500">Active</p>
            </div>
          </div>
        </div>
      )}

      {/* Client cards */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-40" />
          ))}
        </div>
      ) : clients.length > 0 ? (
        <div className="grid grid-cols-3 gap-4">
          {clients.map(c => {
            const tpaInfo = (c.billingAddress ?? '').split('|');
            const tpaCompany = tpaInfo[0]?.replace('TPA:', '').trim();
            const authCode = tpaInfo[1]?.replace('Auth:', '').trim();
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-slate-900">{c.companyName}</p>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                      {tpaCompany}
                    </span>
                  </div>
                  <Shield className="w-4 h-4 text-slate-400 flex-shrink-0" />
                </div>
                <div className="space-y-1.5 text-xs text-slate-500">
                  {authCode && <p>🔑 Provider ID: {authCode}</p>}
                  {c.hrContactName && <p>👤 {c.hrContactName}</p>}
                  {c.hrContactMobile && <p>📱 {c.hrContactMobile}</p>}
                  <p>💳 Credit: {c.creditDays} days</p>
                  {c.pendingAmount > 0 && (
                    <p className="text-amber-700 font-semibold">⏳ Pending: {formatINR(c.pendingAmount * 100)}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {adding && <AddTPAModal onClose={() => setAdding(false)} onSaved={() => setRefreshKey(k => k + 1)} />}
    </div>
  );
}
