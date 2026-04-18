'use client';

/**
 * Super Admin — Plans & Pricing
 *
 * Reads live tier configs from /super-admin/tier-configs and lets the admin
 * edit pricing + limits without a code deploy. Changes persist in DB and
 * take effect on the next registration + next /portal/tier-configs fetch.
 *
 * Scope convention mirrors the backend:
 *   'default'                — baseline for all portals
 *   'family:<familySlug>'    — override for an entire portal family
 *   'subtype:<subtypeSlug>'  — override for a specific subtype
 *
 * This page shows only 'default' rows in the main list, with a sidebar
 * filter to switch between scopes.
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Crown, TrendingUp, Shield, Zap, RefreshCw, Loader2, Save, IndianRupee,
  Pencil, Check, X,
} from 'lucide-react';

interface TierConfig {
  id: string;
  scope: string;
  tierKey: 'small' | 'medium' | 'large' | 'enterprise';
  displayName: string;
  tagline: string;
  priceMonthly: number | null;   // in paise
  priceAnnual: number | null;    // in paise
  currency: string;
  color: string;
  badge: string | null;
  dailyVolumeMin: number | null;
  dailyVolumeMax: number | null;
  branchesAllowed: number;
  staffAllowed: number;
  waMessagesPerMonth: number;
  smsPerMonth: number;
  storageGB: number;
  isActive: boolean;
  sortOrder: number;
  updatedAt: string;
  updatedBy: string | null;
}

const TIER_ICON: Record<string, any> = {
  small: Zap, medium: TrendingUp, large: Shield, enterprise: Crown,
};

export default function PlansPage() {
  const [rows, setRows] = useState<TierConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState('default');
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/super-admin/tier-configs', { params: { scope } });
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load tier configs');
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Plans & Pricing</h1>
          <p className="text-sm text-slate-500">
            Edit tier pricing and limits. Changes take effect immediately — no code deploy.
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Scope selector */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Scope</span>
        {['default', 'family:diagnostic', 'family:clinical', 'family:pharmacy'].map((s) => (
          <button
            key={s}
            onClick={() => setScope(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              scope === s
                ? 'bg-teal-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s === 'default' ? 'Global defaults' : s.replace('family:', '')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="animate-spin text-slate-400" size={32} />
        </div>
      ) : rows.length === 0 ? (
        <div className="p-10 text-center bg-white border border-dashed border-slate-200 rounded-xl text-sm text-slate-500">
          No tier configs found for scope "{scope}". Run <code className="px-1.5 py-0.5 bg-slate-100 rounded">npm run db:seed</code> or
          wait for the background seed to finish after the last deploy.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <TierRow
              key={row.id}
              row={row}
              isEditing={editingId === row.id}
              onEdit={() => setEditingId(row.id)}
              onCancel={() => setEditingId(null)}
              onSaved={() => { setEditingId(null); load(); }}
            />
          ))}
        </div>
      )}

      {/* Footer note */}
      <div className="mt-10 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
        <strong>Heads up:</strong> Prices are stored in paise (1/100 of a rupee).
        Display shows rupees. The registration wizard reads these values in real time, so
        changes here reflect on the next visit to <code>/register</code>.
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

