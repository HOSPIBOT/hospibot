'use client';

/**
 * Super Admin — Feature matrix for a single subtype
 * Route: /super-admin/subtypes/[slug]/features
 *
 * A 2D grid: feature rows × tier columns. Click any cell to toggle that
 * feature on/off for that (subtype, tier) combo. Changes persist as
 * FeatureGate rows in DB with scope = subtype-specific (beats the default).
 *
 * Regulatory features (pndt-form-f, aerb-dose-register, etc.) show a red
 * lock icon — they're treated as advisory in the UI but the backend still
 * accepts overrides. The idea is: a Super Admin can technically disable a
 * compliance feature for a demo/sandbox tenant, but they have to click
 * through a confirmation dialog for each one.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  ArrowLeft, RefreshCw, Loader2, Lock, Check, X, AlertTriangle,
  Activity, Wrench, Shield, Network, FileText, BarChart3,
} from 'lucide-react';

interface Feature {
  id: string;
  key: string;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
  sortOrder: number;
}

interface GateCell {
  id: string;
  isEnabled: boolean;
  scope: 'subtype' | 'default';
}

interface MatrixPayload {
  features: Feature[];
  matrix: Record<string, Record<string, GateCell>>;
}

const TIER_COLUMNS = [
  { key: 'small',      label: 'Small',      color: '#0369A1' },
  { key: 'medium',     label: 'Medium',     color: '#0D7C66' },
  { key: 'large',      label: 'Large',      color: '#7C3AED' },
  { key: 'enterprise', label: 'Enterprise', color: '#1E293B' },
] as const;

const CATEGORY_ICON: Record<string, any> = {
  operations:  Activity,
  billing:     FileText,
  integration: Network,
  compliance:  Shield,
  analytics:   BarChart3,
};

const REGULATORY_KEYS = new Set([
  'pndt-form-f', 'aerb-dose-register', 'pregnancy-pre-radiation',
  'female-radiographer', 'bmw-waste-log', 'biosafety-bsl2',
  'tracer-log', 'bi-rads',
]);

export default function SubtypeFeaturesPage() {
  const params = useParams() as { slug: string };
  const router = useRouter();
  const subtypeSlug = params.slug;

  const [data, setData] = useState<MatrixPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingCell, setSavingCell] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/portal/features/${subtypeSlug}/matrix`);
      setData(res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load feature matrix');
    } finally {
      setLoading(false);
    }
  }, [subtypeSlug]);

  useEffect(() => { load(); }, [load]);

  const groupedFeatures = useMemo(() => {
    const g: Record<string, Feature[]> = {};
    if (!data?.features) return g;
    for (const f of data.features) {
      if (!g[f.category]) g[f.category] = [];
      g[f.category].push(f);
    }
    return g;
  }, [data]);

  const toggleCell = async (featureKey: string, tierKey: string, currentlyEnabled: boolean) => {
    const cellId = `${featureKey}:${tierKey}`;
    const isRegulatory = REGULATORY_KEYS.has(featureKey);

    if (isRegulatory && currentlyEnabled) {
      const confirmed = window.confirm(
        `⚠️  "${featureKey}" is a regulatory requirement under Indian law.\n\n` +
        `Disabling it removes a legal safeguard for ${subtypeSlug} tenants.\n\n` +
        `Continue?`
      );
      if (!confirmed) return;
    }

    setSavingCell(cellId);
    try {
      await api.patch('/super-admin/feature-gates', {
        subtypeSlug, tierKey, featureKey,
        isEnabled: !currentlyEnabled,
      });
      // Optimistic update: patch the local matrix instead of refetching everything
      setData((prev) => {
        if (!prev) return prev;
        const nextMatrix = { ...prev.matrix };
        if (!nextMatrix[featureKey]) nextMatrix[featureKey] = {};
        nextMatrix[featureKey] = {
          ...nextMatrix[featureKey],
          [tierKey]: {
            id: nextMatrix[featureKey][tierKey]?.id || 'pending',
            isEnabled: !currentlyEnabled,
            scope: 'subtype',
          },
        };
        return { ...prev, matrix: nextMatrix };
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update');
    } finally {
      setSavingCell(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <button
          onClick={() => router.push('/super-admin/subtypes')}
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors flex-shrink-0"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Feature Matrix</h1>
          <p className="text-sm text-slate-500">
            Subtype: <code className="px-1.5 py-0.5 bg-slate-100 rounded font-mono text-slate-700">{subtypeSlug}</code> ·
            Toggle any cell to enable/disable that feature at that tier. Subtype-specific
            overrides win over global defaults.
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors flex-shrink-0"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs text-slate-500 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-400 flex items-center justify-center">
            <Check size={10} className="text-emerald-700" strokeWidth={3} />
          </div>
          Enabled
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-slate-50 border border-slate-200 flex items-center justify-center">
            <X size={10} className="text-slate-400" strokeWidth={2.5} />
          </div>
          Disabled
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300 flex items-center justify-center opacity-60">
            <Check size={10} className="text-emerald-700" strokeWidth={3} />
          </div>
          Inherited from default
        </div>
        <div className="flex items-center gap-1.5">
          <Lock size={12} className="text-red-500" />
          Regulatory (confirm before disabling)
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="animate-spin text-slate-400" size={32} />
        </div>
      ) : !data || data.features.length === 0 ? (
        <div className="p-10 text-center bg-white border border-dashed border-slate-200 rounded-xl text-sm text-slate-500">
          No features in catalog yet. Seed may not have run — try {' '}
          <code className="px-1.5 py-0.5 bg-slate-100 rounded">npm run db:seed</code>.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-slate-700">Feature</th>
                {TIER_COLUMNS.map((t) => (
                  <th key={t.key} className="px-3 py-3 text-center font-semibold text-slate-700 w-28">
                    <span
                      className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                      style={{ background: `${t.color}15`, color: t.color }}
                    >
                      {t.label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedFeatures).map(([category, features]) => (
                <CategoryGroup
                  key={category}
                  category={category}
                  features={features}
                  matrix={data.matrix}
                  savingCell={savingCell}
                  onToggle={toggleCell}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

function CategoryGroup({
  category, features, matrix, savingCell, onToggle,
}: {
  category: string;
  features: Feature[];
  matrix: Record<string, Record<string, GateCell>>;
  savingCell: string | null;
  onToggle: (featureKey: string, tierKey: string, currentlyEnabled: boolean) => void;
}) {
  const Icon = CATEGORY_ICON[category] ?? Wrench;
  return (
    <>
      <tr className="bg-slate-50 border-b border-slate-200">
        <td colSpan={5} className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <Icon size={13} /> {category}
        </td>
      </tr>
      {features.map((feature) => (
        <tr key={feature.key} className="border-b border-slate-100 hover:bg-slate-50/50">
          <td className="px-5 py-3">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {REGULATORY_KEYS.has(feature.key) && (
                    <Lock size={12} className="text-red-500 flex-shrink-0" />
                  )}
                  <span className="text-sm font-medium text-slate-900">{feature.name}</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{feature.description}</div>
                <code className="inline-block mt-1 text-xs px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-mono">
                  {feature.key}
                </code>
              </div>
            </div>
          </td>
          {TIER_COLUMNS.map((t) => {
            const cell = matrix[feature.key]?.[t.key];
            const enabled = cell?.isEnabled ?? false;
            const inherited = cell?.scope === 'default';
            const cellId = `${feature.key}:${t.key}`;
            const isSaving = savingCell === cellId;
            return (
              <td key={t.key} className="px-3 py-3 text-center">
                <button
                  onClick={() => onToggle(feature.key, t.key, enabled)}
                  disabled={isSaving}
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center mx-auto transition-all ${
                    enabled
                      ? inherited
                        ? 'bg-emerald-100/60 border-emerald-300 text-emerald-600'
                        : 'bg-emerald-100 border-emerald-400 text-emerald-700'
                      : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                  } ${isSaving ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                  title={
                    enabled
                      ? `Enabled${inherited ? ' (inherited from global default)' : ' (subtype-specific)'}`
                      : 'Disabled'
                  }
                >
                  {isSaving ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : enabled ? (
                    <Check size={14} strokeWidth={3} />
                  ) : (
                    <X size={12} strokeWidth={2.5} />
                  )}
                </button>
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
