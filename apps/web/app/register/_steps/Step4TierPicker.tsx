'use client';

import { Check, X, Sparkle } from 'lucide-react';
import { DIAGNOSTIC_TIERS, type LabTier } from '@/lib/diagnostic-tiers';
import { Heading } from './Step2GroupPicker';
import { TOKENS } from '../_lib/wizard-types';

interface Props {
  value: LabTier | null;
  billingCycle: 'monthly' | 'annual';
  onChange: (tier: LabTier) => void;
  onBillingCycleChange: (cycle: 'monthly' | 'annual') => void;
}

/**
 * Step 4 — Tier picker (Small / Medium / Large / Enterprise).
 *
 * Layout: 2x2 grid of pricing cards on desktop, stacked on mobile.
 * Annual toggle is visible but subtle — annual discount = 2 months free
 * (the price shown is the monthly equivalent either way; annual just
 * annotates "billed yearly").
 *
 * Each card uses the existing DIAGNOSTIC_TIERS metadata so we don't
 * duplicate pricing or features. The old data stays authoritative until
 * Sprint 3 moves it to the Super Admin DB.
 */
export default function Step4TierPicker({
  value, billingCycle, onChange, onBillingCycleChange,
}: Props) {
  return (
    <div>
      <Heading
        title="What size is your operation?"
        subtitle="Pick the tier that matches your current volume. You can upgrade anytime — the Super Admin team usually approves upgrades within 24 hours."
      />

      {/* ── Billing cycle toggle ──────────────────────────────────────── */}
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

      {/* ── Tier cards ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 14,
      }}>
        {DIAGNOSTIC_TIERS.map((tier) => (
          <TierCard
            key={tier.id}
            tier={tier}
            selected={value === tier.id}
            billingCycle={billingCycle}
            onClick={() => onChange(tier.id)}
          />
        ))}
      </div>

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
  tier: typeof DIAGNOSTIC_TIERS[number];
  selected: boolean;
  billingCycle: 'monthly' | 'annual';
  onClick: () => void;
}) {
  const isEnterprise = tier.id === 'enterprise';
  const isPopular = tier.badge === 'Most Popular';

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
          background: isEnterprise ? TOKENS.text : TOKENS.accent,
          color: '#fff',
        }}>
          {isPopular && <Sparkle size={10} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-top' }} />}
          {tier.badge}
        </div>
      )}

      {/* Title + price */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.01em' }}>
          {tier.label}
        </div>
        <div style={{ fontSize: 12, color: TOKENS.textMuted, lineHeight: 1.4 }}>
          {tier.tagline}
        </div>
      </div>

      <div style={{ marginBottom: 18, display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
          {tier.price}
        </span>
        {!isEnterprise && (
          <span style={{ fontSize: 13, color: TOKENS.textMuted }}>
            {billingCycle === 'annual' ? '/mo · billed yearly' : '/month'}
          </span>
        )}
        {isEnterprise && (
          <span style={{ fontSize: 13, color: TOKENS.textMuted }}>· {tier.priceNote}</span>
        )}
      </div>

      {/* Scale metrics */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
        padding: 12, borderRadius: 10,
        background: selected ? '#fff' : TOKENS.surface,
        marginBottom: 16, fontSize: 12,
      }}>
        <ScaleCell label="Daily samples"  value={tier.dailySamples} />
        <ScaleCell label="Staff"          value={tier.staff} />
        <ScaleCell label="Branches"       value={tier.branches} />
        <ScaleCell label="Monthly tests"  value={tier.monthlyTests} />
      </div>

      {/* Top 4 features */}
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {tier.features.slice(0, 4).map((f, i) => (
          <li key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            fontSize: 13, color: TOKENS.text, marginBottom: 6, lineHeight: 1.4,
          }}>
            <Check size={14} color={TOKENS.primary} style={{ marginTop: 2, flexShrink: 0 }} />
            <span>{f}</span>
          </li>
        ))}
        {tier.features.length > 4 && (
          <li style={{ fontSize: 12, color: TOKENS.textMuted, marginTop: 4, marginLeft: 22 }}>
            + {tier.features.length - 4} more
          </li>
        )}
      </ul>
    </button>
  );
}

function ScaleCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: TOKENS.textMuted, textTransform: 'uppercase',
                    letterSpacing: '0.05em', fontWeight: 600, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color: TOKENS.text, fontWeight: 600 }}>{value}</div>
    </div>
  );
}
