'use client';

import { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { TOKENS } from '../_lib/wizard-types';

interface Props {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  badge?: string;
  selected: boolean;
  onClick: () => void;
  meta?: ReactNode;         // e.g. "3 options" or volume hint
  disabled?: boolean;
}

/**
 * SelectionCard — one-click full-width tap target used for Group / Subtype / Tier
 * picker steps. Visual states:
 *   - Default: white surface, subtle border
 *   - Hover: slight lift + teal border tint
 *   - Selected: teal border + light teal background + check badge
 *   - Disabled: muted, no pointer cursor
 *
 * Designed to feel substantial but not heavy — bigger than a button, lighter
 * than a landing-page tile.
 */
export default function SelectionCard({
  title, subtitle, icon, badge, selected, onClick, meta, disabled,
}: Props) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      aria-pressed={selected}
      disabled={disabled}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: 20,
        borderRadius: 14,
        border: `1.5px solid ${selected ? TOKENS.primary : TOKENS.border}`,
        background: selected ? TOKENS.primaryLight : '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 16,
        transition: 'border-color 160ms, background 160ms, transform 120ms, box-shadow 160ms',
        boxShadow: selected
          ? `0 2px 10px ${TOKENS.primary}20`
          : '0 1px 2px rgba(0,0,0,0.03)',
        fontFamily: 'inherit',
        color: TOKENS.text,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !selected) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = TOKENS.primary + '80';
          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !selected) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = TOKENS.border;
          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
        }
      }}
    >
      {icon && (
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: selected ? '#fff' : TOKENS.primaryLight,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: TOKENS.primary, flexShrink: 0,
        }}>
          {icon}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: subtitle ? 4 : 0 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: TOKENS.text, letterSpacing: '-0.01em' }}>
            {title}
          </span>
          {badge && (
            <span style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
              padding: '3px 7px', borderRadius: 5,
              background: TOKENS.accent + '20',
              color: '#B45309',
              letterSpacing: '0.04em',
            }}>{badge}</span>
          )}
        </div>
        {subtitle && (
          <p style={{ fontSize: 13, color: TOKENS.textMuted, lineHeight: 1.5, margin: 0 }}>
            {subtitle}
          </p>
        )}
        {meta && (
          <div style={{ marginTop: 8, fontSize: 12, color: TOKENS.textMuted, fontWeight: 500 }}>
            {meta}
          </div>
        )}
      </div>
      <div style={{
        width: 22, height: 22, borderRadius: '50%',
        background: selected ? TOKENS.primary : 'transparent',
        border: selected ? 'none' : `1.5px solid ${TOKENS.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        transition: 'background 160ms',
      }}>
        {selected && <Check size={14} color="#fff" strokeWidth={3} />}
      </div>
    </button>
  );
}
