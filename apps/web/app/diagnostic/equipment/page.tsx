'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Settings, Plus, X, Loader2, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

const NAVY = '#1E3A5F';
const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/10 outline-none transition-all placeholder:text-slate-400';
const labelCls = 'block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide';

const EVENT_COLORS: Record<string, string> = {
  BREAKDOWN:    'bg-red-100 text-red-700',
  MAINTENANCE:  'bg-amber-100 text-amber-700',
  CALIBRATION:  'bg-blue-100 text-blue-700',
  QC:           'bg-purple-100 text-purple-700',
  INSTALLATION: 'bg-green-100 text-green-700',
};

function AddLogModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    equipmentName: '', model: '', serialNumber: '', department: '',
    eventType: 'CALIBRATION', eventDate: new Date().toISOString().split('T')[0],
    description: '', downtimeHours: '', nextCalibration: '', certificateUrl: '',
  });
  const [saving, setSaving] = useState(false);
  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.equipmentName || !form.eventType) { toast.error('Equipment name and event type required'); return; }
    setSaving(true);
    try {
      await api.post('/diagnostic/equipment', form).catch(() =>
        api.post('/analytics/equipment-log', form)
      );
      toast.success('Equipment log entry saved');
      onSaved(); onClose();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-slate-900">Log Equipment Event</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelCls}>Equipment Name *</label>
            <input className={inputCls} placeholder="Sysmex XN-550, ADVIA 2120i, Architect i2000…" value={form.equipmentName} onChange={setF('equipmentName')} />
          </div>
          <div><label className={labelCls}>Model</label><input className={inputCls} placeholder="XN-550" value={form.model} onChange={setF('model')} /></div>
          <div><label className={labelCls}>Serial Number</label><input className={inputCls} placeholder="SN-12345" value={form.serialNumber} onChange={setF('serialNumber')} /></div>
          <div><label className={labelCls}>Department</label>
            <select className={inputCls} value={form.department} onChange={setF('department')}>
              <option value="">Select</option>
              {['Haematology','Biochemistry','Microbiology','Immunology','Radiology','General'].map((d: any) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
          <div><label className={labelCls}>Event Type *</label>
            <select className={inputCls} value={form.eventType} onChange={setF('eventType')}>
              <option value="CALIBRATION">Calibration</option>
              <option value="MAINTENANCE">Preventive Maintenance</option>
              <option value="BREAKDOWN">Breakdown</option>
              <option value="QC">QC Run</option>
              <option value="INSTALLATION">Installation / Upgrade</option>
            </select>
          </div>
          <div><label className={labelCls}>Event Date *</label><input className={inputCls} type="date" value={form.eventDate} onChange={setF('eventDate')} /></div>
          <div><label className={labelCls}>Downtime (hours)</label><input className={inputCls} type="number" step="0.5" placeholder="0" value={form.downtimeHours} onChange={setF('downtimeHours')} /></div>
          <div><label className={labelCls}>Next Calibration Due</label><input className={inputCls} type="date" value={form.nextCalibration} onChange={setF('nextCalibration')} /></div>
          <div><label className={labelCls}>Certificate URL</label><input className={inputCls} placeholder="https://..." value={form.certificateUrl} onChange={setF('certificateUrl')} /></div>
          <div className="col-span-2"><label className={labelCls}>Description / Notes</label>
            <textarea className={`${inputCls} resize-none`} rows={3} placeholder="Describe what was done, any issues found, parts replaced…" value={form.description} onChange={setF('description')} />
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl text-sm">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-[2] flex items-center justify-center gap-2 py-3 text-white font-bold rounded-xl text-sm hover:opacity-90 disabled:opacity-50"
            style={{ background: NAVY }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Save Log Entry
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EquipmentPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/diagnostic/equipment').catch(() => ({ data: [] }));
      setLogs(res.data ?? []);
    } finally { setLoading(false); }
  }, [refreshKey]);

  useEffect(() => { load(); }, [load]);

  const filtered = filter ? logs.filter((l: any) => l.eventType === filter) : logs;

  // Find equipment with upcoming calibrations
  const upcoming = logs.filter((l: any) =>
    l.nextCalibration && new Date(l.nextCalibration) < new Date(Date.now() + 30 * 86_400_000)
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Equipment Log</h1>
          <p className="text-sm text-slate-500">NABL compliance — calibration, maintenance & breakdown records</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setRefreshKey(k => k + 1)} className="p-2.5 text-slate-500 border border-slate-200 bg-white rounded-xl hover:bg-slate-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-2 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:opacity-90"
            style={{ background: NAVY }}>
            <Plus className="w-4 h-4" /> Log Event
          </button>
        </div>
      </div>

      {/* Upcoming calibrations alert */}
      {upcoming.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-900">
              {upcoming.length} equipment calibration{upcoming.length > 1 ? 's' : ''} due within 30 days
            </p>
            <p className="text-xs text-amber-600">
              {upcoming.map((u: any) => u.equipmentName).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Event type filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {['', 'CALIBRATION', 'MAINTENANCE', 'BREAKDOWN', 'QC', 'INSTALLATION'].map((e: any) => (
          <button key={e} onClick={() => setFilter(e)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              filter === e ? 'text-white border-transparent' : 'bg-white border-slate-200 text-slate-600'
            }`}
            style={filter === e ? { background: NAVY } : {}}>
            {e || 'All'} ({!e ? logs.length : logs.filter((l: any) => l.eventType === e).length})
          </button>
        ))}
      </div>

      {/* Log table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-16" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
          <Settings className="w-10 h-10 mx-auto mb-3 text-slate-200" />
          <p className="font-semibold text-slate-500">No equipment logs yet</p>
          <p className="text-sm mt-1">Log calibrations, maintenance and breakdowns for NABL compliance</p>
          <button onClick={() => setAdding(true)}
            className="mt-4 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:opacity-90 mx-auto flex items-center gap-2"
            style={{ background: NAVY }}>
            <Plus className="w-4 h-4" /> Log First Event
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                {['Equipment', 'Event', 'Date', 'Department', 'Downtime', 'Next Cal.', 'Notes'].map((h: any) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((log: any) => {
                const calDue = log.nextCalibration ? new Date(log.nextCalibration) : null;
                const calOverdue = calDue && calDue < new Date();
                const calSoon = calDue && !calOverdue && calDue < new Date(Date.now() + 30 * 86_400_000);
                return (
                  <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-slate-900">{log.equipmentName}</p>
                      {log.model && <p className="text-xs text-slate-400">{log.model} {log.serialNumber ? `· ${log.serialNumber}` : ''}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${EVENT_COLORS[log.eventType] ?? 'bg-slate-100 text-slate-600'}`}>
                        {log.eventType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {log.eventDate ? new Date(log.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{log.department || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {log.downtimeHours ? `${log.downtimeHours}h` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {calDue ? (
                        <span className={`text-xs font-semibold ${calOverdue ? 'text-red-600' : calSoon ? 'text-amber-600' : 'text-slate-600'}`}>
                          {calOverdue ? '⚠ ' : calSoon ? '⏰ ' : ''}{calDue.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[150px] truncate">{log.description || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {adding && <AddLogModal onClose={() => setAdding(false)} onSaved={() => setRefreshKey(k => k + 1)} />}
    </div>
  );
}
