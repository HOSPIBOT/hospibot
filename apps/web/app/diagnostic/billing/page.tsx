'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  IndianRupee, Zap, MessageSquare, HardDrive, CreditCard,
  RefreshCw, TrendingDown, Bell, CheckCircle2, AlertTriangle,
  Loader2, ChevronRight, Package,
} from 'lucide-react';
import { DiagnosticRecharge } from '@/components/ui/DiagnosticRecharge';

const NAVY = '#1E3A5F';
const TEAL = '#0D7C66';

type WalletTab = 'overview' | 'whatsapp' | 'sms' | 'storage' | 'invoices' | 'transactions';

const WALLET_CARDS = [
  { type: 'WHATSAPP', label: 'WhatsApp Credits', icon: MessageSquare, color: '#25D366', unit: 'credits', key: 'waCredits' },
  { type: 'SMS',      label: 'SMS Credits',      icon: MessageSquare, color: '#3B82F6', unit: 'SMS',     key: 'smsCredits' },
  { type: 'STORAGE',  label: 'Storage',           icon: HardDrive,     color: '#8B5CF6', unit: 'GB',      key: 'storageGbPurchased' },
];

function WalletCard({ wc, balances }: { wc: typeof WALLET_CARDS[0]; balances: any }) {
  const value = balances?.[wc.key] ?? 0;
  const isLow = wc.key === 'waCredits' && value < 500;
  return (
    <div className={`bg-white rounded-2xl border p-5 hover:shadow-md transition-all ${isLow ? 'border-yellow-300' : 'border-slate-100'}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${wc.color}15` }}>
          <wc.icon className="w-5 h-5" style={{ color: wc.color }} />
        </div>
        {isLow && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
      </div>
      <p className="text-3xl font-black text-slate-900">{typeof value === 'number' ? value.toFixed(wc.key === 'storageGbPurchased' ? 1 : 0) : '—'}</p>
      <p className="text-sm text-slate-500 mt-1">{wc.label}</p>
      {isLow && <p className="text-xs text-yellow-600 font-semibold mt-1">Low balance — Recharge soon</p>}
    </div>
  );
}

