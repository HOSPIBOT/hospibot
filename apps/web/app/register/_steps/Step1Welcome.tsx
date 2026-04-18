'use client';

import { Sparkles, Zap, ShieldCheck } from 'lucide-react';
import { TOKENS } from '../_lib/wizard-types';

/**
 * Step 1 — Welcome
 *
 * Sets the tone: confident, brief, and immediately orients the user to what
 * they're about to do. Three value-props keep it human without becoming a
 * marketing page. The actual "Continue" CTA lives in the shell footer; we do
 * not repeat it here.
 */
export default function Step1Welcome() {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: `linear-gradient(135deg, ${TOKENS.primary}, ${TOKENS.primaryDark})`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 28,
        boxShadow: `0 12px 32px ${TOKENS.primary}40`,
      }}>
        <Sparkles color="#fff" size={32} />
      </div>

      <h1 style={{
        fontSize: 34, fontWeight: 800, letterSpacing: '-0.025em',
        color: TOKENS.text, marginBottom: 14, lineHeight: 1.15,
      }}>
        Let's get your diagnostic<br />lab live on HospiBot.
      </h1>

      <p style={{
        fontSize: 16, color: TOKENS.textMuted, lineHeight: 1.6,
        maxWidth: 520, margin: '0 auto 40px',
      }}>
        This takes about 4 minutes. You can save and resume anytime —
        we'll pick up exactly where you left off.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 16,
        maxWidth: 640, margin: '0 auto',
      }}>
        <ValueProp
          icon={<Zap size={20} />}
          title="Tailored to your lab"
          body="Pick your subtype and size — the portal auto-configures for you."
        />
        <ValueProp
          icon={<ShieldCheck size={20} />}
          title="Compliant by default"
          body="NABL, PC-PNDT, AERB templates built in from day one."
        />
        <ValueProp
          icon={<Sparkles size={20} />}
          title="14-day free trial"
          body="No credit card. Cancel anytime. Full feature access."
        />
      </div>
    </div>
  );
}

function ValueProp({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div style={{
      padding: 18,
      borderRadius: 12,
      background: '#fff',
      border: `1px solid ${TOKENS.border}`,
      textAlign: 'left',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: TOKENS.primaryLight, color: TOKENS.primary,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 12,
      }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: TOKENS.text, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, color: TOKENS.textMuted, lineHeight: 1.5 }}>{body}</div>
    </div>
  );
}
