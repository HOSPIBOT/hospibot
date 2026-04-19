'use client';

/**
 * Biosafety checklists — list + create (BSL-2 weekly).
 *
 * Per ICMR Biosafety Guidelines. A checklist is "passed" only if ALL six
 * mandatory items are checked — the backend auto-computes `passed` from
 * the items. The most recent checklist must be within 7 days and passing
 * before any diagnostic report can be released.
 */

import { useState } from 'react';
import {
  PageHeader, Modal, Field, Check, DataTable, StatusPill,
  inputCls, useList, fmtDate, today, savePost,
} from '../_components';
import { RegulatoryGuidance } from '@/lib/regulatory-guidance';
import toast from 'react-hot-toast';

const ITEMS: { key: string; label: string }[] = [
  { key: 'bsc2CertCurrentWithin12Mo', label: 'Biosafety Cabinet (BSC-II) certification current within the last 12 months' },
  { key: 'ppeInventoryAdequate', label: 'PPE inventory adequate — gloves, lab coats, face shields, respirators stocked' },
  { key: 'spillKitsAvailable', label: 'Biohazard spill kits available and accessible in every lab area' },
  { key: 'eyewashStationFunctional', label: 'Emergency eyewash station present and functional (water flow tested)' },
  { key: 'autoclaveSporeTestPassedWithin30D', label: 'Autoclave spore test passed within the last 30 days' },
  { key: 'trainingLogCurrent', label: 'Biosafety training log current — all staff trained within the last 12 months' },
];

export default function BiosafetyPage() {
  const { rows, loading, reload } = useList('/compliance/biosafety/checklists');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    branchId: '',
    checklistDate: today(),
    bsc2CertCurrentWithin12Mo: false,
    ppeInventoryAdequate: false,
    spillKitsAvailable: false,
    eyewashStationFunctional: false,
    autoclaveSporeTestPassedWithin30D: false,
    trainingLogCurrent: false,
    completedByUserId: '',
    notes: '',
  };
  const [form, setForm] = useState(emptyForm);

  const set = (k: string) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggle = (k: string) => (v: boolean) => setForm((f) => ({ ...f, [k]: v }));
  const checkedCount = ITEMS.reduce((n, i) => n + ((form as any)[i.key] ? 1 : 0), 0);
  const willPass = checkedCount === ITEMS.length;

  const submit = async () => {
    if (!form.checklistDate || !form.completedByUserId) {
      toast.error('Checklist date and completed-by user are required');
      return;
    }
    await savePost({
      path: '/compliance/biosafety/checklists',
      body: {
        ...form,
        branchId: form.branchId || null,
      },
      setSaving,
      onDone: () => {
        setShowForm(false);
        setForm(emptyForm);
        reload();
      },
      successMsg: willPass ? 'Biosafety checklist passed ✓' : 'Checklist saved with failing items',
    });
  };

  const tableRows = rows.map((r: any) => {
    const passCount = ITEMS.reduce((n, i) => n + ((r as any)[i.key] ? 1 : 0), 0);
    return [
      <span className="text-sm font-medium text-slate-900">{fmtDate(r.checklistDate)}</span>,
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm text-slate-900 font-semibold">{passCount}/{ITEMS.length}</span>
        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${passCount === ITEMS.length ? 'bg-emerald-500' : 'bg-amber-400'}`}
            style={{ width: `${(passCount / ITEMS.length) * 100}%` }}
          />
        </div>
      </div>,
      r.passed
        ? <StatusPill label="Passed" tone="good" />
        : <StatusPill label="Failed" tone="bad" />,
      <span className="font-mono text-xs text-slate-600">{r.completedByUserId?.slice(0, 8)}…</span>,
      <span className="text-xs text-slate-500">{fmtDate(r.createdAt)}</span>,
    ];
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Biosafety Checklist"
        subtitle="BSL-2 compliance per ICMR Biosafety Guidelines. Must be passing within the last 7 days before any report is released."
        actionLabel="New Checklist"
        onAction={() => setShowForm(true)}
      />

      <DataTable
        columns={['Date', 'Items Passed', 'Status', 'Completed By', 'Filed']}
        rows={tableRows}
        loading={loading}
        empty="No biosafety checklists filed yet. Click 'New Checklist' to file the first one."
      />

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="New Biosafety Checklist (BSL-2)"
        saving={saving}
        onSave={submit}
        saveLabel="File Checklist"
        wide
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Checklist Date" required>
            <input type="date" className={inputCls} value={form.checklistDate} onChange={set('checklistDate')} />
          </Field>
          <Field label="Branch ID">
            <input className={inputCls} value={form.branchId} onChange={set('branchId')} placeholder="Optional" />
          </Field>

          <div className="md:col-span-2 pt-2">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Mandatory Items</div>
              <div className={`text-xs font-bold ${willPass ? 'text-emerald-600' : 'text-amber-600'}`}>
                {checkedCount}/{ITEMS.length} checked — will {willPass ? 'PASS' : 'FAIL'}
              </div>
            </div>
            <div className={`p-4 rounded-xl border ${willPass ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'} space-y-0.5`}>
              {ITEMS.map((i) => (
                <Check
                  key={i.key}
                  label={i.label}
                  value={(form as any)[i.key]}
                  onChange={toggle(i.key)}
                />
              ))}
            </div>
          </div>

          <Field label="Completed By (User ID)" required span={2}>
            <input className={inputCls} value={form.completedByUserId} onChange={set('completedByUserId')} placeholder="Biosafety officer or senior staff member" />
          </Field>
          <Field label="Notes" span={2}>
            <textarea className={`${inputCls} min-h-[70px] resize-y`} value={form.notes} onChange={set('notes')} placeholder="Optional — remediation notes for any failing items" />
          </Field>
        </div>
      </Modal>

      <RegulatoryGuidance
        title="BSL-2 Biosafety Checklist — Regulatory Compliance"
        summary="Biosafety compliance is governed by ICMR/DBT guidelines and WHO Laboratory Biosafety Manual."
        regulations={[
          {
            body: 'ICMR/DBT',
            citation: 'ICMR & DBT — Guidelines for Establishing Biosafety Levels',
            requirement: 'Labs handling pathogenic organisms (TB, HIV, Hepatitis, drug-resistant bacteria) must maintain BSL-2 containment. This requires: Class II Biosafety Cabinet (certified annually), autoclave with spore test validation, PPE (gloves, gowns, eye protection), and documented training.',
          },
          {
            body: 'WHO',
            citation: 'WHO Laboratory Biosafety Manual, 4th Edition (2020)',
            requirement: 'BSL-2 labs must conduct regular biosafety audits covering: BSC certification, spill response preparedness, emergency eyewash functionality, waste autoclave validation (monthly spore test), and staff competency assessment.',
          },
          {
            body: 'CPCB',
            citation: 'BMW Rules 2016 — Lab Waste Treatment',
            requirement: 'All infectious laboratory waste must be pre-treated (autoclaved) at the point of generation before handover to CBWTF. Autoclave validation records (spore test results) must be maintained as evidence of effective decontamination.',
          },
        ]}
      />
    </div>
  );
}
