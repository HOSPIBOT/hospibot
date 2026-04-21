'use client';

import { useDiagnosticGroups } from '../_hooks/useDiagnosticCatalog';
import { toEmoji } from '../_lib/icon-map';

interface Props { value: string | null; onChange: (slug: string) => void; }

export default function Step2GroupPicker({ value, onChange }: Props) {
  const { groups } = useDiagnosticGroups();
  if (!groups || groups.length === 0) return <div className="text-center text-sm text-gray-400 py-12">Loading categories...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-center text-gray-900 mb-1">What type of diagnostic lab do you run?</h1>
      <p className="text-sm text-gray-500 text-center mb-8">Choose the category that best describes your facility</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {groups.map(g => (
          <div key={g.slug} onClick={() => onChange(g.slug)}
            style={{
              aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: 20, borderRadius: 16, cursor: 'pointer', textAlign: 'center', transition: 'all 0.25s',
              border: value === g.slug ? '2px solid #0D7C66' : '1.5px solid #D1D9E0',
              background: value === g.slug ? '#E8F5F0' : '#fff',
              boxShadow: value === g.slug ? '0 8px 28px rgba(13,124,102,0.15)' : '0 4px 16px rgba(0,0,0,0.06)',
              transform: value === g.slug ? 'scale(1.02)' : 'none',
            }}
            onMouseEnter={(e: any) => { if (value !== g.slug) { e.currentTarget.style.borderColor = '#0D7C66'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(13,124,102,0.12)'; e.currentTarget.style.transform = 'translateY(-3px)'; } }}
            onMouseLeave={(e: any) => { if (value !== g.slug) { e.currentTarget.style.borderColor = '#D1D9E0'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'none'; } }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>{toEmoji(g.icon)}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>{g.name}</div>
            <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.4, marginBottom: 8 }}>{g.description}</div>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#0D7C66', background: '#E8F5F0', padding: '3px 10px', borderRadius: 100 }}>
              {g.subtypeCount} types
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
