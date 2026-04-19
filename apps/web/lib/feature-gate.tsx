'use client';

/**
 * Feature Gate — tier-based access control for diagnostic feature pages.
 *
 * Usage in any feature page:
 *
 *   import { useFeatureGate, FeatureLockedBlock } from '@/lib/feature-gate';
 *
 *   export default function DispatchPage() {
 *     const gate = useFeatureGate('dispatch');
 *     if (!gate.allowed) return <FeatureLockedBlock gate={gate} />;
 *     // ... render the page
 *   }
 *
 * The gate checks both:
 *   1. TIER — does the tenant's plan meet the feature's minTier?
 *   2. SUBTYPE — is this feature relevant to the tenant's subtype?
 *
 * If either fails, FeatureLockedBlock renders a branded upgrade prompt
 * instead of the page content.
 */

import { useAuthStore } from '@/lib/store';
import { isFeatureEnabled, DIAGNOSTIC_FEATURES } from '@/lib/portal-feature-flags';
import type { LabTier } from '@/lib/diagnostic-tiers';
import Link from 'next/link';
import { Lock, ArrowUp, ArrowLeft } from 'lucide-react';

const TIER_LABELS: Record<string, string> = {
  small: 'Starter', medium: 'Growth', large: 'Professional', enterprise: 'Enterprise',
};

const TIER_ORDER: LabTier[] = ['small', 'medium', 'large', 'enterprise'];

export interface FeatureGateResult {
  allowed: boolean;
  reason: 'tier' | 'subtype' | null;
  featureKey: string;
  currentTier: LabTier | undefined;
  requiredTier: LabTier | undefined;
  requiredTierLabel: string;
  currentTierLabel: string;
}

export function useFeatureGate(featureKey: string): FeatureGateResult {
  const tenant = useAuthStore((s) => s.tenant);
  const subtype = tenant?.subtypeSlug || (tenant as any)?.subType?.slug;
  const tier = tenant?.labTier as LabTier | undefined;

  const gate = DIAGNOSTIC_FEATURES[featureKey];
  const allowed = isFeatureEnabled(featureKey, subtype, tier);

  let reason: 'tier' | 'subtype' | null = null;
  if (!allowed && gate) {
    // Determine which check failed
    const tierOk = !tier ? false : TIER_ORDER.indexOf(tier) >= TIER_ORDER.indexOf(gate.minTier);
    reason = tierOk ? 'subtype' : 'tier';
  }

  return {
    allowed,
    reason,
    featureKey,
    currentTier: tier,
    requiredTier: gate?.minTier,
    requiredTierLabel: TIER_LABELS[gate?.minTier ?? ''] ?? 'Higher',
    currentTierLabel: TIER_LABELS[tier ?? ''] ?? 'Unknown',
  };
}

/**
 * Full-page upgrade prompt — renders instead of the feature page when
 * the tenant's tier doesn't include this feature.
 */
export function FeatureLockedBlock({ gate }: { gate: FeatureGateResult }) {
  const isTierLock = gate.reason === 'tier';

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mt-12 text-center">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-amber-50 flex items-center justify-center">
          <Lock className="w-7 h-7 text-amber-600" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-3">
          {isTierLock
            ? `This feature requires the ${gate.requiredTierLabel} plan`
            : 'This feature is not available for your lab type'}
        </h1>

        <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto leading-relaxed">
          {isTierLock
            ? `You're currently on the ${gate.currentTierLabel} plan. Upgrade to ${gate.requiredTierLabel} to unlock this feature along with additional capabilities.`
            : 'This feature is designed for a different type of diagnostic operation and isn\'t applicable to your setup.'}
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link href="/diagnostic/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>

          {isTierLock && (
            <Link href="/diagnostic/settings"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0D7C66] hover:bg-[#0A5E4F] text-white text-sm font-bold transition-colors">
              <ArrowUp className="w-4 h-4" />
              Upgrade to {gate.requiredTierLabel}
            </Link>
          )}
        </div>

        <p className="mt-8 text-xs text-slate-400">
          Feature: <code className="px-1 py-0.5 bg-slate-100 rounded text-slate-600">{gate.featureKey}</code>
          {' · '}Current plan: {gate.currentTierLabel}
          {gate.requiredTier && <>{' · '}Required: {gate.requiredTierLabel}</>}
        </p>
      </div>
    </div>
  );
}
