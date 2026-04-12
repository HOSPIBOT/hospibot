'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Edit3, ToggleLeft, ToggleRight, ChevronDown, ChevronRight,
  Palette, Save, X, RefreshCw, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { FALLBACK_THEMES } from '@/lib/portal/portal-types';

interface SubType { id: string; name: string; slug: string; icon?: string; isActive: boolean; sortOrder: number; featureFlags: Record<string, boolean>; }
interface Theme { primaryColor: string; primaryDark: string; primaryLight: string; accentColor: string; sidebarBg: string; loginBg: string; loginGradient: string; }
interface Family { id: string; name: string; slug: string; description: string; icon: string; isActive: boolean; sortOrder: number; theme?: Theme; subTypes: SubType[]; _count?: { tenants: number }; }

function ColorSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-5 h-5 rounded-md border border-slate-200 flex-shrink-0" style={{ background: color }} />
      <span className="text-slate-500">{label}</span>
      <span className="font-mono text-slate-700">{color}</span>
    </div>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5" />
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
          className="flex-1 px-3 py-2 text-sm font-mono rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] outline-none" />
      </div>
    </div>
  );
}

function ThemeEditor({ family, onSave }: { family: Family; onSave: (id: string, theme: Theme) => void }) {
  const defaultTheme = FALLBACK_THEMES[family.slug] || FALLBACK_THEMES.clinical;
  const [theme, setTheme] = useState<Theme>(family.theme || defaultTheme);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof Theme) => (v: string) => setTheme(t => ({ ...t, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/portal/families/${family.id}/theme`, theme);
      onSave(family.id, theme);
      toast.success('Theme updated! All users will see the new colors on next page load.');
    } catch { toast.error('Failed to save theme'); }
    finally { setSaving(false); }
  };

  return (
    <div className="mt-4 bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><Palette className="w-4 h-4 text-slate-500" /> Theme Colors</h4>
        <div className="flex items-center gap-2">
          <button onClick={() => setTheme(family.theme || defaultTheme)}
            className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Reset
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-1.5 rounded-lg disabled:opacity-60 transition-all"
            style={{ background: theme.primaryColor }}>
            <Save className="w-3 h-3" /> {saving ? 'Saving...' : 'Save Colors'}
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-white">
        <div className="w-6 h-6 rounded" style={{ background: theme.loginBg }} />
        <div className="w-6 h-6 rounded" style={{ background: theme.primaryColor }} />
        <div className="w-6 h-6 rounded" style={{ background: theme.primaryLight }} />
        <div className="w-6 h-6 rounded" style={{ background: theme.accentColor }} />
        <div className="w-6 h-6 rounded" style={{ background: theme.sidebarBg }} />
        <span className="text-xs text-slate-400 ml-1">Live preview</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <ColorInput label="Primary Color" value={theme.primaryColor} onChange={set('primaryColor')} />
        <ColorInput label="Primary Dark" value={theme.primaryDark} onChange={set('primaryDark')} />
        <ColorInput label="Primary Light" value={theme.primaryLight} onChange={set('primaryLight')} />
        <ColorInput label="Accent Color" value={theme.accentColor} onChange={set('accentColor')} />
        <ColorInput label="Sidebar BG" value={theme.sidebarBg} onChange={set('sidebarBg')} />
        <ColorInput label="Login BG" value={theme.loginBg} onChange={set('loginBg')} />
      </div>
    </div>
  );
}

function FamilyCard({ family, onToggle, onThemeUpdate }: {
  family: Family;
  onToggle: (id: string, isActive: boolean) => void;
  onThemeUpdate: (id: string, theme: Theme) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [showAddSubtype, setShowAddSubtype] = useState(false);
  const [newSt, setNewSt] = useState({ name: '', slug: '', icon: 'Building2' });
  const [addingSubtype, setAddingSubtype] = useState(false);
  const theme = FALLBACK_THEMES[family.slug] || FALLBACK_THEMES.clinical;

  const handleAddSubtype = async () => {
    if (!newSt.name || !newSt.slug) return;
    setAddingSubtype(true);
    try {
      await api.post('/portal/subtypes', { ...newSt, portalFamilyId: family.id, featureFlags: {} });
      toast.success(`Sub-type "${newSt.name}" added to ${family.name}`);
      setShowAddSubtype(false);
      setNewSt({ name: '', slug: '', icon: 'Building2' });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add sub-type');
    } finally { setAddingSubtype(false); }
  };

  const handleToggleSubtype = async (stId: string, isActive: boolean) => {
    try {
      await api.patch(`/portal/subtypes/${stId}/toggle`, { isActive });
      toast.success(`Sub-type ${isActive ? 'enabled' : 'disabled'}`);
    } catch { toast.error('Failed to update sub-type'); }
  };

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-all ${family.isActive ? 'border-slate-100' : 'border-slate-200 opacity-70'}`}>
      {/* Family header */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold"
              style={{ background: theme.primaryColor }}>
              {family.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 text-sm">{family.name}</h3>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${family.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {family.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{family.slug} · {family.subTypes?.length ?? 0} sub-types · {family._count?.tenants ?? 0} tenants</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setShowTheme(v => !v)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 px-2.5 py-1.5 rounded-xl hover:bg-slate-50 transition-colors">
              <Palette className="w-3.5 h-3.5" /> Theme
            </button>
            <button onClick={() => onToggle(family.id, !family.isActive)}
              className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-xl border transition-colors ${family.isActive ? 'border-amber-200 text-amber-700 hover:bg-amber-50' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'}`}>
              {family.isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
              {family.isActive ? 'Disable' : 'Enable'}
            </button>
            <button onClick={() => setExpanded(v => !v)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors">
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {showTheme && <ThemeEditor family={family} onSave={onThemeUpdate} />}
      </div>

      {/* Sub-types list */}
      {expanded && (
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Sub-types ({family.subTypes?.length ?? 0})</p>
            <button onClick={() => setShowAddSubtype(v => !v)}
              className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-xl text-white transition-colors"
              style={{ background: theme.primaryColor }}>
              <Plus className="w-3 h-3" /> Add Sub-type
            </button>
          </div>

          {showAddSubtype && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 mb-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Sub-type name" value={newSt.name}
                  onChange={e => setNewSt(s => ({ ...s, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }))}
                  className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white outline-none focus:border-current" />
                <input placeholder="URL slug" value={newSt.slug}
                  onChange={e => setNewSt(s => ({ ...s, slug: e.target.value }))}
                  className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white outline-none focus:border-current font-mono" />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleAddSubtype} disabled={addingSubtype || !newSt.name}
                  className="text-xs font-semibold text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                  style={{ background: theme.primaryColor }}>
                  {addingSubtype ? 'Adding...' : 'Add'}
                </button>
                <button onClick={() => setShowAddSubtype(false)} className="text-xs text-slate-500 hover:text-slate-700">Cancel</button>
              </div>
            </div>
          )}

          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {(family.subTypes ?? []).map(st => (
              <div key={st.id} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${st.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className={`text-sm ${st.isActive ? 'text-slate-800' : 'text-slate-400 line-through'}`}>{st.name}</span>
                </div>
                <button onClick={() => handleToggleSubtype(st.id, !st.isActive)}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-all ${st.isActive ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {st.isActive ? 'Disable' : 'Enable'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PortalsManagementPage() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [newFamily, setNewFamily] = useState({ name: '', slug: '', description: '', icon: 'Briefcase' });
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/portal/families?includeInactive=true');
      setFamilies(Array.isArray(res.data) ? res.data : []);
    } catch { toast.error('Failed to load portals'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await api.patch(`/portal/families/${id}/toggle`, { isActive });
      setFamilies(f => f.map(fam => fam.id === id ? { ...fam, isActive } : fam));
      toast.success(isActive ? 'Portal enabled' : 'Portal disabled');
    } catch { toast.error('Failed to update portal'); }
  };

  const handleThemeUpdate = (id: string, theme: Theme) => {
    setFamilies(f => f.map(fam => fam.id === id ? { ...fam, theme } : fam));
  };

  const handleAddFamily = async () => {
    if (!newFamily.name || !newFamily.slug) return;
    setAdding(true);
    try {
      const res = await api.post('/portal/families', newFamily);
      setFamilies(f => [...f, { ...res.data, subTypes: [] }]);
      toast.success(`Portal family "${newFamily.name}" created`);
      setShowAddFamily(false);
      setNewFamily({ name: '', slug: '', description: '', icon: 'Briefcase' });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create portal');
    } finally { setAdding(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Portal Families & Sub-types</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage all portal categories, sub-types, and their color themes</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowAddFamily(v => !v)}
            className="flex items-center gap-2 bg-[#0D7C66] hover:bg-[#0A5E4F] text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> Add Portal Family
          </button>
        </div>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          <strong>Color changes take effect instantly.</strong> Once you save a theme, all users in that portal will see the new colors on their next page refresh.
        </p>
      </div>

      {/* Add family form */}
      {showAddFamily && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Add New Portal Family</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Name *</label>
              <input placeholder="e.g. Veterinary" value={newFamily.name}
                onChange={e => setNewFamily(n => ({ ...n, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Slug *</label>
              <input placeholder="e.g. veterinary" value={newFamily.slug}
                onChange={e => setNewFamily(n => ({ ...n, slug: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] outline-none font-mono" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Description</label>
              <input placeholder="Brief description shown on registration page" value={newFamily.description}
                onChange={e => setNewFamily(n => ({ ...n, description: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] outline-none" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleAddFamily} disabled={adding || !newFamily.name}
              className="bg-[#0D7C66] text-white text-sm font-medium px-5 py-2 rounded-xl hover:bg-[#0A5E4F] disabled:opacity-50 transition-colors">
              {adding ? 'Creating...' : 'Create Portal Family'}
            </button>
            <button onClick={() => setShowAddFamily(false)} className="text-sm text-slate-500 hover:text-slate-700">Cancel</button>
          </div>
        </div>
      )}

      {/* Family list */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-20" />
        ))}</div>
      ) : (
        <div className="space-y-3">
          {families.map(family => (
            <FamilyCard key={family.id} family={family} onToggle={handleToggle} onThemeUpdate={handleThemeUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
