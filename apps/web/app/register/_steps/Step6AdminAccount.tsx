'use client';

import { useState } from 'react';
import { User, Mail, Phone, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import TextField from '../_components/TextField';
import { Heading } from '../_components/Heading';
import { TOKENS, WizardState } from '../_lib/wizard-types';

interface Props {
  value: WizardState['admin'];
  onChange: (partial: Partial<WizardState['admin']>) => void;
  submitting: boolean;
  submitError: string | null;
}

/**
 * Step 6 — Admin account setup.
 *
 * This is the final data-collection step. Hitting Continue on this step
 * triggers the real POST /auth/register call (handled by the parent page
 * via the `submitting` flag from the wizard root).
 *
 * Password strength is evaluated locally for immediate feedback but the
 * server enforces its own minimum (≥8 chars per RegisterTenantDto).
 */
export default function Step6AdminAccount({
  value, onChange, submitting, submitError,
}: Props) {
  const [showPw, setShowPw] = useState(false);
  const strength = scorePassword(value.password);

  return (
    <div>
      <Heading
        title="Create your admin account"
        subtitle="This account has full control over your portal. You can invite staff (doctors, receptionists, lab techs) after signup from the Users page."
      />

      <div style={{ display: 'grid', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <TextField
            label="First name"
            value={value.firstName}
            onChange={(v) => onChange({ firstName: v })}
            placeholder="Vinod"
            required
            icon={<User size={16} />}
            autoComplete="given-name"
          />
          <TextField
            label="Last name"
            value={value.lastName}
            onChange={(v) => onChange({ lastName: v })}
            placeholder="Bysani"
            autoComplete="family-name"
            optional
          />
        </div>

        <TextField
          label="Work email"
          value={value.email}
          onChange={(v) => onChange({ email: v })}
          placeholder="you@yourlab.in"
          required
          icon={<Mail size={16} />}
          type="email"
          autoComplete="email"
          helper="You'll sign in with this email. We'll send an OTP to verify in the next release."
        />

        <TextField
          label="Mobile number"
          value={value.phone}
          onChange={(v) => onChange({ phone: v })}
          placeholder="98765 43210"
          prefix="+91"
          icon={<Phone size={16} />}
          type="tel"
          autoComplete="tel-national"
          optional
        />

        {/* Password field with show/hide toggle */}
        <div>
          <TextField
            label="Password"
            value={value.password}
            onChange={(v) => onChange({ password: v })}
            placeholder="At least 8 characters"
            required
            icon={<Lock size={16} />}
            type={showPw ? 'text' : 'password'}
            autoComplete="new-password"
          />
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 6, fontSize: 12,
          }}>
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              style={{
                background: 'none', border: 'none', padding: 0,
                color: TOKENS.primary, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 12, fontFamily: 'inherit',
              }}
            >
              {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
              {showPw ? 'Hide' : 'Show'} password
            </button>
            {value.password && <StrengthIndicator strength={strength} />}
          </div>
        </div>
      </div>

      {/* Terms note */}
      <p style={{
        fontSize: 12, color: TOKENS.textMuted,
        marginTop: 24, lineHeight: 1.55,
      }}>
        By creating an account you agree to HospiBot's{' '}
        <a href="/terms" target="_blank" rel="noreferrer" style={{ color: TOKENS.primary }}>
          Terms of Service
        </a>{' '}and{' '}
        <a href="/privacy" target="_blank" rel="noreferrer" style={{ color: TOKENS.primary }}>
          Privacy Policy
        </a>. Your 14-day free trial begins immediately — no payment is collected.
      </p>

      {/* Submit status (error or loading) */}
      {submitError && (
        <div style={{
          marginTop: 18, padding: 14, borderRadius: 10,
          background: '#FEF2F2',
          border: `1px solid #FECACA`,
          fontSize: 13, color: TOKENS.danger, lineHeight: 1.5,
        }}>
          <strong>Couldn't create your account:</strong> {submitError}
        </div>
      )}

      {submitting && (
        <div style={{
          marginTop: 18, padding: 14, borderRadius: 10,
          background: TOKENS.primaryLight,
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 13, color: TOKENS.primaryDark,
        }}>
          <Loader2 size={16} className="spin" />
          Creating your HospiBot workspace — hang tight…
          <style jsx>{`
            .spin { animation: spin 1s linear infinite; }
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </div>
      )}
    </div>
  );
}

/* ── Password strength ─────────────────────────────────────────────────── */

function scorePassword(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  if (!pw) return { score: 0, label: '' };
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'] as const;
  return { score: Math.min(score, 4) as 0 | 1 | 2 | 3 | 4, label: labels[score] };
}

function StrengthIndicator({ strength }: { strength: { score: number; label: string } }) {
  const COLORS = [TOKENS.danger, '#F97316', TOKENS.accent, '#65A30D', TOKENS.success];
  const activeColor = COLORS[strength.score];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span style={{ display: 'inline-flex', gap: 3 }}>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            style={{
              width: 18, height: 4, borderRadius: 2,
              background: i < strength.score ? activeColor : TOKENS.border,
              transition: 'background 160ms',
            }}
          />
        ))}
      </span>
      <span style={{ color: activeColor, fontSize: 11, fontWeight: 600 }}>{strength.label}</span>
    </span>
  );
}
