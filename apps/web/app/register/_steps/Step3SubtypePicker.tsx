'use client';

import { useDiagnosticSubtypes } from '../_hooks/useDiagnosticCatalog';
import { toEmoji } from '../_lib/icon-map';

interface Props { groupSlug: string | null; groupName?: string; value: string | null; onChange: (slug: string) => void; }

export default function Step3SubtypePicker({ groupSlug, groupName, value, onChange }: Props) {
  const { subtypes, loading } = useDiagnosticSubtypes(groupSlug);
  if (loading) return <div className="text-center text-sm text-gray-400 py-12">Loading subtypes...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-center text-gray-900 mb-1">Select your specific lab type</h1>
      <p className="text-sm text-gray-500 text-center mb-8">{groupName || groupSlug} — {subtypes.length} subtypes available</p>
      <div style={{ display: 'grid', gridTemplateColumns: subtypes.length <= 6 ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)', gap: 12 }}>
        {subtypes.map(s => (
          <div key={s.slug} onClick={() => onChange(s.slug)}
            style={{
              aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: 16, borderRadius: 14, cursor: 'pointer', textAlign: 'center', transition: 'all 0.25s',
              border: value === s.slug ? '2px solid #0D7C66' : '1.5px solid #D1D9E0',
              background: value === s.slug ? '#E8F5F0' : '#fff',
              boxShadow: value === s.slug ? '0 8px 28px rgba(13,124,102,0.15)' : '0 4px 16px rgba(0,0,0,0.06)',
              transform: value === s.slug ? 'scale(1.02)' : 'none',
            }}
            onMouseEnter={(e: any) => { if (value !== s.slug) { e.currentTarget.style.borderColor = '#0D7C66'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(13,124,102,0.12)'; e.currentTarget.style.transform = 'translateY(-3px)'; } }}
            onMouseLeave={(e: any) => { if (value !== s.slug) { e.currentTarget.style.borderColor = '#D1D9E0'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'none'; } }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 8, background: value === s.slug ? '#0D7C66' : '#E8F5F0' }}>
              {toEmoji(s.icon)}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1E293B', lineHeight: 1.3 }}>{s.name}</div>
            {s.volumeHint && <div style={{ fontSize: 10, color: '#0D7C66', marginTop: 4, fontWeight: 600 }}>{s.volumeHint}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
