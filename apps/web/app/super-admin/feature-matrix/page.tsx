'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { SUBTYPE_FEATURES, getSubtypeFeatures, FeatureCategory } from '@/lib/subtype-tier-features';
import toast from 'react-hot-toast';

const TIERS = ['starter', 'growth', 'professional', 'enterprise'] as const;
const TIER_LABELS: Record<string, string> = { starter: 'Starter', growth: 'Growth', professional: 'Professional', enterprise: 'Enterprise' };

const subtypeList = Object.keys(SUBTYPE_FEATURES).filter(k => k !== 'default').sort();

export default function FeatureMatrixPage() {
  const [selectedSubtype, setSelectedSubtype] = useState(subtypeList[0]);
  const [features, setFeatures] = useState<FeatureCategory[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setFeatures(getSubtypeFeatures(selectedSubtype));
  }, [selectedSubtype]);

  const totalFeatures = features.reduce((sum, cat) => sum + cat.features.length, 0);
  const tierCounts = TIERS.map(t => {
    const key = t === 'starter' ? 'starter' : t === 'growth' ? 'growth' : t === 'professional' ? 'professional' : 'enterprise';
    return features.reduce((sum, cat) => sum + cat.features.filter(f => (f as any)[key]).length, 0);
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Feature Matrix</h1>
          <p className="text-sm text-slate-500 mt-1">View feature availability per subtype and tier — {subtypeList.length} subtypes, {totalFeatures} features</p>
        </div>
      </div>

      {/* Subtype Selector */}
      <div className="flex gap-3 mb-6 items-center">
        <label className="text-sm font-medium text-slate-600">Subtype:</label>
        <select value={selectedSubtype} onChange={e => setSelectedSubtype(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-teal-500 max-w-xs">
          {subtypeList.map(s => (
            <option key={s} value={s}>{s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
          ))}
        </select>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search features..."
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm flex-1 max-w-xs" />
      </div>

      {/* Tier Summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {TIERS.map((t, i) => (
          <div key={t} className="bg-white rounded-xl border p-4">
            <p className="text-xs text-slate-500">{TIER_LABELS[t]}</p>
            <p className="text-2xl font-bold text-slate-800">{tierCounts[i]}<span className="text-sm font-normal text-slate-400">/{totalFeatures}</span></p>
            <div className="h-1.5 bg-gray-100 rounded-full mt-2">
              <div className="h-full bg-teal-500 rounded-full" style={{ width: `${(tierCounts[i] / totalFeatures) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Feature Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase w-1/3">Feature</th>
              {TIERS.map(t => (
                <th key={t} className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase">{TIER_LABELS[t]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map(cat => {
              const filteredFeats = search
                ? cat.features.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
                : cat.features;
              if (filteredFeats.length === 0) return null;
              return [
                <tr key={`cat-${cat.category}`} className="bg-gray-50">
                  <td colSpan={5} className="px-4 py-2 text-xs font-bold text-slate-600 uppercase tracking-wider">{cat.category}</td>
                </tr>,
                ...filteredFeats.map((f, i) => (
                  <tr key={`${cat.category}-${i}`} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-2.5 text-slate-700">{f.name}</td>
                    {TIERS.map(t => {
                      const key = t === 'starter' ? 'starter' : t === 'growth' ? 'growth' : t === 'professional' ? 'professional' : 'enterprise';
                      const on = (f as any)[key];
                      return (
                        <td key={t} className="text-center px-3 py-2.5">
                          {on ? (
                            <span className="inline-flex w-5 h-5 items-center justify-center rounded-full bg-teal-100 text-teal-700 text-xs">✓</span>
                          ) : (
                            <span className="inline-flex w-5 h-5 items-center justify-center rounded-full bg-gray-100 text-gray-400 text-xs">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                )),
              ];
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-700">
        This view shows the hardcoded feature matrix. To make features editable by super admin, seed the FeatureGate table and connect this page to the API.
      </div>
    </div>
  );
}
