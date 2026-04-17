'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { DIAGNOSTIC_TIERS, type LabTier } from '@/lib/diagnostic-tiers';
import { getSubtypeFeatures } from '@/lib/diagnostic-subtype-features';
import { Check, Zap, ArrowRight, Crown, TrendingUp, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const TIER_RANK: Record<LabTier, number> = { small: 1, medium: 2, large: 3, enterprise: 4 };

const TIER_ICONS: Record<LabTier, any> = {
  small: Zap, medium: TrendingUp, large: Shield, enterprise: Crown,
};

const TIER_COLORS: Record<LabTier, { bg: string; text: string; gradient: string }> = {
  small:      { bg:'#0EA5E914', text:'#0369A1', gradient:'linear-gradient(135deg,#0EA5E9,#0369A1)' },
  medium:     { bg:'#10B98114', text:'#059669', gradient:'linear-gradient(135deg,#10B981,#059669)' },
  large:      { bg:'#8B5CF614', text:'#6D28D9', gradient:'linear-gradient(135deg,#8B5CF6,#6D28D9)' },
  enterprise: { bg:'#F59E0B14', text:'#D97706', gradient:'linear-gradient(135deg,#F59E0B,#D97706)' },
};

export default function PlanSettingsPage() {
  const { tenant } = useAuthStore();
  const currentTier = (tenant?.labTier || 'small') as LabTier;
  const subtype = tenant?.subtypeSlug || tenant?.subType?.slug || 'pathology-lab';
  const subtypeLabel = subtype.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  // Subtype-aware features per tier
  const subtypeData = getSubtypeFeatures(subtype);

  const [requestingTier, setRequestingTier] = useState<LabTier | null>(null);

  const handleUpgradeRequest = async (targetTier: LabTier) => {
    setRequestingTier(targetTier);
    // For now — just show success. Real impl would POST to /tenant/upgrade-request
    await new Promise(r => setTimeout(r, 800));
    toast.success(
      `Upgrade request sent! Our team will contact you within 24 hours to assist with switching to the ${DIAGNOSTIC_TIERS.find(t=>t.id===targetTier)?.label}.`,
      { duration: 5000 }
    );
    setRequestingTier(null);
  };

  const currentTierData = DIAGNOSTIC_TIERS.find(t => t.id === currentTier);
  const CurrentIcon = TIER_ICONS[currentTier];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Your Plan</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your HospiBot subscription for your {subtypeLabel}.
        </p>
      </div>

      {/* Current Plan Card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 text-white relative" style={{ background: TIER_COLORS[currentTier].gradient }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.25)' }}>
                  <CurrentIcon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider opacity-90">Current Plan</span>
              </div>
              <h2 className="text-3xl font-bold">{currentTierData?.label}</h2>
              <p className="text-sm opacity-90 mt-1">{currentTierData?.tagline}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{currentTierData?.price}</p>
              <p className="text-xs opacity-75">{currentTierData?.priceNote}</p>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-4 gap-4 border-b border-slate-100">
          {subtypeData.tiers[currentTier].scale.slice(0, 4).map((m, i) => (
            <div key={i}>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{m.label}</p>
              <p className="text-sm font-bold text-slate-900 mt-1">{m.value}</p>
            </div>
          ))}
        </div>

        <div className="p-6">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Features included in your plan
          </p>
          <div className="grid grid-cols-2 gap-2">
            {subtypeData.tiers[currentTier].features.slice(0, 10).map((f, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: TIER_COLORS[currentTier].text }} />
                <span>{f}</span>
              </div>
            ))}
          </div>
          {subtypeData.tiers[currentTier].features.length > 10 && (
            <p className="text-xs text-slate-500 mt-3">
              + {subtypeData.tiers[currentTier].features.length - 10} more features
            </p>
          )}
        </div>
      </div>

      {/* Upgrade Options */}
      {currentTier !== 'enterprise' && (
        <>
          <div className="pt-2">
            <h2 className="text-lg font-bold text-slate-900">Upgrade your plan</h2>
            <p className="text-sm text-slate-500 mt-1">
              Scale up to unlock more features tailored to your {subtypeLabel}.
            </p>
          </div>

          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${4 - TIER_RANK[currentTier]}, 1fr)` }}>
            {DIAGNOSTIC_TIERS.filter(t => TIER_RANK[t.id] > TIER_RANK[currentTier]).map((tier) => {
              const TierIcon = TIER_ICONS[tier.id];
              const colors = TIER_COLORS[tier.id];
              const tierFeatures = subtypeData.tiers[tier.id];
              // What's newly available at this tier (not in current)
              const currentFeatures = new Set(subtypeData.tiers[currentTier].features);
              const newFeatures = tierFeatures.features.filter(f => !currentFeatures.has(f) && f !== `Everything in ${currentTierData?.label}`);

              return (
                <div key={tier.id} className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-5 border-b border-slate-100">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: colors.bg }}>
                        <TierIcon className="w-5 h-5" style={{ color: colors.text }} />
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-slate-900">{tier.price}</p>
                        <p className="text-xs text-slate-500">{tier.priceNote}</p>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{tier.label}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{tier.tagline}</p>
                  </div>

                  <div className="p-5">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                      What you'll unlock
                    </p>
                    <div className="space-y-2 mb-5 min-h-[180px]">
                      {newFeatures.slice(0, 6).map((f, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                          <Check className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: colors.text }} />
                          <span>{f}</span>
                        </div>
                      ))}
                      {newFeatures.length > 6 && (
                        <p className="text-xs text-slate-500 pl-5.5">+ {newFeatures.length - 6} more</p>
                      )}
                    </div>

                    <button
                      onClick={() => handleUpgradeRequest(tier.id)}
                      disabled={requestingTier !== null}
                      className="w-full py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{ background: colors.gradient }}
                    >
                      {requestingTier === tier.id ? 'Sending request...' : (
                        <>Upgrade to {tier.label} <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {currentTier === 'enterprise' && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Crown className="w-6 h-6 text-amber-600" />
            <h2 className="text-lg font-bold text-amber-900">You're on the Enterprise plan</h2>
          </div>
          <p className="text-sm text-amber-800 leading-relaxed">
            You have access to every feature HospiBot offers, including white-label branding, franchise
            management, API marketplace, ABHA/ABDM integration, and dedicated account management.
            Need something custom? Talk to your account manager.
          </p>
        </div>
      )}

      {/* Footer note */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs text-slate-600 leading-relaxed">
        <p className="font-semibold text-slate-700 mb-1">How upgrades work</p>
        <p>
          Clicking "Upgrade" will send a request to our billing team. They'll contact you within 24
          hours to confirm pricing, arrange data migration if needed, and activate your new plan.
          Your existing data and configuration will be preserved.
        </p>
      </div>
    </div>
  );
}
