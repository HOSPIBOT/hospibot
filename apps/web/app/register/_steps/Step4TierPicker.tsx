'use client';

import { useResolvedTiers, TierFromApi } from '../_hooks/useResolvedTiers';

interface Props {
  familySlug: string;
  subtypeSlug: string | null;
  value: string | null;
  billingCycle: 'monthly' | 'annual';
  onChange: (tierKey: string) => void;
  onBillingCycleChange?: (cycle: 'monthly' | 'annual') => void;
}

function formatPrice(paise: number | null): string {
  if (!paise) return 'Custom';
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

export default function Step4TierPicker({ familySlug, subtypeSlug, value, billingCycle, onChange, onBillingCycleChange }: Props) {
  const { tiers, loading } = useResolvedTiers({ familySlug, subtypeSlug });

  if (loading || !tiers) return <div className="text-center text-sm text-gray-400 py-12">Loading plans...</div>;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-center text-gray-900 mb-1">
        Choose your scale of operations
      </h1>
      <p className="text-sm text-gray-500 text-center mb-4">Select the plan that matches your lab's daily volume</p>

      {onBillingCycleChange && (
        <div className="flex justify-center gap-1 mb-6 bg-gray-100 rounded-xl p-1 max-w-xs mx-auto">
          {(['monthly', 'annual'] as const).map(c => (
            <button key={c} onClick={() => onBillingCycleChange(c)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${billingCycle === c ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500'}`}>
              {c === 'monthly' ? 'Monthly' : 'Annual (save 17%)'}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {tiers.map(t => {
          const price = billingCycle === 'annual' ? t.priceAnnual : t.priceMonthly;
          const monthly = t.priceMonthly ? Math.round(t.priceMonthly / 100) : null;
          const annual = t.priceAnnual ? Math.round(t.priceAnnual / 100 / 12) : null;
          const displayPrice = billingCycle === 'annual' ? (annual ? `₹${annual.toLocaleString('en-IN')}` : 'Custom') : (monthly ? `₹${monthly.toLocaleString('en-IN')}` : 'Custom');
          const isPop = t.badge === 'Most Popular';

          return (
            <div key={t.tierKey} onClick={() => onChange(t.tierKey)}
              className={`relative p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:border-[#0D7C66]
                ${value === t.tierKey ? 'border-2 border-[#0D7C66] bg-[#E8F5F0] shadow-sm' : isPop ? 'border-amber-400 bg-white' : 'border-gray-200 bg-white'}`}>
              {isPop && (
                <div className="absolute -top-px right-4 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-b-lg">POPULAR</div>
              )}
              <div className="font-bold text-base text-gray-900">{t.displayName}</div>
              <div className="text-2xl font-bold text-[#0D7C66] my-1.5">
                {displayPrice} <span className="text-xs font-normal text-gray-400">/month</span>
              </div>
              <div className="text-[11px] text-gray-500 mb-3 leading-relaxed">
                {t.dailyVolumeMin}–{t.dailyVolumeMax || '∞'} samples/day · {t.staffAllowed} staff · {t.branchesAllowed} branch{t.branchesAllowed === 1 ? '' : 'es'}
              </div>
              <p className="text-[11px] text-gray-400 leading-snug">{t.tagline}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
