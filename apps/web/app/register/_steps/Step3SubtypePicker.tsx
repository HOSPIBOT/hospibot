'use client';

import * as Lucide from 'lucide-react';
import SelectionCard from '../_components/SelectionCard';
import { useDiagnosticSubtypes } from '../_hooks/useDiagnosticCatalog';
import { Heading, LoadingSkeleton } from './Step2GroupPicker';
import { TOKENS } from '../_lib/wizard-types';

interface Props {
  groupSlug: string | null;
  groupName?: string;
  value: string | null;
  onChange: (subtypeSlug: string) => void;
}

/**
 * Step 3 — Subtype picker.
 *
 * Shows 2-8 cards depending on which group was chosen in step 2. Each card
 * carries the subtype's operational tagline (what they actually do all day)
 * plus a daily-volume hint so lab owners can self-identify quickly.
 */
export default function Step3SubtypePicker({ groupSlug, groupName, value, onChange }: Props) {
  const { subtypes, loading, error } = useDiagnosticSubtypes(groupSlug);

  return (
    <div>
      <Heading
        title={groupName ? `Which ${groupName.toLowerCase()}?` : 'Pick your subtype'}
        subtitle="Choose the option that most closely matches your day-to-day work. Don't worry if it's not a perfect fit — you can adjust later from settings."
      />

      {!groupSlug ? (
        <EmptyState message="Go back and pick a category first." />
      ) : loading ? (
        <LoadingSkeleton count={5} />
      ) : error ? (
        <EmptyState message={`Couldn't load subtypes: ${error}`} />
      ) : subtypes.length === 0 ? (
        <EmptyState message="No subtypes available in this category yet. Try another category or contact support." />
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {subtypes.map((st) => {
            // Lookup Lucide icon by name — fallback to TestTube
            const IconComponent = st.icon && (Lucide as any)[st.icon]
              ? (Lucide as any)[st.icon]
              : Lucide.TestTube;
            return (
              <SelectionCard
                key={st.slug}
                title={st.name}
                subtitle={st.subtypeTagline ?? undefined}
                icon={<IconComponent size={20} />}
                selected={value === st.slug}
                onClick={() => onChange(st.slug)}
                meta={st.volumeHint ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%', background: TOKENS.primary,
                    }} />
                    Typical volume: {st.volumeHint}
                  </span>
                ) : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      padding: 32, textAlign: 'center',
      background: '#fff', borderRadius: 12,
      border: `1px dashed ${TOKENS.border}`,
      color: TOKENS.textMuted, fontSize: 14,
    }}>{message}</div>
  );
}
