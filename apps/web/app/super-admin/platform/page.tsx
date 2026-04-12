'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, Image as ImageIcon, Save, RefreshCw, CheckCircle2, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { api } from '@/lib/api';

interface Assets {
  logoUrl: string;
  logoAlt: string;
  faviconUrl?: string;
  tagline: string;
}

const inputClass = "w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0D7C66] focus:ring-2 focus:ring-[#0D7C66]/10 outline-none transition-all";

export default function PlatformAssetsPage() {
  const [assets, setAssets]   = useState<Assets | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get('/portal/assets')
      .then(r => { setAssets(r.data); setPreview(r.data.logoUrl); })
      .catch(() => toast.error('Failed to load assets'))
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
      setAssets(a => a ? { ...a, logoUrl: reader.result as string } : a);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!assets) return;
    setSaving(true);
    try {
      await api.patch('/portal/assets', {
        logoUrl: assets.logoUrl,
        logoAlt: assets.logoAlt,
        tagline: assets.tagline,
      });
      setSaved(true);
      toast.success('Platform assets updated! Logo change is now live across all portals.');
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-2xl">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-20" />
        ))}
      </div>
    );
  }

  if (!assets) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Assets</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Logo, tagline and favicon — changes apply instantly across all 7 portals
          </p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-[#0D7C66] hover:bg-[#0A5E4F] text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-60">
          {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Logo section */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
        <h3 className="font-semibold text-slate-900">Platform Logo</h3>

        {/* Current logo preview */}
        <div className="flex items-center gap-6">
          <div className="w-40 h-16 rounded-xl border-2 border-dashed border-slate-200 bg-slate-900 flex items-center justify-center p-2 overflow-hidden">
            {preview ? (
              <img src={preview} alt="Logo preview" className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="text-slate-500 text-xs text-center">No logo</div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900 mb-1">Current Logo</p>
            <p className="text-xs text-slate-400 mb-3">Recommended: PNG with transparent background, min 300×100px</p>
            <div className="flex items-center gap-3">
              <button onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 text-sm font-medium text-[#0D7C66] border border-[#0D7C66] px-3 py-1.5 rounded-xl hover:bg-[#E8F5F0] transition-colors">
                <Upload className="w-3.5 h-3.5" /> Upload New Logo
              </button>
              <button onClick={() => { setPreview('/hospibot-logo.png'); setAssets(a => a ? { ...a, logoUrl: '/hospibot-logo.png' } : a); }}
                className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 transition-colors">
                <RefreshCw className="w-3 h-3" /> Reset to Default
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Logo Alt Text</label>
          <input className={inputClass} value={assets.logoAlt}
            onChange={e => setAssets(a => a ? { ...a, logoAlt: e.target.value } : a)}
            placeholder="HospiBot" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Tagline</label>
          <input className={inputClass} value={assets.tagline}
            onChange={e => setAssets(a => a ? { ...a, tagline: e.target.value } : a)}
            placeholder="Connect 24*7..." />
          <p className="text-xs text-slate-400 mt-1">Shown below the logo on registration and login pages</p>
        </div>
      </div>

      {/* Preview across portals */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Preview — How It Looks on Login Pages</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { slug: 'clinical',   color: '#0D7C66', bg: '#063A31' },
            { slug: 'diagnostic', color: '#1E3A5F', bg: '#0F1E33' },
            { slug: 'pharmacy',   color: '#166534', bg: '#0D3B20' },
            { slug: 'homecare',   color: '#6B21A8', bg: '#3B0764' },
          ].map(p => (
            <div key={p.slug} className="rounded-xl overflow-hidden border border-slate-200">
              <div className="px-3 py-3 flex items-center gap-2" style={{ background: p.bg }}>
                {preview ? (
                  <img src={preview} alt="Logo" className="h-6 object-contain max-w-[80px]" />
                ) : (
                  <span className="text-white text-xs font-bold">HospiBot</span>
                )}
              </div>
              <div className="px-3 py-2 bg-white">
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: p.color }}>{p.slug} Portal</p>
                <p className="text-[10px] text-slate-400">{assets.tagline}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3">All 7 portals use the same logo. Save to apply.</p>
      </div>

      {/* Important note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex items-start gap-3">
        <Eye className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
        <div>
          <p className="font-semibold">Instant update across all portals</p>
          <p className="text-xs mt-0.5 text-amber-700">
            Once saved, the new logo appears on all 7 portal login pages, all tenant dashboards, 
            and the registration wizard immediately — no redeployment needed.
          </p>
        </div>
      </div>
    </div>
  );
}
