'use client';

import { useDiagnosticGroups, SubtypeGroup } from '../_hooks/useDiagnosticCatalog';

const ICONS: Record<string, string> = {
  collection: '🧪', pathology: '🔬', imaging: '📸', physiological: '💓',
  packages: '📋', specialty: '⚡', 'hub-digital': '🌐',
};

interface Props {
  value: string | null;
  onChange: (slug: string) => void;
}

export default function Step2GroupPicker({ value, onChange }: Props) {
  const { groups } = useDiagnosticGroups();

  if (!groups || groups.length === 0) {
    return <div className="text-center text-sm text-gray-400 py-12">Loading categories...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-center text-gray-900 mb-1">
        What type of diagnostic lab do you run?
      </h1>
      <p className="text-sm text-gray-500 text-center mb-6">Choose the category that best describes your facility</p>
      <div className="grid grid-cols-2 gap-3">
        {groups.map(g => (
          <div key={g.slug} onClick={() => onChange(g.slug)}
            className={`relative p-4 rounded-xl border cursor-pointer transition-all duration-200
              hover:border-[#0D7C66] hover:bg-[#E8F5F0]
              ${value === g.slug ? 'border-2 border-[#0D7C66] bg-[#E8F5F0] shadow-sm' : 'border-gray-200 bg-white'}`}>
            <span className="absolute top-2.5 right-3 text-[11px] font-medium text-[#0D7C66] bg-[#E8F5F0] px-2 py-0.5 rounded-full">
              {g.subtypeCount} types
            </span>
            <div className="text-xl mb-1.5">{ICONS[g.slug] || '🏥'}</div>
            <div className="font-medium text-sm text-gray-900">{g.name}</div>
            <div className="text-xs text-gray-500 mt-1 leading-relaxed">{g.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
