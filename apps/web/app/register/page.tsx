'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Stethoscope, FlaskConical, Pill, Home, Wrench, Heart, Briefcase,
  ArrowRight, ChevronRight,
} from 'lucide-react';
import { getRegistrationContext, type PortalFamily, type PlatformAssets, FALLBACK_THEMES } from '@/lib/portal/portal-types';

// ── Icon map (Lucide icon name → component) ──────────────────────────────────
const ICON_MAP: Record<string, any> = {
  Stethoscope, FlaskConical, Pill, Home, Wrench, Heart, Briefcase,
};

// ── Fallback families (shown while API loads) ──────────────────────────────────
const FALLBACK_FAMILIES = [
  { id: '1', slug: 'clinical',   name: 'Clinical',   icon: 'Stethoscope', description: 'Doctors, clinics, hospitals, specialty centers and all direct patient care providers',       sortOrder: 1 },
  { id: '2', slug: 'diagnostic', name: 'Diagnostic', icon: 'FlaskConical', description: 'Pathology labs, radiology centers, scan centers and all diagnostic service providers',        sortOrder: 2 },
  { id: '3', slug: 'pharmacy',   name: 'Pharmacy',   icon: 'Pill',         description: 'Medical stores, online pharmacies, pharma distributors and medicine retailers',               sortOrder: 3 },
  { id: '4', slug: 'homecare',   name: 'Home Care',  icon: 'Home',         description: 'Home nursing, ambulance services, elder care and patient transport providers',               sortOrder: 4 },
  { id: '5', slug: 'equipment',  name: 'Equipment',  icon: 'Wrench',       description: 'Medical equipment suppliers, surgical instruments and consumable distributors',               sortOrder: 5 },
  { id: '6', slug: 'wellness',   name: 'Wellness',   icon: 'Heart',        description: 'Fitness centers, nutrition clinics, yoga studios and holistic health providers',             sortOrder: 6 },
  { id: '7', slug: 'services',   name: 'Services',   icon: 'Briefcase',    description: 'Staffing agencies, billing services, medical tourism and healthcare support services',       sortOrder: 7 },
];

function PortalCard({
  family, theme, selected, onClick,
}: {
  family: any;
  theme: { primaryColor: string; primaryLight: string; accentColor: string };
  selected: boolean;
  onClick: () => void;
}) {
  const IconComponent = ICON_MAP[family.icon] || Briefcase;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl border-2 p-5 transition-all duration-200 group relative overflow-hidden ${
        selected
          ? 'shadow-lg scale-[1.02]'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-md bg-white hover:scale-[1.01]'
      }`}
      style={selected ? {
        borderColor: theme.primaryColor,
        background: `linear-gradient(135deg, ${theme.primaryLight} 0%, #ffffff 60%)`,
        boxShadow: `0 8px 30px ${theme.primaryColor}25`,
      } : {}}
    >
      {/* Decorative background circle */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-[0.08] transition-opacity group-hover:opacity-[0.12]"
        style={{ background: theme.primaryColor }}
      />

      <div className="flex items-start gap-4 relative">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
          style={{
            background: selected ? theme.primaryColor : `${theme.primaryColor}15`,
            color: selected ? '#ffffff' : theme.primaryColor,
          }}
        >
          <IconComponent className="w-6 h-6" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3
              className="text-base font-bold transition-colors"
              style={{ color: selected ? theme.primaryColor : '#1E293B' }}
            >
              {family.name}
            </h3>
            <ChevronRight
              className="w-4 h-4 flex-shrink-0 transition-all"
              style={{ color: selected ? theme.primaryColor : '#94A3B8' }}
            />
          </div>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed line-clamp-2">
            {family.description}
          </p>
        </div>
      </div>

      {/* Selected indicator */}
      {selected && (
        <div
          className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl"
          style={{ background: theme.primaryColor }}
        />
      )}
    </button>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [families, setFamilies] = useState<any[]>(FALLBACK_FAMILIES);
  const [assets, setAssets] = useState<PlatformAssets | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRegistrationContext()
      .then(({ families: f, assets: a }) => {
        if (f?.length) setFamilies(f);
        setAssets(a);
      })
      .catch(() => { /* use fallback */ })
      .finally(() => setLoading(false));
  }, []);

  const handleContinue = () => {
    if (selected) router.push(`/register/${selected}`);
  };

  const selectedFamily = families.find(f => f.slug === selected);
  const selectedTheme = selected ? (FALLBACK_THEMES[selected] || FALLBACK_THEMES.clinical) : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/hospibot-logo.png" alt="HospiBot" width={120} height={40} className="object-contain" />
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>Already registered?</span>
            <a href="/auth/login" className="text-[#0D7C66] font-semibold hover:underline">Sign In</a>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-3">
          <div className="flex items-center gap-2">
            {['Choose Category', 'Select Type', 'Your Details', 'Admin Account', 'Pick a Plan'].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 text-xs font-medium ${i === 0 ? 'text-[#0D7C66]' : 'text-slate-400'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? 'bg-[#0D7C66] text-white' : 'bg-slate-200 text-slate-500'}`}>{i + 1}</span>
                  <span className="hidden sm:block">{step}</span>
                </div>
                {i < 4 && <div className="w-6 h-px bg-slate-200" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome to HospiBot
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            {assets?.tagline || 'Connect 24*7...'} — Choose your category to get started
          </p>
        </div>

        {/* Portal family grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {families.map((family) => {
            const theme = FALLBACK_THEMES[family.slug] || FALLBACK_THEMES.clinical;
            return (
              <PortalCard
                key={family.slug}
                family={family}
                theme={theme}
                selected={selected === family.slug}
                onClick={() => setSelected(family.slug)}
              />
            );
          })}
        </div>

        {/* Continue button */}
        <div className="flex items-center justify-center">
          <button
            onClick={handleContinue}
            disabled={!selected}
            className="flex items-center gap-3 px-8 py-3.5 rounded-2xl text-white font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
            style={selectedTheme ? {
              background: `linear-gradient(135deg, ${selectedTheme.primaryColor}, ${selectedTheme.primaryDark})`,
              boxShadow: `0 8px 25px ${selectedTheme.primaryColor}40`,
            } : { background: '#0D7C66' }}
          >
            {selected
              ? `Continue with ${selectedFamily?.name} Portal`
              : 'Select a category to continue'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          By continuing you agree to HospiBot's{' '}
          <a href="#" className="underline">Terms of Service</a> and{' '}
          <a href="#" className="underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
