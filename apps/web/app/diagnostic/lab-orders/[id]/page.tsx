'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatDate, formatTime, formatINR } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  ArrowLeft, FlaskConical, Clock, CheckCircle2, AlertTriangle,
  Send, Loader2, User, Phone, Zap, Edit3, Shield,
  AlertCircle, ChevronDown, ChevronUp, Download, RefreshCw,
} from 'lucide-react';

const NAVY = '#1E3A5F';
const TEAL = '#0D7C66';

const STAGES = [
  { key: 'ORDERED',          label: 'Ordered',       color: '#94A3B8' },
  { key: 'SAMPLE_COLLECTED', label: 'Collected',     color: '#3B82F6' },
  { key: 'DISPATCHED',       label: 'Dispatched',    color: '#8B5CF6' },
  { key: 'RECEIVED_AT_LAB',  label: 'At Lab',        color: '#06B6D4' },
  { key: 'IN_PROGRESS',      label: 'In Progress',   color: '#F59E0B' },
  { key: 'RESULTED',         label: 'Results Ready', color: '#F97316' },
  { key: 'VALIDATED',        label: 'Validated',     color: '#22C55E' },
  { key: 'DELIVERED',        label: 'Delivered',     color: '#10B981' },
];

const NEXT_STATUS: Record<string, { to: string; label: string; color: string }> = {
  ORDERED:          { to: 'SAMPLE_COLLECTED', label: 'Collect Sample',   color: '#3B82F6' },
  SAMPLE_COLLECTED: { to: 'DISPATCHED',       label: 'Dispatch Samples', color: '#8B5CF6' },
  DISPATCHED:       { to: 'RECEIVED_AT_LAB',  label: 'Mark Received',   color: '#06B6D4' },
  RECEIVED_AT_LAB:  { to: 'IN_PROGRESS',      label: 'Start Processing', color: '#F59E0B' },
};

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/10 outline-none transition-all placeholder:text-slate-400';
const labelCls = 'block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide';

function FlagBadge({ flag }: { flag: string }) {
  const colors: Record<string, string> = {
    NORMAL: 'text-slate-500 bg-slate-100',
    LOW: 'text-blue-700 bg-blue-100',
    HIGH: 'text-orange-700 bg-orange-100',
    CRITICAL_LOW: 'text-red-800 bg-red-100 font-black animate-pulse',
    CRITICAL_HIGH: 'text-red-800 bg-red-100 font-black animate-pulse',
    TEXT: 'text-slate-600 bg-slate-100',
  };
  const labels: Record<string, string> = {
    NORMAL: 'N', LOW: 'L', HIGH: 'H', CRITICAL_LOW: 'CL', CRITICAL_HIGH: 'CH', TEXT: 'T',
  };
  return (
    <span className={'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ' + (colors[flag] ?? 'text-slate-500 bg-slate-100')}>
      {labels[flag] ?? flag}
    </span>
  );
}

