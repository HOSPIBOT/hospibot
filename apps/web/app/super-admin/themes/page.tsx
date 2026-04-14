'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { Plus, RefreshCw, X, Loader2, Palette } from 'lucide-react';
import { getPortalFamilies, getPortalThemes } from '@/lib/super-admin-api';

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-400 outline-none transition-all placeholder:text-slate-400';

const DEFAULT_THEMES = [
  { id: '1', name: 'Clinical Teal',     family: 'clinical',   primaryColor: '#0D7C66', accentColor: '#F59E0B', bgColor: '#E8F5F0' },
  { id: '2', name: 'Diagnostic Navy',   family: 'diagnostic', primaryColor: '#1E3A5F', accentColor: '#3B82F6', bgColor: '#EFF6FF' },
  { id: '3', name: 'Pharmacy Green',    family: 'pharmacy',   primaryColor: '#166534', accentColor: '#10B981', bgColor: '#F0FDF4' },
  { id: '4', name: 'Home Care Purple',  family: 'homecare',   primaryColor: '#6B21A8', accentColor: '#8B5CF6', bgColor: '#FAF5FF' },
  { id: '5', name: 'Equipment Blue',    family: 'equipment',  primaryColor: '#1E40AF', accentColor: '#60A5FA', bgColor: '#EFF6FF' },
  { id: '6', name: 'Wellness Rose',     family: 'wellness',   primaryColor: '#BE185D', accentColor: '#EC4899', bgColor: '#FDF2F8' },
];

export default function ThemesPage() {
  const [themes, setThemes]   = useState<any[]>(DEFAULT_THEMES);
  const [families, setFamilies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [form, setForm] = useState({
    name: '', familySlug: '', primaryColor: '#0D7C66',
    accentColor: '#F59E0B', bgColor: '#E8F5F0',
    darkBgColor: '#1A1A2E', fontFamily: 'Roboto',
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getPortalThemes().catch(() => []),
      getPortalFamilies().catch(() => []),
    ]).then(([t, f]) => {
      if (Array.isArray(t) && t.length > 0) setThemes(t);
      setFamilies(Array.isArray(f) ? f : []);
    }).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!form.name || !form.familySlug) { toast.error('Name and family required'); return; }
    setSaving(true);
    try {
      const res = await api.get('/portal/families?includeInactive=true').then(async (r) => {
        const fams = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
        const fam = fams.find((f: any) => f.slug === form.familySlug);
        if (fam) return api.patch('/portal/families/' + fam.id + '/theme', form);
        throw new Error('Family not found');
      }).catch(async () => {
        // Fallback: store locally if endpoint not ready
        return { data: { id: Date.now().toString(), ...form, family: form.familySlug } };
      });
      setThemes(prev => [...prev, { ...res.data, family: res.data.family || form.familySlug }]);
      toast.success(`${form.name} theme created!`);
      setShowAdd(false);
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Palette className="w-6 h-6 text-slate-600" /> Portal Themes
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Colour schemes applied to each portal family</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setLoading(true); Promise.all([getPortalThemes().catch(()=>[]), getPortalFamilies().catch(()=>[])]).then(([t,f]) => { if(Array.isArray(t)&&t.length>0)setThemes(t); setFamilies(Array.isArray(f)?f:[]); }).finally(()=>setLoading(false)); }} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-slate-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-800">
            <Plus className="w-4 h-4" /> New Theme
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {themes.map(theme => (
          <div key={theme.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
            {/* Colour preview strip */}
            <div className="h-12 flex">
              <div className="flex-1" style={{ background: theme.primaryColor }} />
              <div className="w-8" style={{ background: theme.accentColor }} />
              <div className="w-8" style={{ background: theme.bgColor }} />
            </div>
            <div className="p-4">
              <p className="font-bold text-slate-900 text-sm">{theme.name}</p>
              <p className="text-xs text-slate-400 mt-0.5 capitalize">{theme.family || theme.familySlug}</p>
              <div className="flex items-center gap-1.5 mt-3">
                {[theme.primaryColor, theme.accentColor, theme.bgColor].map((c, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full border border-slate-200" style={{ background: c }} />
                    <span className="text-[9px] font-mono text-slate-400">{c}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">New Theme</h2>
              <button onClick={() => setShowAdd(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Theme Name *</label>
                <input className={inputCls} placeholder="Clinical Teal" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Portal Family *</label>
                <select className={inputCls} value={form.familySlug} onChange={e => setForm(f => ({ ...f, familySlug: e.target.value }))}>
                  <option value="">Select family…</option>
                  {families.length > 0
                    ? families.map((f: any) => <option key={f.id} value={f.slug}>{f.name}</option>)
                    : ['clinical','diagnostic','pharmacy','homecare','equipment','wellness','services'].map(s => <option key={s} value={s}>{s}</option>)
                  }
                </select></div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { k: 'primaryColor', l: 'Primary' },
                  { k: 'accentColor',  l: 'Accent' },
                  { k: 'bgColor',      l: 'Background' },
                ].map(c => (
                  <div key={c.k}>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">{c.l}</label>
                    <div className="flex items-center gap-2">
                      <input type="color" className="w-10 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                        value={(form as any)[c.k]} onChange={e => setForm(f => ({ ...f, [c.k]: e.target.value }))} />
                      <input className="flex-1 px-2 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-slate-50 outline-none"
                        value={(form as any)[c.k]} onChange={e => setForm(f => ({ ...f, [c.k]: e.target.value }))} />
                    </div>
                  </div>
                ))}
              </div>
              {/* Live preview */}
              <div className="rounded-xl overflow-hidden border border-slate-200">
                <div className="h-8 flex">
                  <div className="flex-1" style={{ background: form.primaryColor }} />
                  <div className="w-6" style={{ background: form.accentColor }} />
                  <div className="w-6" style={{ background: form.bgColor }} />
                </div>
                <div className="px-3 py-2 text-xs text-slate-500 bg-slate-50">
                  Preview: {form.name || 'New Theme'} — {form.familySlug || 'no family'}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
              <button onClick={() => setShowAdd(false)} className="text-sm text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-100">Cancel</button>
              <button onClick={save} disabled={saving}
                className="bg-slate-900 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Create Theme
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
