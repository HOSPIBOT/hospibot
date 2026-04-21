'use client';

import { ReactNode } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { TOKENS, TOTAL_STEPS, StepId, STEP_LABELS } from '../_lib/wizard-types';

interface Props {
  step: StepId; children: ReactNode; onBack?: () => void; onNext?: () => void;
  nextLabel?: string; nextDisabled?: boolean; hideBack?: boolean; hideNext?: boolean;
  wide?: boolean; footerExtra?: ReactNode;
}

export default function WizardShell({ step, children, onBack, onNext, nextLabel = 'Continue', nextDisabled, hideBack, hideNext, wide, footerExtra }: Props) {
  const pct = Math.round((step / TOTAL_STEPS) * 100);
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: TOKENS.surface, fontFamily: "'Poppins','Inter',system-ui,sans-serif", color: TOKENS.text }}>

      <header style={{ position: 'sticky', top: 0, zIndex: 10, background: TOKENS.navy, display: 'flex', alignItems: 'center', padding: '0 32px', height: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${TOKENS.primary}, #14B88C)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, fontWeight: 800 }}>H</div>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: -0.3 }}>Hospi<span style={{ color: TOKENS.primary }}>Bot</span></span>
        </div>
        <div style={{ flex: 2, textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
          <span style={{ color: '#fff', fontWeight: 700 }}>Step {step}</span>
          <span style={{ margin: '0 6px', color: 'rgba(255,255,255,0.2)' }}>of</span>
          <span style={{ color: 'rgba(255,255,255,0.6)' }}>{TOTAL_STEPS}</span>
          <span style={{ margin: '0 10px', color: 'rgba(255,255,255,0.15)' }}>·</span>
          <span style={{ color: 'rgba(255,255,255,0.7)' }}>{STEP_LABELS[step]}</span>
        </div>
        <div style={{ flex: 1, textAlign: 'right', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{footerExtra}</div>
      </header>

      <div style={{ height: 4, background: TOKENS.navyLight, position: 'sticky', top: 60, zIndex: 10 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${TOKENS.primary}, #14B88C)`, transition: 'width 280ms cubic-bezier(0.4,0,0.2,1)', boxShadow: `0 0 12px ${TOKENS.primary}60` }} />
      </div>

      <main style={{ flex: 1, padding: '48px 24px 120px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: wide ? 1200 : 720 }}>{children}</div>
      </main>

      {(!hideBack || !hideNext) && (
        <footer style={{ position: 'sticky', bottom: 0, zIndex: 10, background: TOKENS.navy, padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, height: 68, boxSizing: 'border-box' }}>
          {!hideBack ? (
            <button type="button" onClick={onBack} disabled={!onBack}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: onBack ? 'pointer' : 'not-allowed', opacity: onBack ? 1 : 0.4, fontFamily: 'inherit' }}>
              <ArrowLeft size={16} /> Back
            </button>
          ) : <span />}
          {!hideNext && (
            <button type="button" onClick={onNext} disabled={nextDisabled || !onNext}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 26px', borderRadius: 10, background: nextDisabled ? 'rgba(255,255,255,0.08)' : `linear-gradient(135deg, ${TOKENS.primary}, #14B88C)`, color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: nextDisabled ? 'not-allowed' : 'pointer', boxShadow: nextDisabled ? 'none' : `0 4px 18px ${TOKENS.primary}50`, fontFamily: 'inherit' }}>
              {nextLabel} <ArrowRight size={16} />
            </button>
          )}
        </footer>
      )}
    </div>
  );
}
