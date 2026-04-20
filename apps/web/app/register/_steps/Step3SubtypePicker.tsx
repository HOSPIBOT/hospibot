'use client';

import { SubtypeCard } from '../_hooks/useDiagnosticCatalog';

interface Props {
  groupName: string;
  subtypes: SubtypeCard[];
  selected: string | null;
  onSelect: (slug: string) => void;
  loading?: boolean;
}

export default function Step3SubtypePicker({ groupName, subtypes, selected, onSelect, loading }: Props) {
  if (loading) return <div className="text-center text-sm text-gray-400 py-12">Loading subtypes...</div>;
  return (
    <div>
      <h1 className="text-2xl font-semibold text-center text-gray-900 mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
        Select your specific lab type
      </h1>
      <p className="text-sm text-gray-500 text-center mb-6">{groupName} — {subtypes.length} subtypes available</p>
      <div className="space-y-2">
        {subtypes.map(s => (
          <div key={s.slug} onClick={() => onSelect(s.slug)}
            className={`flex items-center gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all duration-200
              hover:border-[#0D7C66] hover:bg-[#E8F5F0]
              ${selected === s.slug ? 'border-2 border-[#0D7C66] bg-[#E8F5F0] shadow-sm' : 'border-gray-200 bg-white'}`}>
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center text-lg flex-shrink-0 transition-colors
              ${selected === s.slug ? 'bg-[#0D7C66] grayscale-0' : 'bg-[#E8F5F0]'}`}
              style={selected === s.slug ? { filter: 'grayscale(0)' } : {}}>
              {s.icon || '🏥'}
            </div>
            <div className="min-w-0">
              <div className="font-medium text-sm text-gray-900">{s.name}</div>
              <div className="text-xs text-gray-500 leading-snug mt-0.5">{s.subtypeTagline || ''}</div>
              {s.volumeHint && <div className="text-[11px] font-medium text-[#0D7C66] mt-1">{s.volumeHint}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