function TierRow({
  row, isEditing, onEdit, onCancel, onSaved,
}: {
  row: TierConfig;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const Icon = TIER_ICON[row.tierKey] ?? Zap;
  const [draft, setDraft] = useState({
    displayName: row.displayName,
    tagline: row.tagline,
    priceMonthlyRupees: row.priceMonthly != null ? row.priceMonthly / 100 : null,
    priceAnnualRupees: row.priceAnnual != null ? row.priceAnnual / 100 : null,
    branchesAllowed: row.branchesAllowed,
    staffAllowed: row.staffAllowed,
    waMessagesPerMonth: row.waMessagesPerMonth,
    smsPerMonth: row.smsPerMonth,
    storageGB: row.storageGB,
    isActive: row.isActive,
  });
  const [saving, setSaving] = useState(false);

  // Reset draft whenever we enter edit mode fresh
  useEffect(() => {
    if (isEditing) {
      setDraft({
        displayName: row.displayName,
        tagline: row.tagline,
        priceMonthlyRupees: row.priceMonthly != null ? row.priceMonthly / 100 : null,
        priceAnnualRupees: row.priceAnnual != null ? row.priceAnnual / 100 : null,
        branchesAllowed: row.branchesAllowed,
        staffAllowed: row.staffAllowed,
        waMessagesPerMonth: row.waMessagesPerMonth,
        smsPerMonth: row.smsPerMonth,
        storageGB: row.storageGB,
        isActive: row.isActive,
      });
    }
  }, [isEditing, row]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        displayName: draft.displayName,
        tagline: draft.tagline,
        priceMonthly: draft.priceMonthlyRupees != null ? Math.round(draft.priceMonthlyRupees * 100) : null,
        priceAnnual:  draft.priceAnnualRupees  != null ? Math.round(draft.priceAnnualRupees  * 100) : null,
        branchesAllowed: Number(draft.branchesAllowed),
        staffAllowed:    Number(draft.staffAllowed),
        waMessagesPerMonth: Number(draft.waMessagesPerMonth),
        smsPerMonth:     Number(draft.smsPerMonth),
        storageGB:       Number(draft.storageGB),
        isActive: draft.isActive,
      };
      await api.patch(`/super-admin/tier-configs/${row.id}`, payload);
      toast.success(`Updated ${row.displayName}`);
      onSaved();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const priceDisplay = (paise: number | null) => {
    if (paise == null) return 'Contact sales';
    return `₹${(paise / 100).toLocaleString('en-IN')}`;
  };

  return (
    <div
      className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors"
      style={{ borderLeftWidth: 4, borderLeftColor: row.color }}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${row.color}20`, color: row.color }}
        >
          <Icon size={20} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            {isEditing ? (
              <input
                value={draft.displayName}
                onChange={(e) => setDraft((d) => ({ ...d, displayName: e.target.value }))}
                className="px-2 py-1 text-base font-semibold border border-slate-200 rounded"
              />
            ) : (
              <h3 className="text-base font-semibold text-slate-900">{row.displayName}</h3>
            )}
            <code className="text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-mono">
              {row.tierKey}
            </code>
            {row.badge && (
              <span
                className="text-xs px-2 py-0.5 rounded font-medium"
                style={{ background: `${row.color}20`, color: row.color }}
              >
                {row.badge}
              </span>
            )}
            {!row.isActive && (
              <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 font-medium">
                Inactive
              </span>
            )}
          </div>

          {isEditing ? (
            <textarea
              value={draft.tagline}
              onChange={(e) => setDraft((d) => ({ ...d, tagline: e.target.value }))}
              rows={2}
              className="w-full mt-1 px-2 py-1 text-sm border border-slate-200 rounded"
            />
          ) : (
            <p className="text-sm text-slate-500 mb-4">{row.tagline}</p>
          )}

          {/* Pricing + limits grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <PriceField
              label="Monthly price (₹)"
              value={draft.priceMonthlyRupees}
              onChange={(v) => setDraft((d) => ({ ...d, priceMonthlyRupees: v }))}
              isEditing={isEditing}
              displayValue={priceDisplay(row.priceMonthly)}
            />
            <PriceField
              label="Annual price (₹)"
              value={draft.priceAnnualRupees}
              onChange={(v) => setDraft((d) => ({ ...d, priceAnnualRupees: v }))}
              isEditing={isEditing}
              displayValue={priceDisplay(row.priceAnnual)}
              helper={draft.priceMonthlyRupees ? `Recommended: ₹${(draft.priceMonthlyRupees * 10).toLocaleString('en-IN')} (2 mo free)` : undefined}
            />
            <NumField
              label="Branches"
              value={draft.branchesAllowed}
              onChange={(v) => setDraft((d) => ({ ...d, branchesAllowed: v }))}
              isEditing={isEditing}
              displayValue={row.branchesAllowed.toLocaleString()}
            />
            <NumField
              label="Staff users"
              value={draft.staffAllowed}
              onChange={(v) => setDraft((d) => ({ ...d, staffAllowed: v }))}
              isEditing={isEditing}
              displayValue={row.staffAllowed.toLocaleString()}
            />
            <NumField
              label="WhatsApp msgs/mo"
              value={draft.waMessagesPerMonth}
              onChange={(v) => setDraft((d) => ({ ...d, waMessagesPerMonth: v }))}
              isEditing={isEditing}
              displayValue={row.waMessagesPerMonth.toLocaleString()}
            />
            <NumField
              label="SMS/mo"
              value={draft.smsPerMonth}
              onChange={(v) => setDraft((d) => ({ ...d, smsPerMonth: v }))}
              isEditing={isEditing}
              displayValue={row.smsPerMonth.toLocaleString()}
            />
            <NumField
              label="Storage (GB)"
              value={draft.storageGB}
              onChange={(v) => setDraft((d) => ({ ...d, storageGB: v }))}
              isEditing={isEditing}
              displayValue={`${row.storageGB} GB`}
            />
            {isEditing && (
              <label className="flex flex-col justify-end">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Active</span>
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, isActive: !d.isActive }))}
                  className={`h-10 px-3 rounded-lg border text-sm font-medium transition-colors ${
                    draft.isActive
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}
                >
                  {draft.isActive ? '✓ Enabled' : '✗ Disabled'}
                </button>
              </label>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          {!isEditing && (
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <Pencil size={14} /> Edit
            </button>
          )}
          {isEditing && (
            <>
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60 transition-colors"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={onCancel}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <X size={14} /> Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Footer — updated metadata */}
      {!isEditing && (
        <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
          Last updated {new Date(row.updatedAt).toLocaleString()}
          {row.updatedBy ? ` · by ${row.updatedBy.slice(0, 8)}` : ''}
        </div>
      )}
    </div>
  );
}

/* ── Inline field components ─────────────────────────────────────────── */

function PriceField({
  label, value, onChange, isEditing, displayValue, helper,
}: {
  label: string; value: number | null; onChange: (v: number | null) => void;
  isEditing: boolean; displayValue: string; helper?: string;
}) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</div>
      {isEditing ? (
        <div>
          <div className="relative">
            <IndianRupee size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="number"
              value={value ?? ''}
              onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
              placeholder="Contact sales"
              className="w-full h-10 pl-7 pr-2 text-sm border border-slate-200 rounded-lg focus:border-teal-500 outline-none"
            />
          </div>
          {helper && <div className="text-xs text-slate-400 mt-1">{helper}</div>}
        </div>
      ) : (
        <div className="text-sm font-semibold text-slate-900">{displayValue}</div>
      )}
    </div>
  );
}

function NumField({
  label, value, onChange, isEditing, displayValue,
}: {
  label: string; value: number; onChange: (v: number) => void;
  isEditing: boolean; displayValue: string;
}) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</div>
      {isEditing ? (
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-10 px-2.5 text-sm border border-slate-200 rounded-lg focus:border-teal-500 outline-none"
        />
      ) : (
        <div className="text-sm font-semibold text-slate-900">{displayValue}</div>
      )}
    </div>
  );
}
