'use client';

import { ReactNode, InputHTMLAttributes } from 'react';
import { TOKENS } from '../_lib/wizard-types';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string; value: string; onChange: (value: string) => void;
  helper?: string; required?: boolean; error?: string | null;
  icon?: ReactNode; prefix?: string; optional?: boolean;
}

export default function TextField({ label, value, onChange, helper, required, error, icon, prefix, optional, ...rest }: Props) {
  const id = rest.id || `field-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label htmlFor={id} style={{ fontSize: 13, fontWeight: 600, color: TOKENS.text, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{label}{required && <span style={{ color: TOKENS.danger, marginLeft: 3 }}>*</span>}</span>
        {optional && <span style={{ fontSize: 10, color: TOKENS.textMuted, fontWeight: 500, background: '#F1F5F9', padding: '2px 8px', borderRadius: 100 }}>Optional</span>}
      </label>
      <div style={{
        position: 'relative', display: 'flex', alignItems: 'stretch',
        border: `1.5px solid ${error ? TOKENS.danger : '#D1D9E0'}`,
        borderRadius: 12, background: '#FAFBFC', transition: 'border-color 160ms, box-shadow 160ms, background 160ms',
        overflow: 'hidden',
      }}
      onFocusCapture={(e) => { if (!error) { (e.currentTarget as HTMLDivElement).style.borderColor = TOKENS.primary; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 3px ${TOKENS.primary}15`; (e.currentTarget as HTMLDivElement).style.background = '#fff'; } }}
      onBlurCapture={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = error ? TOKENS.danger : '#D1D9E0'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.background = '#FAFBFC'; }}>
        {icon && (
          <div style={{ padding: '0 0 0 14px', display: 'flex', alignItems: 'center', color: TOKENS.textMuted }}>{icon}</div>
        )}
        {prefix && (
          <div style={{ padding: '0 8px 0 14px', display: 'flex', alignItems: 'center', fontSize: 14, color: TOKENS.textMuted, fontWeight: 600 }}>{prefix}</div>
        )}
        <input id={id} value={value} onChange={(e) => onChange(e.target.value)}
          style={{ flex: 1, minWidth: 0, padding: icon || prefix ? '12px 14px 12px 8px' : '12px 14px', fontSize: 14, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', color: TOKENS.text }}
          {...rest} />
      </div>
      {error ? (
        <div style={{ fontSize: 11, color: TOKENS.danger, marginTop: 1 }}>{error}</div>
      ) : helper ? (
        <div style={{ fontSize: 11, color: TOKENS.textMuted, marginTop: 1, lineHeight: 1.4 }}>{helper}</div>
      ) : null}
    </div>
  );
}
