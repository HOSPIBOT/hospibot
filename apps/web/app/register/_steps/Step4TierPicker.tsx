'use client';

import { useState } from 'react';
import { Check, Sparkle, ChevronDown, ChevronUp, X as XIcon } from 'lucide-react';
import { Heading, LoadingSkeleton } from './Step2GroupPicker';
import { TOKENS } from '../_lib/wizard-types';
import { useResolvedTiers, TierFromApi } from '../_hooks/useResolvedTiers';
import { getSubtypeFeatures, type SubtypeTier } from '@/lib/diagnostic-subtype-features';

interface Props {
  familySlug: string;
  subtypeSlug: string | null;
  value: 'small' | 'medium' | 'large' | 'enterprise' | null;
  billingCycle: 'monthly' | 'annual';
  onChange: (tier: 'small' | 'medium' | 'large' | 'enterprise') => void;
  onBillingCycleChange: (cycle: 'monthly' | 'annual') => void;
}

/**
 * Step 4 — Tier picker.
 *
 * Reads live pricing from /portal/tier-configs (falls back to hardcoded
 * defaults on API failure). The Super Admin can edit these prices from
 * /super-admin/plans without any code deploy — changes are reflected on
 * the next wizard load.
 *
 * The billing cycle toggle is cosmetic at the registration step — the
 * real billing lifecycle starts after the 14-day trial. But showing it
 * up-front helps the user anchor on the annual ("2 months free") value
 * which improves conversion.
 */
export default function Step4TierPicker({
  familySlug, subtypeSlug, value, billingCycle, onChange, onBillingCycleChange,
}: Props) {
  const { tiers, loading } = useResolvedTiers({ familySlug, subtypeSlug });

  // Look up subtype-specific feature data (feature descriptions, scale metrics)
  // This complements the pricing/limits from DB with domain-specific content.
  const subtypeData = subtypeSlug ? getSubtypeFeatures(subtypeSlug) : null;

  return (
    <div>
      <Heading
        title="What size is your operation?"
        subtitle={subtypeData
          ? `Pick the tier that matches your current ${subtypeData.scaleUnit}. You can upgrade anytime.`
          : 'Pick the tier that matches your current volume. You can upgrade anytime.'}
      />

      {/* Billing cycle toggle */}
      <div style={{
        display: 'inline-flex',
        background: '#fff',
        border: `1px solid ${TOKENS.border}`,
        borderRadius: 10,
        padding: 4,
        marginBottom: 28,
      }}>
        <CycleButton
          label="Monthly"
          active={billingCycle === 'monthly'}
          onClick={() => onBillingCycleChange('monthly')}
        />
        <CycleButton
          label="Annual"
          sub="2 months free"
          active={billingCycle === 'annual'}
          onClick={() => onBillingCycleChange('annual')}
        />
      </div>

      {loading ? (
        <LoadingSkeleton count={4} />
      ) : !tiers || tiers.length === 0 ? (
        <EmptyState message="Couldn't load pricing tiers. Please refresh or contact support." />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 14,
        }}>
          {tiers.map((tier) => (
            <TierCard
              key={tier.tierKey}
              tier={tier}
              tierFeatures={subtypeData?.tiers[tier.tierKey] ?? null}
              selected={value === tier.tierKey}
              billingCycle={billingCycle}
              onClick={() => onChange(tier.tierKey)}
            />
          ))}
        </div>
      )}

      <p style={{
        marginTop: 20, fontSize: 12, color: TOKENS.textMuted,
        textAlign: 'center',
      }}>
        All plans include a <strong style={{ color: TOKENS.text }}>14-day free trial</strong>.
        No credit card required. Prices exclude 18% GST.
      </p>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────── */

function CycleButton({
  label, sub, active, onClick,
}: { label: string; sub?: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '8px 16px',
        borderRadius: 7,
        border: 'none',
        background: active ? TOKENS.primary : 'transparent',
        color: active ? '#fff' : TOKENS.textMuted,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        transition: 'background 160ms, color 160ms',
        fontFamily: 'inherit',
      }}
    >
      {label}
      {sub && (
        <span style={{
          fontSize: 10,
          padding: '2px 6px',
          borderRadius: 4,
          background: active ? 'rgba(255,255,255,0.2)' : TOKENS.accent + '20',
          color: active ? '#fff' : '#B45309',
          fontWeight: 700,
          letterSpacing: '0.02em',
        }}>{sub}</span>
      )}
    </button>
  );
}

