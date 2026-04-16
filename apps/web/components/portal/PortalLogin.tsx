'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
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
  const { isAuthenticated, loadFromStorage, logout, tenant } = useAuthStore();

  // On mount: load auth state. If already logged into THIS portal, redirect to dashboard.
  // If logged into a different portal, clear state so a fresh login can happen.
  useEffect(() => {
    loadFromStorage();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const storedPortalSlug = tenant?.portalFamily?.slug
      ?? localStorage.getItem('hospibot_portal_slug');
    if (storedPortalSlug === portalSlug) {
      // Already logged in to THIS portal — go straight to dashboard
      router.push(`/${portalSlug}/dashboard`);
    } else if (storedPortalSlug) {
      // Logged in to a DIFFERENT portal — clear stale auth so fresh login works
      logout();
    }
  }, [isAuthenticated, portalSlug, tenant]);
  const { setAuth } = useAuthStore();
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
      // If tenant has a portalFamily set, it must match this portal's slug
      const tenantPortalSlug = tenant?.portalFamily?.slug;
      if (tenantPortalSlug && tenantPortalSlug !== portalSlug) {
        toast.error(
          `This account belongs to the ${PORTAL_LABELS[tenantPortalSlug] || tenantPortalSlug} portal. ` +
          `Please sign in at the correct portal.`
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
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: `linear-gradient(145deg, ${theme.loginBg} 0%, ${theme.loginGradient} 100%)` }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10" style={{ background: '#fff' }} />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full opacity-10" style={{ background: '#fff' }} />

        <div className="relative">
          <Image src={assets?.logoUrl || '/hospibot-logo.png'} alt={assets?.logoAlt || 'HospiBot'}
            width={160} height={54} className="object-contain mb-8" />
          <h2 className="text-3xl font-bold text-white mb-2">{label}</h2>
          <p className="text-white/70 text-base mb-10">{assets?.tagline || 'Connect 24*7...'}</p>

          <ul className="space-y-4">
            {bullets.map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-white/90 text-sm">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: theme.accentColor }}>
                  <ArrowRight className="w-3 h-3 text-white" />
                </div>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-white/40 text-xs">© {new Date().getFullYear()} HospiBot. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <Image src={assets?.logoUrl || '/hospibot-logo.png'} alt="HospiBot" width={120} height={40} className="object-contain" />
          </div>

          {/* Portal badge */}
          <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-6"
            style={{ background: theme.primaryLight, color: theme.primaryColor }}>
            {label}
          </span>

          <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h2>
          <p className="text-slate-500 text-sm mb-8">Sign in to your {label.replace(' Portal', '')} dashboard</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
              <input type="email" required
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 outline-none transition-all placeholder:text-slate-400"
                style={{ '--tw-ring-color': theme.primaryColor } as any}
                onFocus={e => e.target.style.borderColor = theme.primaryColor}
                onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                placeholder="admin@yourfacility.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} required
                  className="w-full px-4 py-3 pr-10 text-sm rounded-xl border border-slate-200 bg-slate-50 outline-none transition-all placeholder:text-slate-400"
                  onFocus={e => e.target.style.borderColor = theme.primaryColor}
                  onBlur={e => e.target.style.borderColor = '#E2E8F0'}
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
              <a href={`/register/${portalSlug}`} className="font-semibold hover:underline" style={{ color: theme.primaryColor }}>
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
