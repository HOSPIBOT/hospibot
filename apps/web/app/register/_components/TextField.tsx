'use client';

import { ReactNode, InputHTMLAttributes } from 'react';
import { TOKENS } from '../_lib/wizard-types';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helper?: string;
  required?: boolean;
  error?: string | null;
  icon?: ReactNode;
  prefix?: string;          // e.g. "+91 " or "www."
  optional?: boolean;       // render a small "Optional" tag
}

/**
 * TextField — consistent input used across steps 5 and 6.
 * Visual states: default · focus (teal ring) · error (red border + helper).
 */
export default function TextField({
  label, value, onChange, helper, required, error, icon, prefix, optional, ...rest
}: Props) {
  const id = rest.id || `field-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={id} style={{
        fontSize: 13, fontWeight: 600, color: TOKENS.text,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span>
          {label}
          {required && <span style={{ color: TOKENS.danger, marginLeft: 4 }}>*</span>}
        </span>
        {optional && (
          <span style={{ fontSize: 11, color: TOKENS.textMuted, fontWeight: 500 }}>
            Optional
          </span>
        )}
      </label>
      <div style={{
        position: 'relative',
        display: 'flex', alignItems: 'stretch',
        border: `1.5px solid ${error ? TOKENS.danger : TOKENS.border}`,
        borderRadius: 10,
        background: '#fff',
        transition: 'border-color 160ms, box-shadow 160ms',
        overflow: 'hidden',
      }}
      onFocusCapture={(e) => {
        if (!error) {
          (e.currentTarget as HTMLDivElement).style.borderColor = TOKENS.primary;
          (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 3px ${TOKENS.primary}20`;
        }
      }}
      onBlurCapture={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = error ? TOKENS.danger : TOKENS.border;
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}>
        {icon && (
          <div style={{
            padding: '0 12px',
            display: 'flex', alignItems: 'center',
            color: TOKENS.textMuted,
            borderRight: `1px solid ${TOKENS.border}`,
            background: TOKENS.surface,
          }}>{icon}</div>
        )}
        {prefix && (
          <div style={{
            padding: '0 10px 0 14px',
            display: 'flex', alignItems: 'center',
            fontSize: 14, color: TOKENS.textMuted,
            background: TOKENS.surface,
            borderRight: `1px solid ${TOKENS.border}`,
          }}>{prefix}</div>
        )}
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1, minWidth: 0,
            padding: '11px 14px',
            fontSize: 14,
            border: 'none', outline: 'none',
            background: 'transparent',
            fontFamily: 'inherit',
            color: TOKENS.text,
          }}
          {...rest}
        />
      </div>
      {error ? (
        <div style={{ fontSize: 12, color: TOKENS.danger, marginTop: 2 }}>{error}</div>
      ) : helper ? (
        <div style={{ fontSize: 12, color: TOKENS.textMuted, marginTop: 2 }}>{helper}</div>
      ) : null}
    </div>
  );
}