function ResultEntryRow({ item, onSave }: { item: any; onSave: (itemId: string, value: string, unit: string, interp: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('');
  const [interp, setInterp] = useState('');
  const [saving, setSaving] = useState(false);

  const existing = item.resultEntries?.[0];

  useEffect(() => {
    if (existing) {
      setValue(existing.numericValue?.toString() ?? existing.textValue ?? '');
      setUnit(existing.unit ?? '');
      setInterp(existing.interpretation ?? '');
    }
  }, [existing]);

  const save = async () => {
    setSaving(true);
    try {
      await onSave(item.id, value, unit, interp);
      setEditing(false);
      toast.success('Result saved');
    } finally { setSaving(false); }
  };

  return (
    <div className={'border rounded-xl p-4 transition-all ' + (editing ? 'border-[#1E3A5F]/30 bg-[#1E3A5F]/2' : 'border-slate-100 bg-white')}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-bold text-slate-900">{item.testName}</p>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{item.testCode}</span>
            {item.isStat && <span className="text-[9px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded uppercase">STAT</span>}
          </div>
          {item.tatDeadline && (
            <p className="text-[10px] text-slate-400">TAT: {new Date(item.tatDeadline).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {existing && <FlagBadge flag={existing.flag ?? 'NORMAL'} />}
          <button onClick={() => setEditing(!editing)}
            className={'flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all ' +
              (editing ? 'bg-slate-100 text-slate-600' : 'text-white') }
            style={editing ? {} : { background: NAVY }}>
            {editing ? 'Cancel' : existing ? <><Edit3 className="w-3 h-3" /> Edit</> : '+ Enter Result'}
          </button>
        </div>
      </div>

      {/* Show existing value */}
      {existing && !editing && (
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-50">
          <p className="text-xl font-black text-slate-900">
            {existing.numericValue ?? existing.textValue ?? '—'}
            {existing.unit && <span className="text-sm font-normal text-slate-500 ml-1">{existing.unit}</span>}
          </p>
          {existing.lowerNormal != null && (
            <p className="text-xs text-slate-400">Range: {existing.lowerNormal} – {existing.upperNormal}</p>
          )}
          {existing.interpretation && (
            <p className="text-xs text-slate-500 italic">"{existing.interpretation}"</p>
          )}
        </div>
      )}

      {/* Editing form */}
      {editing && (
        <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Value</label>
            <input className={inputCls} placeholder="e.g. 5.4" value={value} onChange={e => setValue(e.target.value)} autoFocus />
          </div>
          <div>
            <label className={labelCls}>Unit</label>
            <input className={inputCls} placeholder="g/dL, mg/dL…" value={unit} onChange={e => setUnit(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Interpretation</label>
            <input className={inputCls} placeholder="Pathologist comment…" value={interp} onChange={e => setInterp(e.target.value)} />
          </div>
          <div className="col-span-3 flex justify-end">
            <button onClick={save} disabled={saving || !value}
              className="flex items-center gap-2 text-white text-sm font-bold px-4 py-2 rounded-xl disabled:opacity-50 hover:opacity-90 transition-opacity"
              style={{ background: TEAL }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Save Result
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signing, setSigning] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'results' | 'samples' | 'timeline'>( 'overview');

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/diagnostic/orders/${id}`)
        .catch(() => api.get(`/lab/orders/${id}`));
      setOrder(res.data);
    } catch { toast.error('Failed to load order'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (newStatus: string) => {
    setSaving(true);
    try {
      await api.patch(`/diagnostic/orders/${id}/status`, { status: newStatus })
        .catch(() => api.patch(`/lab/orders/${id}/status`, { status: newStatus }));
      toast.success('Status updated');
      load();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const saveResult = async (itemId: string, value: string, unit: string, interp: string) => {
    const num = parseFloat(value);
    await api.post(`/diagnostic/orders/${id}/results`, {
      results: [{
        orderItemId: itemId,
        ...(isNaN(num) ? { textValue: value } : { numericValue: num }),
        unit, interpretation: interp, isDraft: false,
      }],
    });
    await load();
  };

  const signOff = async () => {
    setSigning(true);
    try {
      await api.post(`/diagnostic/orders/${id}/sign`, {});
      toast.success('Report signed and released to patient!');
      load();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Sign-off failed'); }
    finally { setSigning(false); }
  };

  if (loading) return (
    <div className="space-y-5">
      {Array.from({ length: 4 }).map((_, i) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-24" />)}
    </div>
  );
  if (!order) return <div className="text-center py-20 text-slate-400">Order not found</div>;

  const p = order.patient ?? {};
  const patName = `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || '—';
  const items = order.orderItems ?? [];
  const currentIdx = STAGES.findIndex(s => s.key === order.status);
  const next = NEXT_STATUS[order.status];
  const canSignOff = ['RESULTED', 'VALIDATED'].includes(order.status);
  const age = p.dateOfBirth ? Math.floor((Date.now() - new Date(p.dateOfBirth).getTime()) / (365.25 * 86400000)) : null;

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'results', label: `Results (${items.length})` },
    { key: 'samples', label: 'Samples' },
    { key: 'timeline', label: 'Timeline' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 font-mono">{order.orderNumber}</h1>
            {order.isStat && <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-black rounded uppercase">STAT</span>}
          </div>
          <p className="text-sm text-slate-500">{formatDate(order.createdAt)} · {formatTime(order.createdAt)} · {items.length} test{items.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={load} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Critical value alert */}
      {(order.criticalAlerts ?? []).filter((a: any) => !a.acknowledgedAt).length > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border-2 border-red-200 rounded-2xl p-4">
          <AlertCircle className="w-6 h-6 text-red-600 animate-pulse flex-shrink-0" />
          <div>
            <p className="font-bold text-red-800">Critical Value Alert — Awaiting Acknowledgement</p>
            {(order.criticalAlerts ?? []).filter((a: any) => !a.acknowledgedAt).map((a: any) => (
              <p key={a.id} className="text-sm text-red-600">{a.testName}: <strong>{a.criticalValue}</strong> ({a.threshold})</p>
            ))}
          </div>
        </div>
      )}

      {/* 8-Stage timeline */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-start justify-between gap-2 overflow-x-auto pb-2">
          {STAGES.map((stage, i) => {
            const done = i < currentIdx;
            const current = i === currentIdx;
            const future = i > currentIdx;
            return (
              <div key={stage.key} className="flex-1 min-w-0 flex flex-col items-center gap-1.5">
                <div className="relative flex items-center w-full">
                  {i > 0 && <div className={'absolute right-1/2 top-4 w-full h-0.5 ' + (done || current ? '' : 'bg-slate-200')} style={done || current ? { background: stage.color } : {}} />}
                  <div className={'relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black mx-auto flex-shrink-0 transition-all ' +
                    (done ? 'text-white' : current ? 'text-white ring-4' : 'bg-slate-100 text-slate-400')}
                    style={done || current ? { background: stage.color, boxShadow: current ? `0 0 0 4px ${stage.color}25` : undefined } : {}}>
                    {done ? '✓' : i + 1}
                  </div>
                </div>
                <p className={'text-[10px] font-semibold text-center leading-tight ' + (current ? 'text-slate-900' : future ? 'text-slate-400' : 'text-slate-600')}>{stage.label}</p>
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 mt-5 pt-4 border-t border-slate-100">
          {next && (
            <button onClick={() => updateStatus(next.to)} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 text-white font-bold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
              style={{ background: next.color }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {next.label}
            </button>
          )}
          {canSignOff && (
            <button onClick={signOff} disabled={signing}
              className="flex-1 flex items-center justify-center gap-2 text-white font-bold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
              style={{ background: TEAL }}>
              {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              Sign & Release Report
            </button>
          )}
          {order.status === 'DELIVERED' && (
            <div className="flex-1 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <p className="text-sm font-bold text-emerald-700">Report released to patient</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-2xl p-1.5">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)}
            className={'flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ' +
              (activeTab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Patient</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#1E3A5F]/10 flex items-center justify-center text-lg font-bold text-[#1E3A5F]">
                {(p.firstName?.[0] ?? '?').toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-slate-900">{patName}</p>
                <p className="text-sm text-slate-500">{p.gender ?? '—'}{age ? ` · ${age}y` : ''}</p>
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t border-slate-50">
              {[
                ['Phone', p.phone],
                ['Health ID', p.healthId],
                ['Collection', order.collectionMode?.replace('_', ' ') ?? 'Walk-in'],
                ['Referred by', order.referringDoctor],
                ['Clinical info', order.clinicalInfo],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k as string} className="flex justify-between text-sm">
                  <span className="text-slate-500">{k}</span>
                  <span className="font-semibold text-slate-900 text-right max-w-[180px] truncate">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5"><FlaskConical className="w-3.5 h-3.5" /> Order Info</p>
            <div className="space-y-2">
              {[
                ['Total Amount', order.totalAmount ? formatINR(order.totalAmount) : '—'],
                ['Status', order.status?.replace(/_/g, ' ')],
                ['Priority', order.isStat ? '⚡ STAT' : order.priority ?? 'Normal'],
                ['Ordered At', formatDate(order.createdAt)],
                ['Sample Collected', order.sampleCollectedAt ? formatDate(order.sampleCollectedAt) : '—'],
                ['Released At', order.releasedAt ? formatDate(order.releasedAt) : '—'],
              ].map(([k, v]) => (
                <div key={k as string} className="flex justify-between text-sm">
                  <span className="text-slate-500">{k}</span>
                  <span className="font-semibold text-slate-900">{v}</span>
                </div>
              ))}
            </div>
            {order.notes && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-2">
                <p className="text-xs font-bold text-amber-700 mb-1">Notes</p>
                <p className="text-sm text-amber-800">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Samples */}
          {(order.samples ?? []).length > 0 && (
            <div className="col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Sample Barcodes</p>
              <div className="grid grid-cols-3 gap-3">
                {(order.samples ?? []).map((s: any) => (
                  <div key={s.id} className="bg-slate-50 rounded-xl p-3">
                    <p className="font-mono text-sm font-bold text-slate-900">{s.barcode}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.tubeType ?? '—'} · {s.status}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results tab */}
      {activeTab === 'results' && (
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
              <FlaskConical className="w-10 h-10 mx-auto mb-3 text-slate-200" />
              <p className="font-semibold text-slate-500">No test items found</p>
              <p className="text-sm mt-1">Results will appear here once the sample is received</p>
            </div>
          ) : (
            <>
              {['IN_PROGRESS', 'RECEIVED_AT_LAB', 'RESULTED', 'VALIDATED'].includes(order.status) && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-3 text-sm text-blue-800 font-semibold">
                  Enter numeric or text values below. Values are auto-flagged against reference ranges.
                  Critical values trigger immediate WhatsApp alerts.
                </div>
              )}
              {items.map((item: any) => (
                <ResultEntryRow
                  key={item.id}
                  item={item}
                  onSave={(itemId, value, unit, interp) => saveResult(itemId, value, unit, interp)}
                />
              ))}
              {canSignOff && (
                <button onClick={signOff} disabled={signing}
                  className="w-full flex items-center justify-center gap-2 text-white font-bold py-3 rounded-2xl hover:opacity-90 disabled:opacity-50 transition-opacity mt-4"
                  style={{ background: TEAL }}>
                  {signing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                  Sign Off & Release Report to Patient
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Samples tab */}
      {activeTab === 'samples' && (
        <div className="space-y-3">
          {(order.samples ?? []).map((s: any) => (
            <div key={s.id} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <FlaskConical className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 font-mono">{s.barcode}</p>
                  <p className="text-xs text-slate-500">{s.tubeType ?? 'Unknown tube'} · {s.containerType ?? ''}</p>
                </div>
                <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">{s.status}</span>
              </div>
              {(s.statusLogs ?? []).length > 0 && (
                <div className="space-y-2 border-t border-slate-50 pt-3">
                  {s.statusLogs.map((log: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />
                      <span className="font-semibold text-slate-700">{log.toStatus}</span>
                      <span>·</span>
                      <span>{formatDate(log.createdAt)} {formatTime(log.createdAt)}</span>
                      {log.notes && <span className="text-slate-400 italic">— {log.notes}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {!(order.samples ?? []).length && (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
              <p className="font-semibold">No sample records yet</p>
            </div>
          )}
        </div>
      )}

      {/* Timeline tab */}
      {activeTab === 'timeline' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="space-y-4">
            {[
              { label: 'Order Created', time: order.createdAt, done: true, color: '#94A3B8' },
              { label: 'Sample Collected', time: order.sampleCollectedAt, done: !!order.sampleCollectedAt, color: '#3B82F6' },
              { label: 'Dispatched', time: order.dispatchedAt, done: !!order.dispatchedAt, color: '#8B5CF6' },
              { label: 'Received at Lab', time: order.receivedAtLabAt, done: !!order.receivedAtLabAt, color: '#06B6D4' },
              { label: 'Results Entered', time: order.reportedAt, done: !!order.reportedAt, color: '#F59E0B' },
              { label: 'Report Released', time: order.releasedAt, done: !!order.releasedAt, color: '#10B981' },
            ].map((e, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ' + (e.done ? 'text-white' : 'bg-slate-100 text-slate-300')}
                  style={e.done ? { background: e.color } : {}}>
                  {e.done ? '✓' : i + 1}
                </div>
                <div className="flex-1 pb-4 border-b border-slate-50 last:border-0">
                  <p className={'text-sm font-bold ' + (e.done ? 'text-slate-900' : 'text-slate-400')}>{e.label}</p>
                  {e.time && <p className="text-xs text-slate-400 mt-0.5">{formatDate(e.time)} · {formatTime(e.time)}</p>}
                  {!e.done && <p className="text-xs text-slate-300 mt-0.5">Pending</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
