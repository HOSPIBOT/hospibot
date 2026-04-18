'use client';

import { Check, Sparkle } from 'lucide-react';
import { Heading, LoadingSkeleton } from './Step2GroupPicker';
import { TOKENS } from '../_lib/wizard-types';
import { useResolvedTiers, TierFromApi } from '../_hooks/useResolvedTiers';

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

  return (
    <div>
      <Heading
        title="What size is your operation?"
        subtitle="Pick the tier that matches your current volume. You can upgrade anytime — Super Admin usually approves upgrades within 24 hours."
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
  tier, selected, billingCycle, onClick,
}: {
  tier: TierFromApi;
  selected: boolean;
  billingCycle: 'monthly' | 'annual';
  onClick: () => void;
}) {
  const isPopular = tier.badge === 'Most Popular';
  const hasPrice = tier.priceMonthly != null;

  // Choose price + label based on billing cycle
  const displayPrice = (() => {
    if (!hasPrice) return 'Custom';
    if (billingCycle === 'annual') {
      // Show monthly equivalent of annual price
      const annualRupees = (tier.priceAnnual ?? tier.priceMonthly! * 10) / 100;
      return `₹${Math.round(annualRupees / 12).toLocaleString('en-IN')}`;
    }
    return `₹${(tier.priceMonthly! / 100).toLocaleString('en-IN')}`;
  })();

  const priceSuffix = !hasPrice
    ? tier.badge === 'Contact Sales' ? '· contact us' : ''
    : billingCycle === 'annual' ? '/mo · billed yearly' : '/month';

  // Volume hint
  const volumeHint = (() => {
    if (tier.dailyVolumeMax == null && tier.dailyVolumeMin == null) return null;
    if (tier.dailyVolumeMax == null) return `${tier.dailyVolumeMin}+`;
    return `${tier.dailyVolumeMin ?? 0}–${tier.dailyVolumeMax}`;
  })();

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

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
        padding: 12, borderRadius: 10,
        background: selected ? '#fff' : TOKENS.surface,
        marginBottom: 16, fontSize: 12,
      }}>
        {volumeHint && <ScaleCell label="Daily volume" value={volumeHint} />}
        <ScaleCell label="Branches"       value={fmt(tier.branchesAllowed)} />
        <ScaleCell label="Staff users"    value={fmt(tier.staffAllowed)} />
        <ScaleCell label="WA msgs/mo"     value={fmt(tier.waMessagesPerMonth)} />
      </div>

      {/* Static top-4 bullets derived from included features of this tier.
          Kept intentionally short — full feature comparison lives in FAQ/docs. */}
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {[
          `Up to ${fmt(tier.staffAllowed)} staff`,
          `${fmt(tier.waMessagesPerMonth)} WhatsApp msgs/month`,
          `${fmt(tier.smsPerMonth)} SMS/month`,
          `${tier.storageGB} GB secure storage`,
        ].map((f, i) => (
          <li key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            fontSize: 13, color: TOKENS.text, marginBottom: 6, lineHeight: 1.4,
          }}>
            <Check size={14} color={TOKENS.primary} style={{ marginTop: 2, flexShrink: 0 }} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
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
