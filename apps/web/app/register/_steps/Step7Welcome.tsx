'use client';

import { CheckCircle2, ArrowRight, Rocket, BookOpen } from 'lucide-react';
import { TOKENS } from '../_lib/wizard-types';
import { DIAGNOSTIC_TIERS, type LabTier } from '@/lib/diagnostic-tiers';
import { getSubtypeFeatures } from '@/lib/diagnostic-subtype-features';

interface Props {
  facilityName: string;
  subtypeSlug: string | null;
  subtypeName: string;
  tier: LabTier | null;
  portalSlug: string;  // e.g. 'diagnostic' — used for the redirect URL
  onGotoPortal: () => void;
}

/**
 * Step 7 — Welcome screen.
 *
 * This renders after a successful POST /auth/register. It personalises the
 * greeting based on what the user just picked and lists the top unlocked
 * features for their (subtype × tier) combination — pulled from the existing
 * diagnostic-subtype-features catalog so there's a single source of truth.
 */
export default function Step7Welcome({
  facilityName, subtypeSlug, subtypeName, tier, portalSlug, onGotoPortal,
}: Props) {
  const tierConfig = tier ? DIAGNOSTIC_TIERS.find((t) => t.id === tier) : null;

  // Pull top 5 included features for this (subtype × tier) combo
  const unlockedFeatures = (() => {
    if (!subtypeSlug || !tier) return [] as string[];
    try {
      const pkg = getSubtypeFeatures(subtypeSlug);
      return pkg?.tiers?.[tier]?.features?.slice(0, 5) ?? [];
    } catch {
      return [];
    }
  })();

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Success icon */}
      <div style={{
        width: 80, height: 80, borderRadius: 24,
        background: `linear-gradient(135deg, ${TOKENS.primary}, ${TOKENS.primaryDark})`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 24,
        boxShadow: `0 16px 40px ${TOKENS.primary}45`,
      }}>
        <CheckCircle2 color="#fff" size={40} strokeWidth={2.5} />
      </div>

      <h1 style={{
        fontSize: 32, fontWeight: 800, letterSpacing: '-0.025em',
        color: TOKENS.text, marginBottom: 10, lineHeight: 1.2,
      }}>
        You're in, {facilityName || 'friend'}! 🎉
      </h1>

      <p style={{
        fontSize: 16, color: TOKENS.textMuted, lineHeight: 1.55,
        maxWidth: 500, margin: '0 auto 36px',
      }}>
        Your{' '}
        {tierConfig && <strong style={{ color: TOKENS.text }}>{tierConfig.label}</strong>}{' '}
        {subtypeName} portal is configured and ready. Your 14-day free trial has started.
      </p>

      {/* Unlocked features card */}
      {unlockedFeatures.length > 0 && (
        <div style={{
          textAlign: 'left', maxWidth: 520, margin: '0 auto 32px',
          padding: 24, borderRadius: 14,
          background: '#fff', border: `1px solid ${TOKENS.border}`,
        }}>
          <div style={{
            fontSize: 11, color: TOKENS.textMuted, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14,
          }}>
            What you've unlocked today
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 10 }}>
            {unlockedFeatures.map((f, i) => (
              <li key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                fontSize: 14, color: TOKENS.text, lineHeight: 1.5,
              }}>
                <CheckCircle2 size={16} color={TOKENS.primary} style={{ marginTop: 2, flexShrink: 0 }} />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Primary CTA */}
      <button
        type="button"
        onClick={onGotoPortal}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '14px 28px', borderRadius: 12,
          background: `linear-gradient(135deg, ${TOKENS.primary}, ${TOKENS.primaryDark})`,
          color: '#fff', fontSize: 15, fontWeight: 700,
          border: 'none', cursor: 'pointer',
          boxShadow: `0 10px 28px ${TOKENS.primary}50`,
          fontFamily: 'inherit',
          marginBottom: 12,
        }}
      >
        <Rocket size={18} /> Sign in to your portal <ArrowRight size={18} />
      </button>

      <div style={{ fontSize: 13, color: TOKENS.textMuted, marginTop: 8 }}>
        You'll be redirected to{' '}
        <code style={{
          padding: '2px 8px', borderRadius: 6,
          background: TOKENS.surface, fontSize: 12,
          color: TOKENS.primaryDark, fontFamily: 'monospace',
        }}>/{portalSlug}/login</code>
      </div>

      {/* Secondary helpful link */}
      <div style={{
        marginTop: 32, paddingTop: 24,
        borderTop: `1px solid ${TOKENS.border}`,
        fontSize: 13, color: TOKENS.textMuted,
      }}>
        <a href="https://docs.hospibot.in/diagnostic-quickstart" target="_blank" rel="noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: TOKENS.primary, textDecoration: 'none', fontWeight: 600,
          }}>
          <BookOpen size={14} /> Read the 5-minute quickstart guide
        </a>
      </div>
    </div>
  );
}
