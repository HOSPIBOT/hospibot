'use client';

import {
  Droplet, TestTube, ScanLine, Activity, ClipboardCheck, Sparkles, Network,
  type LucideIcon,
} from 'lucide-react';
import SelectionCard from '../_components/SelectionCard';
import { useDiagnosticGroups } from '../_hooks/useDiagnosticCatalog';
import { TOKENS } from '../_lib/wizard-types';

/**
 * Icon name (from DB) → Lucide component.
 * Kept small & explicit — safer than dynamic imports by string.
 */
const ICON_MAP: Record<string, LucideIcon> = {
  Droplet, TestTube, ScanLine, Activity, ClipboardCheck, Sparkles, Network,
};

interface Props {
  value: string | null;
  onChange: (groupSlug: string) => void;
}

export default function Step2GroupPicker({ value, onChange }: Props) {
  const { groups, loading } = useDiagnosticGroups();

  return (
    <div>
      <Heading
        title="What kind of diagnostic operation are you?"
        subtitle="Pick the category that best describes your primary service. You'll choose the specific subtype next."
      />

      {loading ? (
        <LoadingSkeleton count={7} />
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {groups?.map((g) => {
            const Icon = ICON_MAP[g.icon] ?? TestTube;
            return (
              <SelectionCard
                key={g.slug}
                title={g.name}
                subtitle={g.description}
                icon={<Icon size={20} />}
                selected={value === g.slug}
                onClick={() => onChange(g.slug)}
                meta={g.subtypeCount > 0
                  ? `${g.subtypeCount} subtype${g.subtypeCount === 1 ? '' : 's'} available`
                  : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Shared bits used by both steps ─────────────────────────────────────── */

export function Heading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{
        fontSize: 26, fontWeight: 800, color: TOKENS.text,
        marginBottom: subtitle ? 8 : 0, letterSpacing: '-0.02em', lineHeight: 1.2,
      }}>{title}</h2>
      {subtitle && (
        <p style={{ fontSize: 15, color: TOKENS.textMuted, lineHeight: 1.55, margin: 0 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function LoadingSkeleton({ count }: { count: number }) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 82, borderRadius: 14,
            background: `linear-gradient(90deg, ${TOKENS.border}, ${TOKENS.surface}, ${TOKENS.border})`,
            backgroundSize: '200% 100%',
            animation: 'hospibotShimmer 1.4s ease-in-out infinite',
          }}
        />
      ))}
      <style jsx>{`
        @keyframes hospibotShimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
