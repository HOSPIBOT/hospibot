'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, RefreshCw, X, Loader2, Tag, Layers, Settings2 } from 'lucide-react';
import Link from 'next/link';
import { getPortalFamilies, getPortalSubTypes } from '@/lib/super-admin-api';

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-400 outline-none transition-all placeholder:text-slate-400';

const FAMILY_COLORS: Record<string, string> = {
  clinical:   '#0D7C66', diagnostic: '#1E3A5F', pharmacy: '#166534',
  homecare:   '#6B21A8', equipment:  '#1E40AF', wellness: '#BE185D',
  services:   '#334155',
};

export default function SubTypesPage() {
  const [subtypes, setSubtypes]   = useState<any[]>([]);
  const [families, setFamilies]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showAdd, setShowAdd]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [familyFilter, setFamily] = useState('');
  const [form, setForm]           = useState({
    name: '', slug: '', familyId: '', description: '',
    icon: '', defaultFeatureFlags: '{}',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [st, fam] = await Promise.all([
        getPortalSubTypes().catch(() => ({ data: [] })),
        getPortalFamilies().catch(() => ({ data: [] })),
      ]);
      setSubtypes((st as any).data ?? st ?? []);
      setFamilies((fam as any).data ?? fam ?? []);
    } catch { toast.error('Failed to load sub-types'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.name || !form.slug || !form.familyId) { toast.error('Name, slug, and family required'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/v1/portal/subtypes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        body: JSON.stringify({ ...form, featureFlags: JSON.parse(form.defaultFeatureFlags || '{}') }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(`${form.name} sub-type created!`);
      setShowAdd(false); load();
    } catch (err: any) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const filtered = familyFilter ? subtypes.filter((s: any) => s.familyId === familyFilter || s.portalFamilyId === familyFilter) : subtypes;
  const groupedByFamily: Record<string, any[]> = {};
  filtered.forEach((s: any) => {
    const key = s.portalFamily?.slug || s.familySlug || 'other';
    if (!groupedByFamily[key]) groupedByFamily[key] = [];
    groupedByFamily[key].push(s);
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-slate-600" /> Portal Sub-Types
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{subtypes.length} sub-types across {families.length} portal families</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-slate-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-800">
            <Plus className="w-4 h-4" /> New Sub-Type
          </button>
        </div>
      </div>

      {/* Family filter */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFamily('')}
          className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${!familyFilter ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:border-slate-400'}`}>
          All Families
        </button>
        {families.map((f: any) => (
          <button key={f.id} onClick={() => setFamily(f.id)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${familyFilter === f.id ? 'text-white border-transparent' : 'border-slate-200 text-slate-600 hover:border-slate-400'}`}
            style={familyFilter === f.id ? { background: FAMILY_COLORS[f.slug] || '#334155' } : {}}>
            {f.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">{Array.from({length:6}).map((_,i) => <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-28" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center">
          <Layers className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No sub-types found</p>
        </div>
      ) : (
        Object.entries(groupedByFamily).map(([familySlug, items]) => {
          const color = FAMILY_COLORS[familySlug] || '#334155';
          return (
            <div key={familySlug} className="space-y-3">
              <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: color }} />
                {familySlug.replace('_', ' ')} ({items.length})
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {items.map((st: any) => (
                  <div key={st.id} className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{st.name}</p>
                        <p className="text-xs font-mono text-slate-400 mt-0.5">{st.slug}</p>
                      </div>
                      {st.icon && <span className="text-lg">{st.icon}</span>}
                    </div>
                    {st.description && <p className="text-xs text-slate-500 line-clamp-2">{st.description}</p>}
                    <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: color }}>
                        {familySlug}
                      </span>
                      <Link
                        href={`/super-admin/subtypes/${st.slug}/features`}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-teal-600 transition-colors"
                      >
                        <Settings2 className="w-3 h-3" /> Features
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">New Portal Sub-Type</h2>
              <button onClick={() => setShowAdd(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-5 grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Name *</label>
                <input className={inputCls} placeholder="Multi-Speciality Clinic" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Slug *</label>
                <input className={inputCls} placeholder="multi-speciality-clinic" value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s/g,'_') }))} /></div>
              <div className="col-span-2"><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Portal Family *</label>
                <select className={inputCls} value={form.familyId} onChange={e => setForm(f => ({ ...f, familyId: e.target.value }))}>
                  <option value="">Select family…</option>
                  {families.map((fam: any) => <option key={fam.id} value={fam.id}>{fam.name}</option>)}
                </select></div>
              <div className="col-span-2"><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Description</label>
                <input className={inputCls} placeholder="Brief description of this facility type"
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Icon (emoji)</label>
                <input className={inputCls} placeholder="🏥" value={form.icon}
                  onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} /></div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Default Feature Flags (JSON)</label>
                <input className={inputCls} placeholder='{"appointments":true}' value={form.defaultFeatureFlags}
                  onChange={e => setForm(f => ({ ...f, defaultFeatureFlags: e.target.value }))} /></div>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
              <button onClick={() => setShowAdd(false)} className="text-sm text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-100">Cancel</button>
              <button onClick={save} disabled={saving}
                className="bg-slate-900 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Create Sub-Type
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
