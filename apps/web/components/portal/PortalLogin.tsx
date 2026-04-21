'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import {
  FALLBACK_THEMES, PORTAL_LABELS, getPlatformAssets,
  type PortalTheme, type PlatformAssets,
} from '@/lib/portal/portal-types';

interface PortalLoginProps {
  portalSlug: string;
  features?: string[]; // bullet points shown on left panel
}

const DEFAULT_FEATURES: Record<string, string[]> = {
  clinical:   ['WhatsApp-first patient engagement', 'Appointments, EMR & billing in one place', 'Revenue engine for follow-ups', 'Multi-branch & multi-doctor support'],
  diagnostic: ['Lab report delivery via WhatsApp', 'Test orders & sample collection tracking', 'NABL-ready report templates', 'Home collection scheduling'],
  pharmacy:   ['Inventory & drug expiry tracking', 'Prescription-linked dispensing', 'Home delivery order management', 'Pharma distributor integrations'],
  homecare:   ['Staff dispatch & GPS tracking', 'Home visit scheduling', 'Care plan management', 'Ambulance request & tracking'],
  equipment:  ['Product catalogue & B2B orders', 'AMC & service scheduling', 'Bulk order management', 'Delivery & installation tracking'],
  wellness:   ['Class & membership management', 'Diet & meal plan tracking', 'Product catalogue & e-commerce', 'Subscription management'],
  services:   ['Contract & SLA management', 'Staff & roster management', 'Service ticket tracking', 'Billing & invoice management'],
};

