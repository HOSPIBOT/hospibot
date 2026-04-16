'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Package, Plus, X, AlertTriangle, CheckCircle2, Loader2, RefreshCw, Search } from 'lucide-react';

const NAVY = '#1E3A5F';
const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/10 outline-none transition-all placeholder:text-slate-400';
const labelCls = 'block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide';

function AlertBadge({ alerts }: { alerts: string[] }) {
  if (!alerts.length) return null;
  const isExpired = alerts.includes('EXPIRED');
  const isExpiring = alerts.includes('EXPIRING_SOON');
  const isLow = alerts.includes('LOW_STOCK');
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {isExpired && <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">EXPIRED</span>}
      {isExpiring && !isExpired && <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">EXPIRING SOON</span>}
      {isLow && <span className="text-[10px] font-bold bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">LOW STOCK</span>}
    </div>
  );
}

function StockBar({ current, min }: { current: number; min: number }) {
  const pct = min > 0 ? Math.min(current / (min * 2) * 100, 100) : 100;
  const color = current <= min ? '#EF4444' : current <= min * 1.5 ? '#F59E0B' : '#10B981';
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>Stock: <span className="font-bold text-slate-900">{current}</span></span>
        <span>Min: {min}</span>
      </div>
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function AdjustModal({ reagent, onClose, onSaved }: { reagent: any; onClose: () => void; onSaved: () => void }) {
  const [type, setType] = useState<'IN' | 'OUT' | 'DISCARD' | 'ADJUST'>('IN');
  const [qty, setQty] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!qty) { toast.error('Enter quantity'); return; }
    setSaving(true);
    try {
      await api.patch(`/diagnostic/inventory/reagents/${reagent.id}/stock`, {
        txType: type, quantity: parseFloat(qty), notes,
      });
      toast.success('Stock updated');
      onSaved(); onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Adjust Stock</h2>
            <p className="text-sm text-slate-500">{reagent.name}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className={labelCls}>Transaction Type</label>
            <div className="grid grid-cols-4 gap-2">
              {(['IN', 'OUT', 'DISCARD', 'ADJUST'] as const).map((t: any) => (
                <button key={t} onClick={() => setType(t)}
                  className={`py-2 text-xs font-bold rounded-xl border-2 transition-all ${type === t ? 'border-[#1E3A5F] bg-[#1E3A5F]/5 text-[#1E3A5F]' : 'border-slate-200 text-slate-600'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Quantity ({reagent.unit ?? 'units'})</label>
            <input className={inputCls} type="number" step="any" placeholder="e.g. 50" value={qty} onChange={e => setQty(e.target.value)} autoFocus />
          </div>
          <div>
            <label className={labelCls}>Notes (optional)</label>
            <input className={inputCls} placeholder="Batch received, reason for discard…" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <div className="bg-slate-50 rounded-xl px-4 py-3">
            <p className="text-xs text-slate-500">Current stock: <span className="font-bold text-slate-900">{reagent.currentStock} {reagent.unit ?? 'units'}</span></p>
            {qty && (
              <p className="text-xs text-slate-500 mt-0.5">New stock: <span className="font-bold text-slate-900">
                {type === 'IN' || type === 'ADJUST' ? reagent.currentStock + parseFloat(qty || '0') : reagent.currentStock - parseFloat(qty || '0')} {reagent.unit ?? 'units'}
              </span></p>
            )}
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl text-sm">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-[2] flex items-center justify-center gap-2 py-3 text-white font-bold rounded-xl text-sm hover:opacity-90 disabled:opacity-50"
            style={{ background: NAVY }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function AddReagentModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: '', manufacturer: '', lotNumber: '', expiryDate: '', storageTemp: '2-8°C', currentStock: '', minStockLevel: '', unit: 'units', supplier: '' });
  const [saving, setSaving] = useState(false);
  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.name || !form.currentStock || !form.minStockLevel) { toast.error('Name, stock, and minimum level required'); return; }
    setSaving(true);
    try {
      await api.post('/diagnostic/inventory/reagents', { ...form, currentStock: parseFloat(form.currentStock), minStockLevel: parseFloat(form.minStockLevel) });
      toast.success('Reagent added');
      onSaved(); onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-slate-900">Add Reagent</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className={labelCls}>Reagent Name *</label><input className={inputCls} placeholder="HbA1c Reagent Kit" value={form.name} onChange={setF('name')} /></div>
          <div><label className={labelCls}>Manufacturer</label><input className={inputCls} placeholder="Bio-Rad, Roche…" value={form.manufacturer} onChange={setF('manufacturer')} /></div>
          <div><label className={labelCls}>Lot Number</label><input className={inputCls} placeholder="LOT-2024-001" value={form.lotNumber} onChange={setF('lotNumber')} /></div>
          <div><label className={labelCls}>Expiry Date</label><input className={inputCls} type="date" value={form.expiryDate} onChange={setF('expiryDate')} /></div>
          <div><label className={labelCls}>Storage Temp</label>
            <select className={inputCls} value={form.storageTemp} onChange={setF('storageTemp')}>
              <option>2-8°C</option><option>-20°C</option><option>-80°C</option><option>RT (15-25°C)</option>
            </select>
          </div>
          <div><label className={labelCls}>Current Stock *</label><input className={inputCls} type="number" step="any" placeholder="100" value={form.currentStock} onChange={setF('currentStock')} /></div>
          <div><label className={labelCls}>Min Stock Level *</label><input className={inputCls} type="number" step="any" placeholder="20" value={form.minStockLevel} onChange={setF('minStockLevel')} /></div>
          <div><label className={labelCls}>Unit</label><input className={inputCls} placeholder="tests, vials, kits…" value={form.unit} onChange={setF('unit')} /></div>
          <div><label className={labelCls}>Supplier</label><input className={inputCls} placeholder="Transasia, Beckman…" value={form.supplier} onChange={setF('supplier')} /></div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl text-sm">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-[2] flex items-center justify-center gap-2 py-3 text-white font-bold rounded-xl text-sm hover:opacity-90 disabled:opacity-50"
            style={{ background: NAVY }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Add Reagent
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const [reagents, setReagents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'alerts'>('all');
  const [adjusting, setAdjusting] = useState<any>(null);
  const [adding, setAdding] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/diagnostic/inventory/reagents');
      setReagents(res.data ?? []);
    } finally { setLoading(false); }
  }, [refreshKey]);

  useEffect(() => { load(); }, [load]);

  const filtered = reagents.filter((r: any) => {
    const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || (r.lotNumber ?? '').includes(search);
    const matchFilter = filter === 'all' || (filter === 'alerts' && r.alerts?.length > 0);
    return matchSearch && matchFilter;
  });

  const alertCount = reagents.filter((r: any) => r.alerts?.length > 0).length;
  const expiredCount = reagents.filter((r: any) => r.alerts?.includes('EXPIRED')).length;
  const lowStockCount = reagents.filter((r: any) => r.alerts?.includes('LOW_STOCK')).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reagent Inventory</h1>
          <p className="text-sm text-slate-500">{reagents.length} reagents · {alertCount} alerts</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setRefreshKey(k => k + 1)} className="p-2.5 text-slate-500 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-2 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
            style={{ background: NAVY }}>
            <Plus className="w-4 h-4" /> Add Reagent
          </button>
        </div>
      </div>

      {/* Alert summary */}
      {alertCount > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Alerts', value: alertCount, color: '#F59E0B', icon: AlertTriangle },
            { label: 'Expired', value: expiredCount, color: '#EF4444', icon: X },
            { label: 'Low Stock', value: lowStockCount, color: '#F97316', icon: Package },
          ].map((s: any) => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15` }}>
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-xl font-black" style={{ color: s.value > 0 ? s.color : '#94A3B8' }}>{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className={`${inputCls} pl-10`} placeholder="Search reagents…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'alerts'] as const).map((f: any) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all ${filter === f ? 'text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
              style={filter === f ? { background: NAVY } : {}}>
              {f === 'all' ? 'All' : `Alerts (${alertCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Reagent grid */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-40" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center text-slate-400">
          <Package className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="font-semibold text-slate-500">No reagents found</p>
          <p className="text-sm mt-1">Add your first reagent to start tracking inventory</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((r: any) => (
            <div key={r.id} className={`bg-white rounded-2xl border p-5 hover:shadow-md transition-all ${r.alerts?.includes('EXPIRED') ? 'border-red-200' : r.alerts?.length ? 'border-orange-200' : 'border-slate-100'}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm truncate">{r.name}</p>
                  <p className="text-xs text-slate-400">{r.manufacturer ?? 'Unknown'}</p>
                </div>
                {r.alerts?.length > 0 && (
                  <AlertTriangle className={`w-4 h-4 flex-shrink-0 ml-2 ${r.alerts?.includes('EXPIRED') ? 'text-red-500' : 'text-orange-500'}`} />
                )}
              </div>

              <AlertBadge alerts={r.alerts ?? []} />
              <StockBar current={r.currentStock} min={r.minStockLevel} />

              <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                {r.storageTemp && <p>🌡️ {r.storageTemp}</p>}
                {r.expiryDate && (
                  <p className={r.isExpired ? 'text-red-600 font-semibold' : r.expiringInDays != null && r.expiringInDays <= 30 ? 'text-orange-600' : ''}>
                    📅 Exp: {new Date(r.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {r.expiringInDays != null && r.expiringInDays > 0 && ` (${r.expiringInDays}d)`}
                  </p>
                )}
                {r.lotNumber && <p>🔖 {r.lotNumber}</p>}
              </div>

              <button onClick={() => setAdjusting(r)}
                className="w-full mt-4 py-2 text-xs font-bold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors">
                Adjust Stock
              </button>
            </div>
          ))}
        </div>
      )}

      {adjusting && <AdjustModal reagent={adjusting} onClose={() => setAdjusting(null)} onSaved={() => setRefreshKey(k => k + 1)} />}
      {adding && <AddReagentModal onClose={() => setAdding(false)} onSaved={() => setRefreshKey(k => k + 1)} />}
    </div>
  );
}
