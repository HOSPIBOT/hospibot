'use client';

interface TierOption {
  id: string;
  label: string;
  price: string;
  priceNote: string;
  dailySamples: string;
  staff: string;
  branches: string;
  features: string[];
  notIncluded: string[];
  badge?: string;
}

interface Props {
  tiers: TierOption[];
  selected: string | null;
  onSelect: (id: string) => void;
  subtypeName?: string;
}

export default function Step4TierPicker({ tiers, selected, onSelect, subtypeName }: Props) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-center text-gray-900 mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
        Choose your scale of operations
      </h1>
      <p className="text-sm text-gray-500 text-center mb-6">
        Select the plan that matches {subtypeName ? `your ${subtypeName}'s` : "your lab's"} daily volume
      </p>
      <div className="grid grid-cols-2 gap-3">
        {tiers.map(t => {
          const isPop = t.badge === 'POPULAR' || t.id === 'medium';
          return (
            <div key={t.id} onClick={() => onSelect(t.id)}
              className={`relative p-4 rounded-xl border cursor-pointer transition-all duration-200
                hover:border-[#0D7C66]
                ${selected === t.id ? 'border-2 border-[#0D7C66] bg-[#E8F5F0] shadow-sm' : isPop ? 'border-amber-400 bg-white' : 'border-gray-200 bg-white'}`}>
              {isPop && (
                <div className="absolute -top-px right-4 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-b-lg tracking-wider">
                  POPULAR
                </div>
              )}
              <div className="font-bold text-base text-gray-900">{t.label}</div>
              <div className="text-2xl font-bold text-[#0D7C66] my-1.5" style={{ fontFamily: "'Fraunces', serif" }}>
                {t.price} <span className="text-xs font-normal text-gray-400">{t.priceNote}</span>
              </div>
              <div className="text-[11px] text-gray-500 mb-3 leading-relaxed">
                {t.dailySamples} samples/day · {t.staff} staff · {t.branches} branch{t.branches === '1' ? '' : 'es'}
              </div>
              <ul className="space-y-1.5">
                {t.features.map((f, i) => (
                  <li key={i} className="text-[11px] text-gray-700 pl-4 relative leading-snug">
                    <span className="absolute left-0 top-[5px] w-2 h-2 rounded-full border-[1.5px] border-[#0D7C66] bg-[#E8F5F0]" />
                    {f}
                  </li>
                ))}
                {t.notIncluded.map((f, i) => (
                  <li key={i} className="text-[11px] text-gray-400 pl-4 relative leading-snug">
                    <span className="absolute left-0 top-[5px] w-2 h-2 rounded-full border border-gray-200" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
