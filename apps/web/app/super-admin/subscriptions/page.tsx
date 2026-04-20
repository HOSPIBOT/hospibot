'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const card = 'bg-white rounded-xl border p-5';
const badge = (color: string) => `inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${color}`;
const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-teal-500';

export default function SubscriptionTrackerPage() {
  const [tracker, setTracker] = useState<any>(null);
  const [gateway, setGateway] = useState<any>(null);
  const [editGw, setEditGw] = useState<any>(null);
  const [tab, setTab] = useState<'overview'|'renewals'|'overdue'|'gateway'>('overview');

  const load = useCallback(async () => {
    try {
      const [t, g] = await Promise.all([
        api.get('/super-admin/subscription-tracker'),
        api.get('/super-admin/gateway-charges'),
      ]);
      setTracker(t.data); setGateway(g.data);
    } catch { toast.error('Failed to load'); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const saveGateway = async () => {
    try {
      await api.patch('/super-admin/gateway-charges', editGw);
      toast.success('Gateway charges updated'); setEditGw(null); load();
    } catch { toast.error('Save failed'); }
  };

  const autoDisable = async () => {
    if (!confirm('This will SUSPEND all tenants overdue by more than the configured days. Continue?')) return;
    try {
      const { data } = await api.post('/super-admin/auto-disable-overdue');
      toast.success(`${data.disabled} tenant(s) suspended`); load();
    } catch { toast.error('Failed'); }
  };

  if (!tracker) return <div className="p-8 text-center text-slate-400">Loading subscription data...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Subscription & Billing Tracker</h1>
          <p className="text-sm text-slate-500 mt-1">Renewals, overdue payments, gateway charges, auto-disable</p>
        </div>
        <button onClick={autoDisable} className="px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100">
          Auto-Disable Overdue
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1">
        {(['overview','renewals','overdue','gateway'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${tab===t ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t === 'overview' ? '📊 Overview' : t === 'renewals' ? '🔄 Renewals' : t === 'overdue' ? '⚠️ Overdue' : '💳 Gateway Charges'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-5 gap-4">
            {[
              { label: 'Active', value: tracker.active, color: 'text-green-700 bg-green-50' },
              { label: 'Trial', value: tracker.trial, color: 'text-blue-700 bg-blue-50' },
              { label: 'Expired', value: tracker.expired, color: 'text-orange-700 bg-orange-50' },
              { label: 'Suspended', value: tracker.suspended, color: 'text-red-700 bg-red-50' },
              { label: 'Cancelled', value: tracker.cancelled, color: 'text-slate-700 bg-slate-50' },
            ].map(s => (
              <div key={s.label} className={`${card} ${s.color}`}>
                <p className="text-3xl font-bold">{s.value}</p>
                <p className="text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {tracker.lowFunds.length > 0 && (
            <div className={card}>
              <h3 className="font-semibold text-red-700 mb-3">🔴 Low Wallet Balance ({tracker.lowFunds.length} tenants)</h3>
              <div className="space-y-2">
                {tracker.lowFunds.map((t: any) => (
                  <div key={t.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg text-sm">
                    <span className="font-medium">{t.name}</span>
                    <div className="flex gap-4">
                      <span>WA: <strong className={t.waCredits < 50 ? 'text-red-600' : ''}>{t.waCredits}</strong></span>
                      <span>SMS: <strong className={t.smsCredits < 20 ? 'text-red-600' : ''}>{t.smsCredits}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'renewals' && (
        <div className="space-y-6">
          {[
            { label: 'Renewal in 5 days', data: tracker.renewalIn5Days, color: 'border-orange-200 bg-orange-50' },
            { label: 'Renewal in 10 days', data: tracker.renewalIn10Days, color: 'border-yellow-200 bg-yellow-50' },
            { label: 'Renewal in 15 days', data: tracker.renewalIn15Days, color: 'border-blue-200 bg-blue-50' },
          ].map(group => (
            <div key={group.label} className={`${card} ${group.color}`}>
              <h3 className="font-semibold text-slate-700 mb-3">{group.label} ({group.data.length})</h3>
              {group.data.length === 0 ? <p className="text-sm text-slate-400">None</p> : (
                <div className="space-y-2">
                  {group.data.map((t: any) => (
                    <div key={t.id} className="flex justify-between items-center p-3 bg-white rounded-lg text-sm border">
                      <div>
                        <span className="font-medium">{t.name}</span>
                        <span className={`ml-2 ${badge('bg-teal-100 text-teal-700')}`}>{t.plan}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Expires: {new Date(t.periodEnd).toLocaleDateString('en-IN')}</p>
                        <p className="font-semibold text-orange-600">{t.daysUntilRenewal} days left</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'overdue' && (
        <div className={card}>
          <h3 className="font-semibold text-red-700 mb-3">⚠️ Overdue ({tracker.overdue.length}) — Auto-disable after {gateway?.autoDisableAfterDays || 7} days</h3>
          {tracker.overdue.length === 0 ? <p className="text-sm text-slate-400">No overdue tenants</p> : (
            <div className="space-y-2">
              {tracker.overdue.map((t: any) => (
                <div key={t.id} className={`flex justify-between items-center p-4 rounded-lg text-sm border ${t.daysOverdue >= (gateway?.autoDisableAfterDays || 7) ? 'bg-red-50 border-red-300' : 'bg-orange-50 border-orange-200'}`}>
                  <div>
                    <span className="font-medium">{t.name}</span>
                    <span className={`ml-2 ${badge('bg-slate-100 text-slate-600')}`}>{t.plan}</span>
                    <span className={`ml-2 ${badge(t.daysOverdue >= (gateway?.autoDisableAfterDays || 7) ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700')}`}>
                      {t.daysOverdue} days overdue
                    </span>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p>{t.email}</p>
                    <p>{t.phone}</p>
                    {t.daysOverdue >= (gateway?.autoDisableAfterDays || 7) && (
                      <p className="text-red-600 font-bold mt-1">⛔ Will be auto-disabled</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'gateway' && (
        <div className="space-y-6">
          <div className={card}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-700">Payment Gateway Fee Configuration</h3>
              {!editGw ? (
                <button onClick={() => setEditGw({...gateway})} className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-sm">Edit</button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditGw(null)} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm">Cancel</button>
                  <button onClick={saveGateway} className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-sm">Save</button>
                </div>
              )}
            </div>

            {!editGw ? (
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Razorpay Fee (passed to tenant)</p>
                  <p className="text-2xl font-bold text-slate-700">{gateway?.razorpayFeePercent}%</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">GST Rate</p>
                  <p className="text-2xl font-bold text-slate-700">{gateway?.gstPercent}%</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Auto-disable after</p>
                  <p className="text-2xl font-bold text-red-600">{gateway?.autoDisableAfterDays} days</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Razorpay Fee %</label>
                  <input className={inputCls} type="number" step="0.01" value={editGw.razorpayFeePercent}
                    onChange={e => setEditGw({...editGw, razorpayFeePercent: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">GST %</label>
                  <input className={inputCls} type="number" value={editGw.gstPercent}
                    onChange={e => setEditGw({...editGw, gstPercent: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Auto-disable after (days)</label>
                  <input className={inputCls} type="number" value={editGw.autoDisableAfterDays}
                    onChange={e => setEditGw({...editGw, autoDisableAfterDays: Number(e.target.value)})} />
                </div>
              </div>
            )}
          </div>

          <div className={card}>
            <h3 className="font-semibold text-slate-700 mb-3">Per-Channel Gateway Fees</h3>
            <p className="text-xs text-slate-500 mb-3">Razorpay charges are added ON TOP of HospiBot pricing and collected from the tenant. HospiBot receives the full amount without deduction.</p>
            <div className="space-y-2">
              {Object.entries(gateway?.perChannelGatewayFees || {}).map(([key, val]: [string, any]) => (
                <div key={key} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">{val.label}</span>
                  <span className="text-sm font-mono text-teal-700">{val.razorpayFeePercent}% gateway fee</span>
                </div>
              ))}
            </div>
          </div>

          <div className={card}>
            <h3 className="font-semibold text-slate-700 mb-3">Billing Breakdown Example</h3>
            <p className="text-xs text-slate-500 mb-3">How the bill is calculated for a ₹2,999 Growth Plan subscription:</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between p-2"><span>HospiBot Subscription (Growth Plan)</span><span className="font-mono">₹2,999.00</span></div>
              <div className="flex justify-between p-2 bg-yellow-50 rounded"><span>Payment Gateway Charges @{gateway?.razorpayFeePercent}%</span><span className="font-mono">₹{(2999 * (gateway?.razorpayFeePercent || 2.36) / 100).toFixed(2)}</span></div>
              <div className="flex justify-between p-2 font-bold border-t-2 text-teal-700">
                <span>Total Collected from Tenant</span>
                <span className="font-mono">₹{(2999 + 2999 * (gateway?.razorpayFeePercent || 2.36) / 100).toFixed(2)}</span>
              </div>
              <p className="text-xs text-green-600 mt-2">✅ HospiBot receives full ₹2,999.00 — Razorpay fee is borne by the tenant</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
