'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Building2, Plus, Trash2, RefreshCw, X, Loader2 } from 'lucide-react';

const TYPE_COLORS: Record<string, string> = {
  clinical:        'bg-teal-100 text-teal-700',
  ancillary:       'bg-blue-100 text-blue-700',
  administrative:  'bg-slate-100 text-slate-600',
};

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] outline-none transition-all placeholder:text-slate-400';

export default function DepartmentsPage() {
  const [depts, setDepts]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm]       = useState({ name: '', code: '', type: 'clinical' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/doctors/departments', { params: { limit: 100 } });
      setDepts(Array.isArray(res.data) ? res.data : res.data?.data ?? []);
    } catch { toast.error('Failed to load departments'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.name) { toast.error('Department name required'); return; }
    setSaving(true);
    try {
      await api.post('/doctors/departments', form);
      toast.success(`${form.name} department created!`);
      setShowAdd(false);
      setForm({ name: '', code: '', type: 'clinical' });
      load();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const remove = async (id: string, name: string) => {
    setDeleting(id);
    try {
      await api.delete(`/doctors/departments/${id}`);
      toast.success(`${name} removed`);
      setDepts(p => p.filter(d => d.id !== id));
    } catch { toast.error('Failed to remove'); }
    finally { setDeleting(null); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#0D7C66]" /> Departments
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{depts.length} active departments</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-[#0D7C66] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#0A5E4F]">
            <Plus className="w-4 h-4" /> Add Department
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">{Array.from({length:6}).map((_,i)=><div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-24"/>)}</div>
      ) : depts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
          <Building2 className="w-12 h-12 text-slate-200 mx-auto mb-3"/>
          <p className="text-slate-400 text-sm font-medium">No departments yet</p>
          <p className="text-slate-300 text-xs mt-1 mb-5">Create departments like Cardiology, Radiology, Pharmacy, etc.</p>
          <button onClick={()=>setShowAdd(true)} className="bg-[#0D7C66] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#0A5E4F] mx-auto flex items-center gap-2 justify-center">
            <Plus className="w-4 h-4"/> Add First Department
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {depts.map(d => (
            <div key={d.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-slate-900">{d.name}</p>
                  {d.code && <p className="text-xs font-mono text-slate-400 mt-0.5">{d.code}</p>}
                </div>
                <button onClick={() => remove(d.id, d.name)} disabled={deleting === d.id}
                  className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                  {deleting === d.id ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Trash2 className="w-3.5 h-3.5"/>}
                </button>
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${TYPE_COLORS[d.type] || 'bg-slate-100 text-slate-600'}`}>
                {d.type || 'clinical'}
              </span>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Add Department</h2>
              <button onClick={()=>setShowAdd(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4"/></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Name *</label>
                <input className={inputCls} placeholder="Cardiology, Radiology, OPD…" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} autoFocus/></div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Code</label>
                <input className={inputCls} placeholder="CARD, RAD, OPD" value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value.toUpperCase()}))}/></div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Type</label>
                <select className={inputCls} value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                  <option value="clinical">Clinical</option>
                  <option value="ancillary">Ancillary</option>
                  <option value="administrative">Administrative</option>
                </select></div>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
              <button onClick={()=>setShowAdd(false)} className="text-sm text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-100">Cancel</button>
              <button onClick={save} disabled={saving}
                className="bg-[#0D7C66] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#0A5E4F] disabled:opacity-50 flex items-center gap-2">
                {saving&&<Loader2 className="w-4 h-4 animate-spin"/>} Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
