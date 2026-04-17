'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Zap, X, ArrowRight } from 'lucide-react';

interface UpgradePayload {
  message: string;
  currentTier: string;
  requiredTier: string;
  feature?: string;
  upgradeUrl: string;
}

/**
 * Global listener for tier-upgrade events dispatched by the api.ts interceptor.
 * Renders a contextual modal any time a tenant hits a tier-gated endpoint.
 *
 * Usage: mount once at the diagnostic portal root (diagnostic/layout.tsx).
 */
export default function TierUpgradeModal() {
  const [payload, setPayload] = useState<UpgradePayload | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<UpgradePayload>;
      setPayload(ce.detail);
    };
    window.addEventListener('hospibot:tier-upgrade-required', handler);
    return () => window.removeEventListener('hospibot:tier-upgrade-required', handler);
  }, []);

  if (!payload) return null;

  const tierLabel = payload.requiredTier.charAt(0).toUpperCase() + payload.requiredTier.slice(1);
  const prettyFeature = payload.feature
    ? payload.feature.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : 'This feature';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={() => setPayload(null)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        {/* Header with gradient */}
        <div
          className="relative p-6 text-white"
          style={{
            background: payload.requiredTier === 'enterprise'
              ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
              : payload.requiredTier === 'large'
                ? 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)'
                : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          }}
        >
          <button
            onClick={() => setPayload(null)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.2)' }}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
            style={{ background: 'rgba(255,255,255,0.25)' }}
          >
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-1">{tierLabel} Plan Feature</h3>
          <p className="text-sm opacity-90">{prettyFeature} requires an upgrade</p>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm text-slate-700 leading-relaxed mb-4">
            {payload.message}
          </p>

          <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
            <div className="flex items-center justify-between text-xs">
              <div>
                <p className="text-slate-500 font-semibold mb-1">CURRENT PLAN</p>
                <p className="text-slate-900 font-bold capitalize">
                  {payload.currentTier === 'none' ? 'Trial' : payload.currentTier}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <div className="text-right">
                <p className="text-slate-500 font-semibold mb-1">REQUIRED</p>
                <p className="font-bold" style={{
                  color: payload.requiredTier === 'enterprise' ? '#D97706'
                    : payload.requiredTier === 'large' ? '#6D28D9'
                    : '#059669',
                }}>
                  {tierLabel}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setPayload(null)}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Maybe Later
            </button>
            <Link
              href={payload.upgradeUrl}
              onClick={() => setPayload(null)}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white text-center transition-opacity hover:opacity-90"
              style={{
                background: payload.requiredTier === 'enterprise'
                  ? 'linear-gradient(135deg, #F59E0B, #D97706)'
                  : payload.requiredTier === 'large'
                    ? 'linear-gradient(135deg, #8B5CF6, #6D28D9)'
                    : 'linear-gradient(135deg, #10B981, #059669)',
              }}
            >
              Upgrade to {tierLabel} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
