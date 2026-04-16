'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend,
} from 'recharts';
import { Target, Plus, X, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

const NAVY = '#1E3A5F';
const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/10 outline-none transition-all placeholder:text-slate-400';
const labelCls = 'block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide';
const CATEGORIES = ['Haematology', 'Biochemistry', 'Microbiology', 'Serology', 'Urine', 'Hormones', 'Other'];

function QCPageInner() {
  const [testCode, setTestCode] = useState('CBC');
  const [days, setDays] = useState(30);
  const [history, setHistory] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams?.get('log') === '1') setShowForm(true);
  }, []);
  const [form, setForm] = useState({
    testCode: '', analyserId: '', lotNumber: '',
    controlLevel: 'NORMAL', expectedValue: '', actualValue: '',
    mean: '', sd: '', runDate: new Date().toISOString().split('T')[0],
  });

  const loadHistory = useCallback(async () => {
    if (!testCode) return;
    setLoading(true);
    try {
      const res = await api.get(`/diagnostic/qc/history/${testCode}`, { params: { days } });
      setHistory(res.data);
    } catch { setHistory(null); }
    finally { setLoading(false); }
  }, [testCode, days]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const submitQc = async () => {
    if (!form.testCode || !form.expectedValue || !form.actualValue) {
      toast.error('Test code, expected and actual values are required');
      return;
    }
    setSaving(true);
    try {
      const res = await api.post('/diagnostic/qc/results', {
        ...form,
        expectedValue: parseFloat(form.expectedValue),
        actualValue: parseFloat(form.actualValue),
        mean: form.mean ? parseFloat(form.mean) : undefined,
        sd: form.sd ? parseFloat(form.sd) : undefined,
      });
      if (res.data.isPass) {
        toast.success('QC Pass ✓');
      } else {
        toast.error(`QC FAIL — Westgard rules: ${res.data.westgardFlags?.join(', ')}`);
      }
      setShowForm(false);
      setTestCode(form.testCode);
      loadHistory();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'QC submission failed');
    } finally { setSaving(false); }
  };

  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const lj = history?.leveyJennings;
  const chartData = (history?.data ?? []).map((r: any) => ({
    date: new Date(r.runDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    value: r.actualValue,
    pass: r.isPass,
    flags: r.westgardFlags?.join(', '),
  }));

  const passRate = history?.data?.length
    ? Math.round(history.data.filter((r: any) => r.isPass).length / history.data.length * 100)
    : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Quality Control</h1>
          <p className="text-sm text-slate-500">Levey-Jennings charts & Westgard rule evaluation</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
          style={{ background: NAVY }}>
          <Plus className="w-4 h-4" /> Log QC Run
        </button>
      </div>

      {/* Test selector + filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <input className={inputCls} placeholder="Test code (e.g. CBC, HbA1c)" value={testCode}
            onChange={e => setTestCode(e.target.value.toUpperCase())} />
        </div>
        <select className={`${inputCls} w-36`} value={days} onChange={e => setDays(+e.target.value)}>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={60}>Last 60 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Stats row */}
      {lj && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Mean', value: lj.mean?.toFixed(2) },
            { label: 'SD (1s)', value: lj.sd?.toFixed(3) },
            { label: 'CV%', value: lj.sd && lj.mean ? `${(lj.sd / lj.mean * 100).toFixed(1)}%` : '—' },
            { label: 'Pass Rate', value: passRate !== null ? `${passRate}%` : '—' },
          ].map((s: any) => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4">
              <p className="text-2xl font-black text-slate-900">{s.value ?? '—'}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Levey-Jennings Chart */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900">Levey-Jennings Chart — {testCode || 'Select test'}</h3>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-500 inline-block" /> ±1s</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-yellow-400 inline-block" /> ±2s</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-500 inline-block" /> ±3s</span>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <Target className="w-10 h-10 mx-auto mb-2 text-slate-200" />
              <p>No QC data for {testCode}</p>
              <p className="text-sm mt-1">Log a QC run to begin tracking</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }}
                formatter={(value: any, _: string, props: any) => [
                  `${value}${props.payload.flags ? ` ⚠ ${props.payload.flags}` : ''}`,
                  'Value'
                ]} />
              {lj && [
                { y: lj.mean, color: '#64748B', dash: '8 4', label: 'Mean' },
                { y: lj.uwl,  color: '#EAB308', dash: '5 3', label: '+2s' },
                { y: lj.lwl,  color: '#EAB308', dash: '5 3', label: '-2s' },
                { y: lj.ucl,  color: '#EF4444', dash: '4 2', label: '+3s' },
                { y: lj.lcl,  color: '#EF4444', dash: '4 2', label: '-3s' },
              ].map((l: any) => (
                <ReferenceLine key={l.label} y={l.y} stroke={l.color} strokeDasharray={l.dash}
                  label={{ value: l.label, fill: l.color, fontSize: 9 }} />
              ))}
              <Line type="monotone" dataKey="value" stroke={NAVY} strokeWidth={2}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  const isReject = payload.flags?.includes('reject');
                  return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={isReject ? 6 : 4}
                    fill={isReject ? '#EF4444' : NAVY} stroke="white" strokeWidth={1.5} />;
                }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent runs table */}
      {(history?.data ?? []).length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">Recent QC Runs</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                {['Date', 'Level', 'Expected', 'Actual', 'CV%', 'Status', 'Flags'].map((h: any) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.data.slice(-20).reverse().map((r: any) => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-sm text-slate-600">{new Date(r.runDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                  <td className="px-4 py-3"><span className="text-xs font-bold px-2 py-0.5 bg-slate-100 rounded">{r.controlLevel}</span></td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-700">{r.expectedValue}</td>
                  <td className="px-4 py-3 text-sm font-mono font-bold text-slate-900">{r.actualValue}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{r.cvPercent ? `${r.cvPercent.toFixed(1)}%` : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${r.isPass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {r.isPass ? <><CheckCircle2 className="w-3 h-3" /> Pass</> : <><AlertTriangle className="w-3 h-3" /> Fail</>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 max-w-[200px] truncate">{(r.westgardFlags ?? []).join(', ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Log QC Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Log QC Run</h2>
              <button onClick={() => setShowForm(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-5 grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Test Code *</label>
                <input className={inputCls} placeholder="CBC" value={form.testCode}
                  onChange={e => setForm(f => ({ ...f, testCode: e.target.value.toUpperCase() }))} />
              </div>
              <div>
                <label className={labelCls}>Analyser ID</label>
                <input className={inputCls} placeholder="Sysmex-01" value={form.analyserId} onChange={setF('analyserId')} />
              </div>
              <div>
                <label className={labelCls}>Lot Number</label>
                <input className={inputCls} placeholder="LOT-2024-001" value={form.lotNumber} onChange={setF('lotNumber')} />
              </div>
              <div>
                <label className={labelCls}>Control Level</label>
                <select className={inputCls} value={form.controlLevel} onChange={setF('controlLevel')}>
                  <option value="NORMAL">Normal</option>
                  <option value="ABNORMAL">Abnormal</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Expected Value *</label>
                <input className={inputCls} placeholder="5.0" type="number" step="any" value={form.expectedValue} onChange={setF('expectedValue')} />
              </div>
              <div>
                <label className={labelCls}>Actual Value *</label>
                <input className={inputCls} placeholder="4.9" type="number" step="any" value={form.actualValue} onChange={setF('actualValue')} />
              </div>
              <div>
                <label className={labelCls}>Mean (optional)</label>
                <input className={inputCls} placeholder="Auto-calculated" type="number" step="any" value={form.mean} onChange={setF('mean')} />
              </div>
              <div>
                <label className={labelCls}>SD (optional)</label>
                <input className={inputCls} placeholder="Auto-calculated" type="number" step="any" value={form.sd} onChange={setF('sd')} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Run Date *</label>
                <input className={inputCls} type="date" value={form.runDate} onChange={setF('runDate')} />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 text-sm">Cancel</button>
              <button onClick={submitQc} disabled={saving}
                className="flex-[2] flex items-center justify-center gap-2 py-3 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 text-sm"
                style={{ background: NAVY }}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
                Submit QC Run
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function QCPage() {
  return (
    <Suspense fallback={<div className="animate-pulse space-y-4">{Array.from({length:3}).map((_,i) => <div key={i} className="bg-slate-200 rounded-2xl h-24"/>)}</div>}>
      <QCPageInner />
    </Suspense>
  );
}
