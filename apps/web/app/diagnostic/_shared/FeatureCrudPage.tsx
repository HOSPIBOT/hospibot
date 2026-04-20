'use client';
import React, { useState, useMemo, useCallback } from 'react';
import { useFeatureGate, FeatureLockedBlock } from '@/lib/feature-gate';
import { RegulatoryGuidance, Regulation } from '@/lib/regulatory-guidance';
import {
  PageHeader, Modal, Field, DataTable, inputCls,
  useList, fmtDate, savePost, TEAL,
} from '../compliance/_components';

/* ── Field & Column types ── */
export interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox';
  required?: boolean;
  options?: string[];
  placeholder?: string;
  span?: 1 | 2;
}

export interface ColDef {
  key: string;
  label: string;
  fmt?: 'date' | 'status';
}

export interface FeatureConfig {
  slug: string;
  title: string;
  subtitle: string;
  apiPath: string;
  regulations: Regulation[];
  columns: ColDef[];
  formFields: FieldDef[];
  createLabel?: string;
}

/* ── Status badge ── */
function StatusBadge({ value }: { value?: string }) {
  const s = value || 'unknown';
  const isGood = ['active','completed','pass','approved','delivered','in-stock','submitted','classified'].includes(s);
  const isBad = ['expired','failed','rejected','critical','cancelled'].includes(s);
  const cls = isGood ? 'bg-emerald-50 text-emerald-700' : isBad ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700';
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>{s}</span>;
}

/* ── Main component ── */
export default function FeatureCrudPage({ config }: { config: FeatureConfig }) {
  const gate = useFeatureGate(config.slug);
  const { rows, loading, reload } = useList(config.apiPath);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  const setF = useCallback((key: string, val: any) => setForm(prev => ({ ...prev, [key]: val })), []);

  const handleCreate = async () => {
    await savePost({
      path: config.apiPath, body: form, setSaving,
      onDone: () => { setShowCreate(false); setForm({}); reload(); },
      successMsg: `${config.title} record created`,
    });
  };

  /* Build table data */
  const colHeaders = useMemo(() => config.columns.map(c => c.label), [config.columns]);
  const tableRows = useMemo(() =>
    rows.map((r: any) => config.columns.map(c => {
      if (c.fmt === 'status') return <StatusBadge value={r[c.key]} />;
      if (c.fmt === 'date') return fmtDate(r[c.key]);
      return r[c.key] ?? '—';
    })),
  [rows, config.columns]);

  if (gate.locked) return <FeatureLockedBlock gate={gate} />;

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader
        title={config.title}
        subtitle={config.subtitle}
        actionLabel={config.createLabel || `Add Record`}
        onAction={() => setShowCreate(true)}
      />

      {config.regulations.length > 0 && (
        <div className="mb-6">
          <RegulatoryGuidance
            title={`${config.title} — Regulatory Guidance`}
            regulations={config.regulations}
          />
        </div>
      )}

      <DataTable columns={colHeaders} rows={tableRows} loading={loading}
        empty={`No records yet. Click "Add Record" to create your first entry.`}
      />

      <Modal open={showCreate} onClose={() => { setShowCreate(false); setForm({}); }}
        title={`New ${config.title} Record`} saving={saving} onSave={handleCreate} wide
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {config.formFields.map(f => (
            <Field key={f.key} label={f.label} required={f.required} span={f.span}>
              {f.type === 'select' ? (
                <select className={inputCls} value={form[f.key] ?? ''} onChange={e => setF(f.key, e.target.value)}>
                  <option value="">Select…</option>
                  {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea className={`${inputCls} min-h-[80px]`} placeholder={f.placeholder}
                  value={form[f.key] ?? ''} onChange={e => setF(f.key, e.target.value)} />
              ) : f.type === 'checkbox' ? (
                <label className="flex items-center gap-2 mt-1 cursor-pointer">
                  <input type="checkbox" checked={!!form[f.key]} onChange={e => setF(f.key, e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#0D7C66] focus:ring-[#0D7C66]" />
                  <span className="text-sm text-slate-600">{f.placeholder || 'Yes'}</span>
                </label>
              ) : (
                <input className={inputCls} type={f.type} placeholder={f.placeholder}
                  value={form[f.key] ?? ''} onChange={e => setF(f.key, f.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)} />
              )}
            </Field>
          ))}
        </div>
      </Modal>
    </div>
  );
}
