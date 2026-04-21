'use client';

import { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { TOKENS } from '../_lib/wizard-types';

interface Props {
  title: string; subtitle?: string; icon?: ReactNode; badge?: string;
  selected: boolean; onClick: () => void; meta?: ReactNode; disabled?: boolean;
}

export default function SelectionCard({ title, subtitle, icon, badge, selected, onClick, meta, disabled }: Props) {
  return (
    <button type="button" onClick={disabled ? undefined : onClick} aria-pressed={selected} disabled={disabled}
      style={{
        width: '100%', textAlign: 'left', padding: 22, borderRadius: 16,
        border: `2px solid ${selected ? TOKENS.primary : TOKENS.border}`,
        background: selected ? TOKENS.primaryLight : '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        display: 'flex', alignItems: 'flex-start', gap: 16,
        transition: 'border-color 160ms, background 160ms, transform 120ms, box-shadow 160ms',
        boxShadow: selected ? `0 6px 24px ${TOKENS.primary}20` : '0 4px 16px rgba(0,0,0,0.06)',
        fontFamily: 'inherit', color: TOKENS.text,
      }}
      onMouseEnter={(e) => { if (!disabled && !selected) { (e.currentTarget as HTMLButtonElement).style.borderColor = TOKENS.primary + '80'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(13,124,102,0.12)'; } }}
      onMouseLeave={(e) => { if (!disabled && !selected) { (e.currentTarget as HTMLButtonElement).style.borderColor = TOKENS.border; (e.currentTarget as HTMLButtonElement).style.transform = 'none'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; } }}>
      {icon && (
        <div style={{ width: 44, height: 44, borderRadius: 12, background: selected ? '#fff' : TOKENS.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TOKENS.primary, flexShrink: 0 }}>{icon}</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: subtitle ? 4 : 0 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: TOKENS.text }}>{title}</span>
          {badge && <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '3px 8px', borderRadius: 6, background: TOKENS.accent + '20', color: '#B45309', letterSpacing: '0.04em' }}>{badge}</span>}
        </div>
        {subtitle && <p style={{ fontSize: 13, color: TOKENS.textMuted, lineHeight: 1.5, margin: 0 }}>{subtitle}</p>}
        {meta && <div style={{ marginTop: 8, fontSize: 12, color: TOKENS.textMuted, fontWeight: 500 }}>{meta}</div>}
      </div>
      <div style={{ width: 24, height: 24, borderRadius: '50%', background: selected ? TOKENS.primary : 'transparent', border: selected ? 'none' : `2px solid ${TOKENS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 160ms' }}>
        {selected && <Check size={14} color="#fff" strokeWidth={3} />}
      </div>
    </button>
  );
}