function RechargePackCard({ pack, onSuccess }: { pack: any; onSuccess: () => void }) {
  const unit = pack.packType === 'WHATSAPP' ? 'credits' : pack.packType === 'SMS' ? 'SMS' : 'GB';
  const isBest = pack.sortOrder === 2;
  return (
    <div className={`bg-white rounded-2xl border p-5 hover:shadow-md transition-all ${isBest ? 'border-[#1E3A5F]/40 ring-2 ring-[#1E3A5F]/10' : 'border-slate-100'}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="font-bold text-slate-900">{pack.name}</p>
        {isBest && (
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white" style={{ background: TEAL }}>BEST VALUE</span>
        )}
      </div>
      <p className="text-2xl font-black mb-0.5" style={{ color: NAVY }}>
        {pack.creditsOrUnits?.toFixed(0)}{' '}
        <span className="text-sm font-normal text-slate-500">{unit}</span>
      </p>
      <p className="text-xs text-slate-400 mb-4">₹{(pack.priceInclGst / 100).toFixed(0)} incl. 18% GST</p>
      <DiagnosticRecharge pack={pack} onSuccess={onSuccess} />
    </div>
  );
}

export default function BillingPage() {
  const [tab, setTab] = useState<WalletTab>('overview');
  const [overview, setOverview] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [packs, setPacks] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [recharging, setRecharging] = useState(false);
  const [activePackType, setActivePackType] = useState('WHATSAPP');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, inv, txn] = await Promise.all([
        api.get('/diagnostic/billing/overview').catch(() => ({ data: null })),
        api.get('/diagnostic/billing/invoices').catch(() => ({ data: { data: [] } })),
        api.get('/diagnostic/billing/transactions').catch(() => ({ data: { data: [] } })),
      ]);
      setOverview(ov.data);
      setInvoices(inv.data?.data ?? []);
      setTransactions(txn.data?.data ?? []);
    } finally { setLoading(false); }
  }, [refreshKey]);

  useEffect(() => { load(); }, [load]);

  const loadPacks = async (type: string) => {
    const res = await api.get(`/diagnostic/billing/packs/${type}`).catch(() => ({ data: [] }));
    setPacks(res.data ?? []);
    setActivePackType(type);
  };

  useEffect(() => { loadPacks('WHATSAPP'); }, []);

  const loadUsage = async (type: string) => {
    const res = await api.get(`/diagnostic/billing/usage/${type}`, { params: { period: '30d' } }).catch(() => ({ data: null }));
    setUsage(res.data);
  };

  useEffect(() => {
    if (tab === 'whatsapp') loadUsage('WHATSAPP');
    else if (tab === 'sms') loadUsage('SMS');
  }, [tab]);

  const wallet = overview?.wallet ?? {};
  const usageStats = overview?.usage ?? {};

  const TABS: { key: WalletTab; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: IndianRupee },
    { key: 'whatsapp', label: 'WA Usage', icon: MessageSquare },
    { key: 'sms', label: 'SMS', icon: MessageSquare },
    { key: 'storage', label: 'Storage', icon: HardDrive },
    { key: 'invoices', label: 'Invoices', icon: CreditCard },
    { key: 'transactions', label: 'Transactions', icon: TrendingDown },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Billing & Wallet</h1>
          <p className="text-sm text-slate-500">Credits, usage, invoices and payment methods</p>
        </div>
        <button onClick={() => setRefreshKey(k => k + 1)}
          className="p-2.5 text-slate-500 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-2xl p-1.5 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all ${tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {/* Wallet cards */}
          <div className="grid grid-cols-3 gap-4">
            {WALLET_CARDS.map(wc => <WalletCard key={wc.type} wc={wc} balances={wallet} />)}
          </div>

          {/* Usage this month */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-bold text-slate-900 mb-4">This Month's Usage</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#25D366]" />
                  <p className="text-sm font-semibold text-slate-700">WA Messages Sent</p>
                </div>
                <p className="font-black text-slate-900">{usageStats.waCreditsUsedThisMonth?.toFixed(0) ?? '—'}</p>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  <p className="text-sm font-semibold text-slate-700">SMS Sent</p>
                </div>
                <p className="font-black text-slate-900">{usageStats.smsUsedThisMonth ?? '—'}</p>
              </div>
            </div>
          </div>

          {/* Recharge section */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Recharge Credits</h3>
              <div className="flex items-center gap-2">
                {[
                  { type: 'WHATSAPP', label: 'WhatsApp', color: '#25D366' },
                  { type: 'SMS', label: 'SMS', color: '#3B82F6' },
                  { type: 'STORAGE', label: 'Storage', color: '#8B5CF6' },
                ].map(t => (
                  <button key={t.type} onClick={() => loadPacks(t.type)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all border ${activePackType === t.type ? 'text-white border-transparent' : 'bg-white border-slate-200 text-slate-600'}`}
                    style={activePackType === t.type ? { background: t.color } : {}}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            {packs.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">No recharge packs configured. Contact HospiBot support.</div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {packs.map(pack => <RechargePackCard key={pack.id} pack={pack} onSuccess={() => { setRefreshKey(k => k + 1); load(); }} />)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* WhatsApp usage tab */}
      {tab === 'whatsapp' && (
        <div className="space-y-5">
          {usage ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Total Messages', value: usage.totalMessages ?? 0, color: '#25D366' },
                  { label: 'Total Credits Used', value: (usage.totalCredits ?? 0).toFixed(1), color: NAVY },
                  { label: 'Delivery Rate', value: '98.2%', color: TEAL },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4">
                    <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-xs text-slate-500 mt-1">{s.label} (30d)</p>
                  </div>
                ))}
              </div>

              {usage.byTemplate && Object.keys(usage.byTemplate).length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 p-5">
                  <h3 className="font-bold text-slate-900 mb-4">Usage by Template</h3>
                  <div className="space-y-2">
                    {Object.entries(usage.byTemplate).map(([code, data]: any) => (
                      <div key={code} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-[#1E3A5F] bg-[#1E3A5F]/10 px-2 py-0.5 rounded w-12 text-center">{code}</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(data.credits / (usage.totalCredits || 1) * 100, 100)}%`, background: '#25D366' }} />
                        </div>
                        <span className="text-xs text-slate-600 font-semibold w-20 text-right">{data.count} msgs</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
              <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-slate-200" />
              <p>Loading WhatsApp usage data…</p>
            </div>
          )}
        </div>
      )}

      {/* Invoices tab */}
      {tab === 'invoices' && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          {invoices.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CreditCard className="w-10 h-10 mx-auto mb-3 text-slate-200" />
              <p className="font-semibold text-slate-500">No invoices yet</p>
              <p className="text-sm mt-1">Invoices will appear here after recharges and renewals</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  {['Invoice #', 'Type', 'Amount', 'Date', 'Status', ''].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-5 py-3.5 font-mono text-sm font-bold text-[#1E3A5F]">{inv.invoiceNumber}</td>
                    <td className="px-5 py-3.5"><span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">{inv.invoiceType}</span></td>
                    <td className="px-5 py-3.5 text-sm font-bold text-slate-900">{formatINR(inv.totalPaise)}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">{new Date(inv.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${inv.paidAt ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {inv.paidAt ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {inv.pdfUrl && (
                        <a href={inv.pdfUrl} target="_blank" rel="noreferrer" className="text-xs text-[#1E3A5F] font-semibold hover:underline">Download PDF</a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Transactions tab */}
      {tab === 'transactions' && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <TrendingDown className="w-10 h-10 mx-auto mb-3 text-slate-200" />
              <p className="font-semibold text-slate-500">No transactions yet</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  {['Type', 'Description', 'Amount', 'Balance After', 'Date'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map(txn => (
                  <tr key={txn.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-5 py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${txn.txType?.startsWith('CREDIT') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{txn.txType}</span></td>
                    <td className="px-5 py-3 text-sm text-slate-700">{txn.description}</td>
                    <td className={`px-5 py-3 text-sm font-bold ${txn.txType?.startsWith('CREDIT') ? 'text-green-700' : 'text-red-600'}`}>
                      {txn.txType?.startsWith('CREDIT') ? '+' : '-'}{txn.amount.toFixed(1)}
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold text-slate-900">{txn.balanceAfter?.toFixed(1)}</td>
                    <td className="px-5 py-3 text-sm text-slate-400">{new Date(txn.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* SMS / Storage tabs — placeholder */}
      {(tab === 'sms' || tab === 'storage') && (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
          <Package className="w-10 h-10 mx-auto mb-3 text-slate-200" />
          <p className="font-semibold text-slate-500">{tab === 'sms' ? 'SMS Usage' : 'Storage Usage'}</p>
          <p className="text-sm mt-1">Detailed usage analytics coming soon</p>
        </div>
      )}
    </div>
  );
}
