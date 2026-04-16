'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/super-admin-api';
import toast from 'react-hot-toast';
import {
  Zap, MessageSquare, HardDrive, AlertTriangle, CheckCircle2,
  Search, RefreshCw, Plus, Loader2, X,
} from 'lucide-react';

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] focus:ring-2 focus:ring-[#0D7C66]/10 outline-none transition-all placeholder:text-slate-400';
const labelCls = 'block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide';

function CreditModal({ tenantId, tenantName, onClose, onCredited }: {
  tenantId: string; tenantName: string; onClose: () => void; onCredited: () => void;
}) {
  const [form, setForm] = useState({ walletType: 'WHATSAPP', amount: '', reason: 'Onboarding bonus' });
  const [saving, setSaving] = useState(false);
  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.amount || +form.amount <= 0) { toast.error('Enter a positive amount'); return; }
    setSaving(true);
    try {
      await api.post(`/super-admin/wallets/${tenantId}/credit`, {
        walletType: form.walletType,
        amount: +form.amount,
        reason: form.reason,
      });
      toast.success(`${form.amount} ${form.walletType === 'WHATSAPP' ? 'WA credits' : form.walletType === 'SMS' ? 'SMS' : 'GB'} credited to ${tenantName}`);
      onCredited(); onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Credit failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Credit Wallet</h2>
            <p className="text-sm text-slate-500">{tenantName}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className={labelCls}>Wallet Type</label>
            <select className={inputCls} value={form.walletType} onChange={setF('walletType')}>
              <option value="WHATSAPP">WhatsApp Credits</option>
              <option value="SMS">SMS Credits</option>
              <option value="STORAGE">Storage (GB)</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Amount</label>
            <input className={inputCls} type="number" placeholder={form.walletType === 'STORAGE' ? '10 GB' : '500 credits'}
              value={form.amount} onChange={setF('amount')} />
          </div>
          <div>
            <label className={labelCls}>Reason</label>
            <input className={inputCls} placeholder="Onboarding bonus, support credit, plan upgrade…"
              value={form.reason} onChange={setF('reason')} />
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl text-sm">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-[2] flex items-center justify-center gap-2 py-3 text-white font-bold rounded-xl text-sm hover:opacity-90 disabled:opacity-50"
            style={{ background: '#0D7C66' }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Credit Wallet
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SuperAdminWalletsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [crediting, setCrediting] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/super-admin/wallets');
      setStats(res.data);
    } catch { toast.error('Failed to load wallet stats'); }
    finally { setLoading(false); }
  }, [refreshKey]);

  useEffect(() => { load(); }, [load]);

  const wallets = stats?.tenants ?? [];
  const filtered = search
    ? wallets.filter((w: any) => w.tenantId?.includes(search) || w.tenant?.name?.toLowerCase().includes(search.toLowerCase()))
    : wallets;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Wallet Management</h1>
          <p className="text-sm text-slate-500">Manage diagnostic tenant wallet balances</p>
        </div>
        <button onClick={() => setRefreshKey(k => k + 1)}
          className="flex items-center gap-2 text-sm text-slate-600 bg-white border border-slate-200 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Tenants', value: wallets.length, icon: CheckCircle2, color: '#0D7C66' },
            { label: 'Low Balance (<100 credits)', value: stats.lowBalance ?? 0, icon: AlertTriangle, color: stats.lowBalance > 0 ? '#EF4444' : '#94A3B8' },
            { label: 'Total WA Credits (platform)', value: stats.totalWaCredits?.toFixed(0) ?? '—', icon: Zap, color: '#3B82F6' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${s.color}14` }}>
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Low balance alerts */}
      {(stats?.lowBalance ?? 0) > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-sm font-bold text-red-900 mb-2">
            ⚠ {stats.lowBalance} tenant{stats.lowBalance > 1 ? 's' : ''} with low WhatsApp credits
          </p>
          <p className="text-xs text-red-600">
            These tenants may fail to deliver reports via WhatsApp. Consider crediting their wallets or enabling auto-recharge.
          </p>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input className={`${inputCls} pl-10`} placeholder="Search by tenant name or ID…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Wallets table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-300 mx-auto" />
        </div>
      ) : wallets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
          <Zap className="w-10 h-10 mx-auto mb-3 text-slate-200" />
          <p className="font-semibold text-slate-500">No wallet records yet</p>
          <p className="text-sm mt-1">Wallets are created when diagnostic tenants use WhatsApp features</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                {['Tenant', 'WA Credits', 'SMS Credits', 'Storage (GB)', 'Auto-Recharge', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((w: any) => {
                const isLow = w.waCredits < 100;
                return (
                  <tr key={w.tenantId} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-semibold text-slate-900">{w.tenant?.name ?? w.tenantId?.slice(0, 12) + '…'}</p>
                      <p className="text-xs text-slate-400 font-mono">{w.tenantId?.slice(0, 8)}…</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-sm font-black ${isLow ? 'text-red-600' : 'text-slate-900'}`}>
                        {w.waCredits?.toFixed(1)}
                        {isLow && <span className="ml-1.5 text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">LOW</span>}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-700 font-semibold">{w.smsCredits}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-700 font-semibold">{w.storageGbPurchased?.toFixed(1)} GB</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        w.autoRechargeWaEnabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {w.autoRechargeWaEnabled ? '✓ On' : '✗ Off'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => setCrediting({ id: w.tenantId, name: w.tenant?.name ?? w.tenantId })}
                        className="text-xs font-bold text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
                        style={{ background: '#0D7C66' }}>
                        Credit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {crediting && (
        <CreditModal
          tenantId={crediting.id}
          tenantName={crediting.name}
          onClose={() => setCrediting(null)}
          onCredited={() => { setRefreshKey(k => k + 1); setCrediting(null); }}
        />
      )}
    </div>
  );
}