export default function PortalLogin({ portalSlug, features }: PortalLoginProps) {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  // On mount: clear any stale auth silently so login always starts fresh
  useEffect(() => {
    const staleSlug = localStorage.getItem('hospibot_portal_slug');
    if (staleSlug && staleSlug !== portalSlug) {
      // Different portal — wipe localStorage so no stale data interferes
      ['hospibot_access_token','hospibot_refresh_token',
       'hospibot_user','hospibot_tenant','hospibot_portal_slug'
      ].forEach(k => localStorage.removeItem(k));
    }
  }, [portalSlug]);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<PlatformAssets | null>(null);

  const theme: PortalTheme = FALLBACK_THEMES[portalSlug] || FALLBACK_THEMES.clinical;
  const label = PORTAL_LABELS[portalSlug] || 'HospiBot';
  const bullets = features || DEFAULT_FEATURES[portalSlug] || DEFAULT_FEATURES.clinical;

  useEffect(() => {
    getPlatformAssets().then(setAssets).catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      const user = res.data.user;
      const tenant = res.data.tenant;

      // ── Security Rule 1: Super Admin MUST use /auth/login, never portal pages ──
      if (user.role === 'SUPER_ADMIN') {
        toast.error('Super Admin accounts must sign in at the main login page.');
        setLoading(false);
        return;
      }

      // ── Security Rule 2: User must belong to this portal family ──
      // Check portalFamilySlug (derived from FK, settings, or tenant type on backend)
      const tenantPortalSlug = tenant?.portalFamilySlug || tenant?.portalFamily?.slug || null;
      if (tenantPortalSlug && tenantPortalSlug !== portalSlug) {
        toast.error(
          `This account belongs to the ${PORTAL_LABELS[tenantPortalSlug] || tenantPortalSlug} portal. ` +
          `Please sign in at /${tenantPortalSlug}/login instead.`
        );
        setLoading(false);
        return;
      }

      // ── Security Rule 3: Must be a tenant user (has tenantId) ──
      if (!tenant || !user.id) {
        toast.error('Invalid account configuration. Please contact support.');
        setLoading(false);
        return;
      }

      setAuth(user, tenant, res.data.accessToken, res.data.refreshToken);
      toast.success(`Welcome back, ${user.firstName}!`);
      router.push(`/${portalSlug}/dashboard`);

    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — hero */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between relative overflow-hidden"
        style={{ background: `linear-gradient(160deg, ${theme.loginBg} 0%, ${theme.loginGradient} 50%, ${theme.loginBg}DD 100%)` }}
      >
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-[0.07]" style={{ background: '#fff' }} />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full opacity-[0.05]" style={{ background: '#fff' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.06]"
          style={{ background: `radial-gradient(circle, ${theme.accentColor}, transparent 70%)` }} />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative p-12 flex-1 flex flex-col justify-center">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span className="text-white font-extrabold text-lg">H</span>
            </div>
            <span className="text-white text-xl font-bold tracking-tight">HospiBot</span>
          </div>

          {/* Portal name badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 self-start"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <div className="w-2 h-2 rounded-full" style={{ background: theme.accentColor }} />
            <span className="text-white/90 text-xs font-semibold tracking-wide">{label.toUpperCase()}</span>
          </div>

          <h2 className="text-4xl font-extrabold text-white mb-4 leading-tight tracking-tight">
            Welcome to your<br />{label.replace(' Portal', '')} dashboard
          </h2>
          <p className="text-white/50 text-base mb-10 max-w-sm leading-relaxed">
            {assets?.tagline || 'Manage your practice, engage patients, and grow revenue — all from one platform.'}
          </p>

          <ul className="space-y-4">
            {bullets.map((item, i) => (
              <li key={i} className="flex items-center gap-3.5 text-white/85 text-sm">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6l2.5 2.5 4.5-4.5" stroke={theme.accentColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="font-medium">{item}</span>
              </li>
            ))}
          </ul>

          {/* Stats row */}
          <div className="flex gap-8 mt-12 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            {[{ v: '98%', l: 'WA open rate' }, { v: '60%', l: 'Less no-shows' }, { v: '<7 days', l: 'Go live' }].map((s, i) => (
              <div key={i}>
                <div className="text-white text-xl font-extrabold">{s.v}</div>
                <div className="text-white/35 text-xs mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative px-12 pb-6">
          <p className="text-white/25 text-xs">© {new Date().getFullYear()} HospiBot. HIPAA & DPDPA compliant.</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <Image src={assets?.logoUrl || '/hospibot-logo.png'} alt="HospiBot" width={120} height={40} className="object-contain" />
          </div>

          {/* Portal badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg mb-6"
            style={{ background: theme.primaryLight, border: `1px solid ${theme.primaryColor}20` }}>
            <div className="w-2 h-2 rounded-full" style={{ background: theme.primaryColor }} />
            <span className="text-xs font-bold" style={{ color: theme.primaryColor }}>{label}</span>
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 mb-1 tracking-tight">Welcome back</h2>
          <p className="text-slate-500 text-sm mb-8">Sign in to your {label.replace(' Portal', '')} dashboard</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
              <input type="email" required
                className="w-full px-4 py-3.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 outline-none transition-all placeholder:text-slate-400"
                style={{ '--tw-ring-color': theme.primaryColor } as any}
                onFocus={e => { e.target.style.borderColor = theme.primaryColor; e.target.style.boxShadow = `0 0 0 3px ${theme.primaryColor}15`; e.target.style.background = '#fff'; }}
                onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = ''; }}
                placeholder="admin@yourfacility.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} required
                  className="w-full px-4 py-3.5 pr-10 text-sm rounded-xl border border-slate-200 bg-slate-50/50 outline-none transition-all placeholder:text-slate-400"
                  onFocus={e => { e.target.style.borderColor = theme.primaryColor; e.target.style.boxShadow = `0 0 0 3px ${theme.primaryColor}15`; e.target.style.background = '#fff'; }}
                  onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = ''; }}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-60 shadow-md hover:shadow-lg"
              style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.primaryDark})` }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center space-y-3">
            <p className="text-sm text-slate-500">
              Not on HospiBot yet?{' '}
              <a href={`/register?portal=${portalSlug}`} className="font-semibold hover:underline" style={{ color: theme.primaryColor }}>
                Register your facility
              </a>
            </p>
            <p className="text-xs text-slate-400">
              Looking for a different portal?{' '}
              <a href="/register" className="underline text-slate-500">Choose category</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
