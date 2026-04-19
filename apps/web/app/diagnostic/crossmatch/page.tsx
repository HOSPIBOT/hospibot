'use client';

/**
 * Crossmatch Register — D&C Rules Schedule F Part XII-B Issue Register.
 *
 * Regulatory references:
 *   - D&C Rules 1945, Schedule F Part XII-B — mandatory issue register fields
 *   - NACO/NBTC Standards — ABO compatibility + antiglobulin test
 *   - NBTC: crossmatch must include antiglobulin test (Coombs)
 *
 * Feature gate: 'crossmatch' → minTier: 'small', allowedSubtypes: ['blood-bank']
 */

import { useState, useMemo } from 'react';
import { useFeatureGate, FeatureLockedBlock } from '@/lib/feature-gate';
import { RegulatoryGuidance } from '@/lib/regulatory-guidance';
import {
  PageHeader, Modal, Field, DataTable, StatusPill,
  useList, savePost, fmtDate, fmtDateTime, today, TEAL,
} from '../compliance/_components';

const BLOOD_GROUPS = ['A', 'B', 'AB', 'O'];
const RH = ['POSITIVE', 'NEGATIVE'];
const COMPONENTS = [
  { value: 'WHOLE_BLOOD', label: 'Whole Blood' },
  { value: 'PRBC', label: 'PRBC' },
  { value: 'FFP', label: 'FFP' },
  { value: 'PLATELETS', label: 'Platelets' },
  { value: 'CRYO', label: 'Cryoprecipitate' },
];
const INDICATIONS = [
  { value: 'surgical', label: 'Surgical' },
  { value: 'medical', label: 'Medical' },
  { value: 'obstetric', label: 'Obstetric' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'exchange_transfusion', label: 'Exchange Transfusion' },
];

// ABO compatibility check (cellular products)
const ABO_COMPAT: Record<string, string[]> = {
  O: ['O', 'A', 'B', 'AB'], A: ['A', 'AB'], B: ['B', 'AB'], AB: ['AB'],
};
const PLASMA_COMPAT: Record<string, string[]> = {
  AB: ['O', 'A', 'B', 'AB'], A: ['A', 'O'], B: ['B', 'O'], O: ['O'],
};

export default function CrossmatchPage() {
  const gate = useFeatureGate('crossmatch');
  if (!gate.allowed) return <FeatureLockedBlock gate={gate} />;
  return <CrossmatchContent />;
}

