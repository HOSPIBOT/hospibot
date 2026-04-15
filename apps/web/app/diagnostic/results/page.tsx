'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  FlaskConical, Search, Loader2, CheckCircle2, AlertTriangle,
  Clock, ChevronRight, Filter, Zap, Shield,
} from 'lucide-react';

const NAVY = '#1E3A5F';
const TEAL = '#0D7C66';
const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/10 outline-none transition-all placeholder:text-slate-400';

const DEPARTMENTS = ['All', 'Haematology', 'Biochemistry', 'Microbiology', 'Serology', 'Urine', 'Hormones', 'Stool'];

function TatCountdown({ deadline }: { deadline: string | null }) {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    if (!deadline) return;
    const update = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff < 0) { setRemaining('OVERDUE'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining(`${h}h ${m}m left`);
    };
    update();
    const t = setInterval(update, 60000);
    return () => clearInterval(t);
  }, [deadline]);
  if (!remaining) return null;
  const overdue = remaining === 'OVERDUE';
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${overdue ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
      <Clock className="w-2.5 h-2.5" />{remaining}
    </span>
  );
}

function WorklistRow({ order, onResult }: { order: any; onResult: (order: any) => void }) {
  const router = useRouter();
  const p = order.patient ?? {};
  const name = `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim();
  const items = order.orderItems ?? [];
  const pending = items.filter((i: any) => !['RESULTED', 'VALIDATED', 'DELIVERED'].includes(i.status));
  const resulted = items.filter((i: any) => ['RESULTED', 'VALIDATED'].includes(i.status));
  const firstDeadline = items.map((i: any) => i.tatDeadline).filter(Boolean).sort()[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="font-bold text-[#1E3A5F] font-mono text-sm">{order.orderNumber}</p>
            {order.isStat && <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-black rounded uppercase">STAT</span>}
            <TatCountdown deadline={firstDeadline} />
          </div>
          <p className="text-base font-bold text-slate-900">{name}</p>
          <p className="text-xs text-slate-400">{p.gender} {p.dateOfBirth ? `· ${new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear()}y` : ''} · {p.phone}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">{pending.length}/{items.length} pending</p>
          <div className="flex gap-1 mt-1 justify-end">
            {pending.length > 0 && (
              <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">{pending.length} to enter</span>
            )}
            {resulted.length > 0 && (
              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">{resulted.length} done</span>
            )}
          </div>
        </div>
      </div>

      {/* Test chips */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {items.map((item: any) => {
          const isDone = ['RESULTED', 'VALIDATED', 'DELIVERED'].includes(item.status);
          return (
            <span key={item.id} className={`text-xs font-semibold px-2 py-1 rounded-lg transition-all ${isDone ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
              {isDone && <span className="mr-1">✓</span>}
              {item.testCode}
            </span>
          );
        })}
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-slate-50">
        <button onClick={() => onResult(order)}
          className="flex-1 flex items-center justify-center gap-2 text-white text-sm font-bold py-2.5 rounded-xl hover:opacity-90 transition-opacity"
          style={{ background: pending.length > 0 ? NAVY : TEAL }}>
          <FlaskConical className="w-4 h-4" />
          {pending.length > 0 ? 'Enter Results' : 'View / Amend Results'}
        </button>
        <button onClick={() => router.push(`/diagnostic/lab-orders/${order.id}`)}
          className="flex items-center gap-1.5 text-slate-600 text-sm font-semibold px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
          View Order <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function ResultModal({ order, onClose, onSaved }: { order: any; onClose: () => void; onSaved: () => void }) {
  const [results, setResults] = useState<Record<string, { value: string; unit: string; interp: string }>>({});
  const [saving, setSaving] = useState(false);
  const [signing, setSigning] = useState(false);
  const items = order.orderItems ?? [];
  const allFilled = items.every((i: any) => results[i.id]?.value);
  const canSign = ['RESULTED', 'VALIDATED', 'IN_PROGRESS'].includes(order.status) && allFilled;

  const setResult = (itemId: string, field: string, val: string) => {
    setResults(p => ({ ...p, [itemId]: { ...p[itemId], [field]: val } }));
  };

  const save = async (draft = false) => {
    setSaving(true);
    try {
      const payload = items
        .filter((i: any) => results[i.id]?.value)
        .map((i: any) => {
          const r = results[i.id];
          const num = parseFloat(r.value);
          return {
            orderItemId: i.id,
            ...(isNaN(num) ? { textValue: r.value } : { numericValue: num }),
            unit: r.unit || undefined,
            interpretation: r.interp || undefined,
            isDraft: draft,
          };
        });
      await api.post(`/diagnostic/orders/${order.id}/results`, { results: payload, isDraft: draft });
      toast.success(draft ? 'Draft saved' : 'Results saved!');
      onSaved();
      if (!draft) onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const signOff = async () => {
    setSigning(true);
    try {
      if (allFilled) await save(false);
      await api.post(`/diagnostic/orders/${order.id}/sign`, {});
      toast.success('Report signed and sent to patient!');
      onSaved(); onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Sign-off failed');
    } finally { setSigning(false); }
  };

  // Pre-fill existing results
  useEffect(() => {
    const initial: Record<string, any> = {};
    items.forEach((i: any) => {
      const existing = i.resultEntries?.[0];
      if (existing) {
        initial[i.id] = {
          value: existing.numericValue?.toString() ?? existing.textValue ?? '',
          unit: existing.unit ?? '',
          interp: existing.interpretation ?? '',
        };
      }
    });
    setResults(initial);
  }, [order.id]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Enter Results</h2>
            <p className="text-sm text-slate-500">{order.orderNumber} · {order.patient?.firstName} {order.patient?.lastName}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.map((item: any) => {
            const r = results[item.id] ?? { value: '', unit: '', interp: '' };
            const existing = item.resultEntries?.[0];
            return (
              <div key={item.id} className="border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <p className="font-bold text-slate-900">{item.testName}</p>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">{item.testCode}</span>
                  {item.isStat && <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded font-black uppercase">STAT</span>}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Value *</label>
                    <input className={inputCls} placeholder="5.4" value={r.value}
                      onChange={e => setResult(item.id, 'value', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Unit</label>
                    <input className={inputCls} placeholder="g/dL" value={r.unit}
                      onChange={e => setResult(item.id, 'unit', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Comment</label>
                    <input className={inputCls} placeholder="Mild elevation…" value={r.interp}
                      onChange={e => setResult(item.id, 'interp', e.target.value)} />
                  </div>
                </div>
                {existing && (
                  <p className="text-[10px] text-slate-400 mt-2">
                    Previous: {existing.numericValue ?? existing.textValue} {existing.unit} · {existing.flag}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-3 bg-white">
          <button onClick={() => save(true)} disabled={saving}
            className="flex-1 py-2.5 text-sm font-bold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
            Save as Draft
          </button>
          <button onClick={() => save(false)} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
            style={{ background: NAVY }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Save Results
          </button>
          {canSign && (
            <button onClick={signOff} disabled={signing}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
              style={{ background: TEAL }}>
              {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              Sign & Release
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResultEntryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { status: 'RECEIVED_AT_LAB,IN_PROGRESS,RESULTED', limit: 50 };
      if (department !== 'All') params.department = department;
      if (search) params.search = search;
      const res = await api.get('/diagnostic/orders/worklist', { params })
        .catch(() => api.get('/diagnostic/orders', { params }));
      setOrders(res.data?.data ?? res.data ?? []);
    } finally { setLoading(false); }
  }, [department, search, refreshKey]);

  useEffect(() => { load(); }, [load]);

  const pending = orders.filter((o: any) => ['RECEIVED_AT_LAB', 'IN_PROGRESS'].includes(o.status));
  const resulted = orders.filter((o: any) => o.status === 'RESULTED');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Result Entry</h1>
          <p className="text-sm text-slate-500">{pending.length} pending · {resulted.length} awaiting validation</p>
        </div>
      </div>

      {/* Department filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {DEPARTMENTS.map(d => (
          <button key={d} onClick={() => setDepartment(d)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${department === d ? 'text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
            style={department === d ? { background: NAVY } : {}}>
            {d}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input className={`${inputCls} pl-10`} placeholder="Search patient or order…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-40" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center text-slate-400">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="font-bold text-slate-500 text-lg">Worklist is clear!</p>
          <p className="text-sm mt-1">No orders pending result entry</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {orders.map(o => (
            <WorklistRow key={o.id} order={o} onResult={setSelected} />
          ))}
        </div>
      )}

      {selected && (
        <ResultModal
          order={selected}
          onClose={() => setSelected(null)}
          onSaved={() => { setRefreshKey(k => k + 1); }}
        />
      )}
    </div>
  );
}
