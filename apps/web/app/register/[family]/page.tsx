'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Search } from 'lucide-react';
import {
  getFamilyBySlug, type PortalFamily, type TenantSubType,
  FALLBACK_THEMES, PORTAL_LABELS,
} from '@/lib/portal/portal-types';

function SubTypeCard({
  subType, selected, primaryColor, primaryLight, onClick,
}: {
  subType: TenantSubType; selected: boolean;
  primaryColor: string; primaryLight: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border-2 px-4 py-3 transition-all duration-150 text-sm font-medium ${
        selected ? 'shadow-md' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
      }`}
      style={selected ? {
        borderColor: primaryColor,
        background: primaryLight,
        color: primaryColor,
      } : {}}
    >
      <div className="flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0 transition-colors"
          style={{ background: selected ? primaryColor : '#CBD5E1' }}
        />
        <span className={selected ? '' : 'text-slate-700'}>{subType.name}</span>
      </div>
    </button>
  );
}

function Skeleton() {
  return <div className="animate-pulse bg-slate-200 rounded-xl h-12" />;
}

export default function RegisterFamilyPage() {
  const { family: familySlug } = useParams<{ family: string }>();
  const router = useRouter();

  const [family, setFamily] = useState<PortalFamily | null>(null);
  const [selected, setSelected] = useState<TenantSubType | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const theme = FALLBACK_THEMES[familySlug] || FALLBACK_THEMES.clinical;

  useEffect(() => {
    getFamilyBySlug(familySlug)
      .then(setFamily)
      .catch(() => { /* handle */ })
      .finally(() => setLoading(false));
  }, [familySlug]);

  const filtered = (family?.subTypes ?? []).filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleContinue = () => {
    if (selected) router.push(`/register/${familySlug}/${selected.slug}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Image src="/hospibot-logo.png" alt="HospiBot" width={120} height={40} className="object-contain" />
          <div className="text-sm text-slate-500">
            Already registered? <a href="/auth/login" className="font-semibold" style={{ color: theme.primaryColor }}>Sign In</a>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-3">
          <div className="flex items-center gap-2">
            {['Choose Category', 'Select Type', 'Your Details', 'Admin Account', 'Pick a Plan'].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 text-xs font-medium ${i <= 1 ? 'text-slate-900' : 'text-slate-400'}`}>
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={i === 0 ? { background: theme.primaryColor, color: '#fff' }
                      : i === 1 ? { border: `2px solid ${theme.primaryColor}`, color: theme.primaryColor }
                      : { background: '#E2E8F0', color: '#94A3B8' }}>
                    {i === 0 ? '✓' : i + 1}
                  </span>
                  <span className="hidden sm:block">{step}</span>
                </div>
                {i < 4 && <div className="w-6 h-px bg-slate-200" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Back */}
        <button onClick={() => router.push('/register')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to categories
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{ background: theme.primaryColor }}>
              {(family?.name || familySlug)[0]}
            </div>
            <span className="text-sm font-semibold" style={{ color: theme.primaryColor }}>
              {PORTAL_LABELS[familySlug] || familySlug}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">What best describes your facility?</h1>
          <p className="text-slate-500 mt-1">
            {family?.description || 'Select the type that matches your healthcare service'}
          </p>
        </div>

        {/* Search */}
        {(family?.subTypes.length ?? 0) > 8 && (
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 mb-5 w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400" />
            <input className="bg-transparent text-sm outline-none flex-1 placeholder:text-slate-400"
              placeholder="Search your facility type..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        )}

        {/* Sub-type grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
          {loading
            ? Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} />)
            : filtered.map(st => (
              <SubTypeCard
                key={st.slug}
                subType={st}
                selected={selected?.slug === st.slug}
                primaryColor={theme.primaryColor}
                primaryLight={theme.primaryLight}
                onClick={() => setSelected(st)}
              />
            ))}
        </div>

        {filtered.length === 0 && !loading && (
          <div className="text-center py-8 text-slate-400 text-sm">
            No results for "{search}". <button className="underline text-slate-500" onClick={() => setSearch('')}>Clear search</button>
          </div>
        )}

        {/* Selection summary + Continue */}
        {selected && (
          <div className="flex items-center justify-between p-4 rounded-2xl border mb-4"
            style={{ borderColor: theme.primaryColor, background: theme.primaryLight }}>
            <div>
              <p className="text-xs text-slate-500 font-medium">Selected</p>
              <p className="text-sm font-bold" style={{ color: theme.primaryColor }}>{selected.name}</p>
            </div>
            <button onClick={handleContinue}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 shadow-md"
              style={{ background: theme.primaryColor }}>
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {!selected && (
          <div className="text-center">
            <button disabled
              className="px-8 py-3.5 rounded-2xl text-white text-sm font-semibold opacity-40 cursor-not-allowed"
              style={{ background: theme.primaryColor }}>
              Select a type to continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