function CrossmatchContent() {
  const { rows, loading, reload } = useList('/crossmatch/records');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const blank = {
    requestDate: today(), bagSerialNumber: '',
    donorBloodGroup: 'O', donorRhFactor: 'POSITIVE',
    quantityMl: '450', componentType: 'PRBC',
    recipientName: '', recipientBloodGroup: 'O', recipientRhFactor: 'POSITIVE',
    recipientHospital: '', recipientWard: '',
    indicationForTransfusion: 'surgical',
    immediateSpinResult: 'COMPATIBLE', iatCoombsResult: '',
    antibodyScreenResult: '', antibodyIdentified: '',
    testedByUserId: '', medicalOfficerName: '', notes: '',
  };
  const [form, setForm] = useState(blank);
  const patch = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Live ABO compatibility check
  const compat = useMemo(() => {
    const isPlasma = form.componentType === 'FFP' || form.componentType === 'CRYO';
    const matrix = isPlasma ? PLASMA_COMPAT : ABO_COMPAT;
    const aboOk = matrix[form.donorBloodGroup]?.includes(form.recipientBloodGroup) ?? false;
    const rhOk = form.donorRhFactor === 'NEGATIVE' || form.recipientRhFactor === 'POSITIVE';
    return { aboOk, rhOk, ok: aboOk && rhOk };
  }, [form.donorBloodGroup, form.donorRhFactor, form.recipientBloodGroup, form.recipientRhFactor, form.componentType]);

  const canSave = form.bagSerialNumber.trim() && form.recipientName.trim() && form.testedByUserId.trim();

  const handleSave = () => {
    if (!canSave) return;
    savePost({
      path: '/crossmatch/records',
      body: { ...form, quantityMl: Number(form.quantityMl) },
      setSaving,
      onDone: () => { setOpen(false); setForm(blank); reload(); },
      successMsg: compat.ok ? 'Crossmatch recorded — COMPATIBLE' : 'Crossmatch recorded — INCOMPATIBLE',
    });
  };

  const bgColor = (bg: string) =>
    bg === 'O' ? '#DBEAFE' : bg === 'A' ? '#FEF9C3' : bg === 'B' ? '#FCE7F3' : '#F3F4F6';
  const bgText = (bg: string) =>
    bg === 'O' ? '#1E40AF' : bg === 'A' ? '#92400E' : bg === 'B' ? '#9D174D' : '#374151';

  const tableRows = rows.map((r: any) => [
    <span className="font-mono text-xs font-bold text-slate-700">{r.serialNumber}</span>,
    <span className="text-xs text-slate-600">{fmtDate(r.requestDate)}</span>,
    <span className="text-xs text-slate-700">{r.bagSerialNumber}</span>,
    <span style={{ background: bgColor(r.donorBloodGroup), color: bgText(r.donorBloodGroup) }}
      className="text-xs px-1.5 py-0.5 rounded-full font-bold">
      {r.donorBloodGroup}{r.donorRhFactor === 'POSITIVE' ? '+' : '−'}
    </span>,
    <span className="text-xs text-slate-700">{r.recipientName}</span>,
    <span style={{ background: bgColor(r.recipientBloodGroup), color: bgText(r.recipientBloodGroup) }}
      className="text-xs px-1.5 py-0.5 rounded-full font-bold">
      {r.recipientBloodGroup}{r.recipientRhFactor === 'POSITIVE' ? '+' : '−'}
    </span>,
    r.finalResult === 'COMPATIBLE'
      ? <StatusPill label="Compatible" tone="good" />
      : r.finalResult === 'LEAST_INCOMPATIBLE'
        ? <StatusPill label="Least Incomp." tone="warn" />
        : <StatusPill label="Incompatible" tone="bad" />,
    r.issuedAt
      ? <span className="text-xs text-emerald-700 font-semibold">Issued {fmtDateTime(r.issuedAt)}</span>
      : <span className="text-xs text-slate-400">Not issued</span>,
  ]);

  return (
    <div className="p-6">
      <PageHeader
        title="Crossmatch Register"
        subtitle="D&C Rules Issue Register — ABO/Rh compatibility testing per NACO standards"
        onAction={() => setOpen(true)}
        actionLabel="New Crossmatch"
      />

      <DataTable
        columns={['Serial #', 'Date', 'Bag #', 'Donor', 'Recipient', 'Recipient Group', 'Result', 'Issued']}
        rows={tableRows}
        loading={loading}
        empty="No crossmatch records yet."
      />

      <RegulatoryGuidance
        title="Crossmatch & Blood Issue — Regulatory Compliance"
        summary="Crossmatching and blood issue are governed by D&C Rules 1945 and NACO/NBTC Standards."
        regulations={[
          {
            body: 'DCGI',
            citation: 'D&C Rules 1945, Schedule F Part XII-B — Issue Register',
            requirement: 'The Issue Register must record: serial number, date/time of issue, bag serial number, ABO/Rh group, quantity in ml, recipient name and address, recipient group, hospital/unit, crossmatch report details, and indication for transfusion. Records retained 5 years.',
            url: 'https://cdsco.gov.in',
          },
          {
            body: 'NACO/NBTC',
            citation: 'NACO Standards for Blood Banks — Crossmatch Requirements',
            requirement: 'Donor cells from bag segment + recipient serum/plasma must be crossmatched. Method must demonstrate ABO incompatibility and clinically significant unexpected antibodies. Antiglobulin test (indirect Coombs) is mandatory unless antibody screen is negative with no prior antibody history.',
            url: 'https://nbtc.naco.gov.in',
          },
          {
            body: 'NACO',
            citation: 'NACO — Donor Unit Re-confirmation',
            requirement: 'Blood group of the bag being issued MUST be re-confirmed by testing the sample from the donor tubing segment attached to the bag. The bag label must match the crossmatch report before issue.',
          },
          {
            body: 'NACO',
            citation: 'NACO — Hemovigilance Reporting',
            requirement: 'All suspected transfusion reactions must be evaluated promptly. Details of all cases with evaluation interpretation must be recorded and reported to the transfusion service. The blood bank must have a system for detection, reporting, and evaluation of adverse reactions.',
          },
        ]}
      />

      <Modal open={open} onClose={() => setOpen(false)} title="New Crossmatch Test"
        saving={saving} onSave={handleSave} saveLabel="Record Crossmatch" wide>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* ── Donor Unit ── */}
          <div className="md:col-span-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Donor Unit</div>
          </div>
          <Field label="Bag Serial Number" required>
            <input type="text" value={form.bagSerialNumber} onChange={(e) => patch('bagSerialNumber', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </Field>
          <Field label="Donor Blood Group" required>
            <select value={form.donorBloodGroup} onChange={(e) => patch('donorBloodGroup', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="Donor Rh" required>
            <select value={form.donorRhFactor} onChange={(e) => patch('donorRhFactor', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              {RH.map((r) => <option key={r} value={r}>{r === 'POSITIVE' ? 'Rh+' : 'Rh−'}</option>)}
            </select>
          </Field>
          <Field label="Component">
            <select value={form.componentType} onChange={(e) => patch('componentType', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              {COMPONENTS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="Quantity (ml)">
            <input type="number" value={form.quantityMl} onChange={(e) => patch('quantityMl', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </Field>

          {/* ── Recipient ── */}
          <div className="md:col-span-3 mt-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recipient</div>
          </div>
          <Field label="Recipient Name" required>
            <input type="text" value={form.recipientName} onChange={(e) => patch('recipientName', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </Field>
          <Field label="Recipient Blood Group" required>
            <select value={form.recipientBloodGroup} onChange={(e) => patch('recipientBloodGroup', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="Recipient Rh" required>
            <select value={form.recipientRhFactor} onChange={(e) => patch('recipientRhFactor', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              {RH.map((r) => <option key={r} value={r}>{r === 'POSITIVE' ? 'Rh+' : 'Rh−'}</option>)}
            </select>
          </Field>
          <Field label="Hospital / Unit">
            <input type="text" value={form.recipientHospital} onChange={(e) => patch('recipientHospital', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </Field>
          <Field label="Ward">
            <input type="text" value={form.recipientWard} onChange={(e) => patch('recipientWard', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </Field>
          <Field label="Indication" required>
            <select value={form.indicationForTransfusion} onChange={(e) => patch('indicationForTransfusion', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              {INDICATIONS.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
            </select>
          </Field>

          {/* ── Live ABO compatibility ── */}
          <div className="md:col-span-3">
            <div className={`rounded-xl p-3 text-sm ${
              compat.ok ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {compat.ok ? (
                <span className="font-semibold">✓ ABO/Rh Compatible: {form.donorBloodGroup}{form.donorRhFactor === 'POSITIVE' ? '+' : '−'} → {form.recipientBloodGroup}{form.recipientRhFactor === 'POSITIVE' ? '+' : '−'}</span>
              ) : (
                <div>
                  <span className="font-semibold">✗ INCOMPATIBLE:</span>
                  {!compat.aboOk && <span className="ml-2">ABO mismatch ({form.donorBloodGroup} → {form.recipientBloodGroup})</span>}
                  {!compat.rhOk && <span className="ml-2">Rh mismatch ({form.donorRhFactor} → {form.recipientRhFactor})</span>}
                </div>
              )}
            </div>
          </div>

          {/* ── Test Results ── */}
          <div className="md:col-span-3 mt-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Test Results</div>
          </div>
          <Field label="Immediate Spin (IS)" required>
            <select value={form.immediateSpinResult} onChange={(e) => patch('immediateSpinResult', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <option value="COMPATIBLE">Compatible</option>
              <option value="INCOMPATIBLE">Incompatible</option>
            </select>
          </Field>
          <Field label="IAT / Coombs Test">
            <select value={form.iatCoombsResult} onChange={(e) => patch('iatCoombsResult', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <option value="">— Not Done —</option>
              <option value="COMPATIBLE">Compatible</option>
              <option value="INCOMPATIBLE">Incompatible</option>
            </select>
          </Field>
          <Field label="Antibody Screen">
            <select value={form.antibodyScreenResult} onChange={(e) => patch('antibodyScreenResult', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <option value="">— Not Done —</option>
              <option value="NEGATIVE">Negative</option>
              <option value="POSITIVE">Positive</option>
            </select>
          </Field>

          {/* ── Personnel ── */}
          <Field label="Tested By (User ID)" required>
            <input type="text" value={form.testedByUserId} onChange={(e) => patch('testedByUserId', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </Field>
          <Field label="Medical Officer">
            <input type="text" value={form.medicalOfficerName} onChange={(e) => patch('medicalOfficerName', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </Field>
          <Field label="Notes">
            <input type="text" value={form.notes} onChange={(e) => patch('notes', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