function TierCard({
  tier, tierFeatures, selected, billingCycle, onClick,
}: {
  tier: TierFromApi;
  tierFeatures: SubtypeTier | null;
  selected: boolean;
  billingCycle: 'monthly' | 'annual';
  onClick: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isPopular = tier.badge === 'Most Popular';
  const hasPrice = tier.priceMonthly != null;

  const displayPrice = (() => {
    if (!hasPrice) return 'Custom';
    if (billingCycle === 'annual') {
      const annualRupees = (tier.priceAnnual ?? tier.priceMonthly! * 10) / 100;
      return `₹${Math.round(annualRupees / 12).toLocaleString('en-IN')}`;
    }
    return `₹${(tier.priceMonthly! / 100).toLocaleString('en-IN')}`;
  })();

  const priceSuffix = !hasPrice
    ? tier.badge === 'Contact Sales' ? '· contact us' : ''
    : billingCycle === 'annual' ? '/mo · billed yearly' : '/month';

  // Use subtype-specific scale if available, fallback to generic DB fields
  const scaleItems: { label: string; value: string }[] = tierFeatures?.scale ?? [
    ...(tier.dailyVolumeMax != null || tier.dailyVolumeMin != null
      ? [{ label: 'Daily volume', value: tier.dailyVolumeMax == null ? `${tier.dailyVolumeMin}+` : `${tier.dailyVolumeMin ?? 0}–${tier.dailyVolumeMax}` }]
      : []),
    { label: 'Branches', value: fmt(tier.branchesAllowed) },
    { label: 'Staff users', value: fmt(tier.staffAllowed) },
    { label: 'WA msgs/mo', value: fmt(tier.waMessagesPerMonth) },
  ];

  // Subtype-specific features or generic fallback
  const featureList = tierFeatures?.features ?? [
    `Up to ${fmt(tier.staffAllowed)} staff`,
    `${fmt(tier.waMessagesPerMonth)} WhatsApp msgs/month`,
    `${fmt(tier.smsPerMonth)} SMS/month`,
    `${tier.storageGB} GB secure storage`,
  ];

  const notIncluded = tierFeatures?.notIncluded ?? [];

  // Show first 6 features collapsed, rest on expand
  const COLLAPSED_COUNT = 6;
  const visibleFeatures = expanded ? featureList : featureList.slice(0, COLLAPSED_COUNT);
  const hasMore = featureList.length > COLLAPSED_COUNT;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      style={{
        position: 'relative',
        textAlign: 'left',
        padding: 22,
        borderRadius: 14,
        border: `1.5px solid ${selected ? TOKENS.primary : isPopular ? TOKENS.primary + '60' : TOKENS.border}`,
        background: selected ? TOKENS.primaryLight : '#fff',
        cursor: 'pointer',
        transition: 'border-color 160ms, background 160ms, transform 120ms, box-shadow 160ms',
        boxShadow: selected
          ? `0 4px 16px ${TOKENS.primary}25`
          : isPopular
            ? `0 2px 12px ${TOKENS.primary}15`
            : '0 1px 2px rgba(0,0,0,0.03)',
        fontFamily: 'inherit',
        color: TOKENS.text,
      }}
      onMouseEnter={(e) => {
        if (!selected) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        if (!selected) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
      }}
    >
      {tier.badge && (
        <div style={{
          position: 'absolute', top: -10, right: 16,
          fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
          textTransform: 'uppercase',
          padding: '4px 10px', borderRadius: 6,
          background: tier.tierKey === 'enterprise' ? TOKENS.text : TOKENS.accent,
          color: '#fff',
        }}>
          {isPopular && <Sparkle size={10} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-top' }} />}
          {tier.badge}
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.01em' }}>
          {tier.displayName}
        </div>
        <div style={{ fontSize: 12, color: TOKENS.textMuted, lineHeight: 1.4 }}>
          {tier.tagline}
        </div>
      </div>

      <div style={{ marginBottom: 18, display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
          {displayPrice}
        </span>
        {priceSuffix && (
          <span style={{ fontSize: 13, color: TOKENS.textMuted }}>{priceSuffix}</span>
        )}
      </div>

      {/* ── Scale metrics (subtype-specific when available) ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
        padding: 12, borderRadius: 10,
        background: selected ? '#fff' : TOKENS.surface,
        marginBottom: 16, fontSize: 12,
      }}>
        {scaleItems.map((s, i) => (
          <ScaleCell key={i} label={s.label} value={s.value} />
        ))}
      </div>

      {/* ── Feature list (subtype-specific when available) ── */}
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {visibleFeatures.map((f, i) => (
          <li key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            fontSize: 13, color: TOKENS.text, marginBottom: 6, lineHeight: 1.4,
          }}>
            <Check size={14} color={TOKENS.primary} style={{ marginTop: 2, flexShrink: 0 }} />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {/* Show more / less toggle */}
      {hasMore && (
        <div
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          style={{
            marginTop: 6, fontSize: 12, color: TOKENS.primary,
            cursor: 'pointer', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          {expanded ? (
            <><ChevronUp size={14} /> Show less</>
          ) : (
            <><ChevronDown size={14} /> +{featureList.length - COLLAPSED_COUNT} more features</>
          )}
        </div>
      )}

      {/* ── Not included (upgrade path) ── */}
      {notIncluded.length > 0 && (
        <div style={{
          marginTop: 14, paddingTop: 12,
          borderTop: `1px solid ${selected ? TOKENS.border : TOKENS.surface}`,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 600, color: TOKENS.textMuted,
            textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6,
          }}>
            Upgrade for
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {notIncluded.slice(0, 3).map((f, i) => (
              <li key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                fontSize: 12, color: TOKENS.textMuted, marginBottom: 4, lineHeight: 1.3,
              }}>
                <XIcon size={12} color={TOKENS.textMuted} style={{ marginTop: 2, flexShrink: 0, opacity: 0.5 }} />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </button>
  );
}

function ScaleCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{
        fontSize: 10, color: TOKENS.textMuted, textTransform: 'uppercase',
        letterSpacing: '0.05em', fontWeight: 600, marginBottom: 2,
      }}>{label}</div>
      <div style={{ fontSize: 13, color: TOKENS.text, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      padding: 32, textAlign: 'center',
      background: '#fff', borderRadius: 12,
      border: `1px dashed ${TOKENS.border}`,
      color: TOKENS.textMuted, fontSize: 14,
    }}>{message}</div>
  );
}

/** Format helper — large numbers become "Unlimited". */
function fmt(n: number): string {
  if (n >= 9999) return 'Unlimited';
  return n.toLocaleString('en-IN');
}
