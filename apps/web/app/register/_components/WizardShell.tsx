'use client';

import { ReactNode } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { TOKENS, TOTAL_STEPS, StepId, STEP_LABELS } from '../_lib/wizard-types';

interface Props {
  step: StepId;
  children: ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  hideBack?: boolean;
  hideNext?: boolean;
  wide?: boolean;  // widen content area to ~1200px (for pricing cards)
  footerExtra?: ReactNode;  // custom content slotted into the footer (e.g. a "Save & Resume" link)
}

/**
 * WizardShell — the fixed chrome shared across all 7 registration steps.
 *
 * Layout (desktop & mobile identical — no split screen, no media-query forks):
 *   - Top bar (56px): logo left · "Step X of 7 — <label>" center · empty right
 *   - Thin 4px progress bar (Deep Teal fill, E2E8F0 track)
 *   - Main content: centered, max-width 720px, 64px vertical padding
 *   - Sticky footer (72px): Back button left, Continue button right
 *
 * Content scrolls independently of the chrome so the Back / Continue buttons
 * are always reachable without hunting through a long form.
 */
export default function WizardShell({
  step, children, onBack, onNext, nextLabel = 'Continue',
  nextDisabled, hideBack, hideNext, wide, footerExtra,
}: Props) {
  const pct = Math.round((step / TOTAL_STEPS) * 100);
  const stepLabel = STEP_LABELS[step];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: TOKENS.surface,
      fontFamily: "'Inter','Poppins',system-ui,sans-serif",
      color: TOKENS.text,
    }}>
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: '#fff',
        borderBottom: `1px solid ${TOKENS.border}`,
        display: 'flex', alignItems: 'center',
        padding: '0 24px',
        height: 56,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: `linear-gradient(135deg, ${TOKENS.primary}, ${TOKENS.primaryDark})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 14, fontWeight: 800,
          }}>H</div>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>HospiBot</span>
        </div>
        <div style={{
          flex: 2, textAlign: 'center',
          fontSize: 13, color: TOKENS.textMuted, fontWeight: 500,
        }}>
          <span style={{ color: TOKENS.primary, fontWeight: 700 }}>Step {step} of {TOTAL_STEPS}</span>
          <span style={{ margin: '0 10px', color: TOKENS.border }}>·</span>
          <span>{stepLabel}</span>
        </div>
        <div style={{ flex: 1, textAlign: 'right', fontSize: 13, color: TOKENS.textMuted }}>
          {footerExtra}
        </div>
      </header>

      {/* ── Progress bar (4px) ──────────────────────────────────────────── */}
      <div style={{ height: 4, background: TOKENS.border, position: 'sticky', top: 56, zIndex: 10 }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${TOKENS.primary}, ${TOKENS.primaryDark})`,
          transition: 'width 280ms cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </div>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main style={{
        flex: 1,
        padding: '64px 24px 120px',  // bottom padding clears the sticky footer
        display: 'flex',
        justifyContent: 'center',
      }}>
        <div style={{ width: '100%', maxWidth: wide ? 1200 : 720 }}>
          {children}
        </div>
      </main>

      {/* ── Sticky footer ───────────────────────────────────────────────── */}
      {(!hideBack || !hideNext) && (
        <footer style={{
          position: 'sticky', bottom: 0, zIndex: 10,
          background: '#fff',
          borderTop: `1px solid ${TOKENS.border}`,
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          height: 72,
          boxSizing: 'border-box',
        }}>
          {!hideBack ? (
            <button
              type="button"
              onClick={onBack}
              disabled={!onBack}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 18px', borderRadius: 10,
                background: 'transparent',
                border: `1px solid ${TOKENS.border}`,
                color: TOKENS.text, fontSize: 14, fontWeight: 600,
                cursor: onBack ? 'pointer' : 'not-allowed',
                opacity: onBack ? 1 : 0.5,
                fontFamily: 'inherit',
              }}
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : <span />}

          {!hideNext && (
            <button
              type="button"
              onClick={onNext}
              disabled={nextDisabled || !onNext}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '11px 22px', borderRadius: 10,
                background: nextDisabled
                  ? TOKENS.borderStrong
                  : `linear-gradient(135deg, ${TOKENS.primary}, ${TOKENS.primaryDark})`,
                color: '#fff', fontSize: 14, fontWeight: 700,
                border: 'none',
                cursor: nextDisabled ? 'not-allowed' : 'pointer',
                boxShadow: nextDisabled ? 'none' : `0 4px 14px ${TOKENS.primary}40`,
                transition: 'transform 120ms, box-shadow 120ms',
                fontFamily: 'inherit',
              }}
            >
              {nextLabel} <ArrowRight size={16} />
            </button>
          )}
        </footer>
      )}
    </div>
  );
}
