'use client';

import { useState } from 'react';
import { useFeatureGate, FeatureLockedBlock } from '@/lib/feature-gate';
import { RegulatoryGuidance } from '@/lib/regulatory-guidance';
import {
  PageHeader, Modal, Field, DataTable, StatusPill,
  useList, savePost, savePatch, fmtDateTime, TEAL,
} from '../compliance/_components';

const GROWTH_TONES: Record<string, 'good' | 'warn' | 'bad' | 'neutral'> = {
  INCUBATING: 'neutral',
  NO_GROWTH: 'good',
  GROWTH_DETECTED: 'warn',
  IDENTIFIED: 'warn',
  FINAL: 'good',
};

const SPECIMEN_TYPES = [
  { value: 'blood', label: 'Blood' },
  { value: 'urine', label: 'Urine' },
  { value: 'wound', label: 'Wound Swab' },
  { value: 'sputum', label: 'Sputum' },
  { value: 'stool', label: 'Stool' },
  { value: 'csf', label: 'CSF' },
  { value: 'other', label: 'Other' },
];

const MEDIA_TYPES = [
  { value: 'blood_agar', label: 'Blood Agar' },
  { value: 'mac_conkey', label: 'MacConkey' },
  { value: 'chocolate', label: 'Chocolate Agar' },
  { value: 'sabouraud', label: 'Sabouraud (Fungal)' },
  { value: 'bactec', label: 'BacT/ALERT / BACTEC' },
  { value: 'other', label: 'Other' },
];

export default function CultureDashboardPage() {
  const gate = useFeatureGate('culture');
  if (!gate.allowed) return <FeatureLockedBlock gate={gate} />;

  return <CultureContent />;
}

function CultureContent() {
  const { rows, loading, reload } = useList('/culture/trackings');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    specimenType: 'blood',
    specimenSource: '',
    cultureMedia: 'blood_agar',
    patientId: '',
    labOrderId: '',
    technicianUserId: '',
    notes: '',
  });

  const patch = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const canSave = form.specimenType && form.cultureMedia && form.technicianUserId.trim();

  const handleSave = () => {
    if (!canSave) return;
    savePost({
      path: '/culture/trackings',
      body: {
        specimenType: form.specimenType,
        specimenSource: form.specimenSource.trim() || null,
        cultureMedia: form.cultureMedia,
        patientId: form.patientId.trim() || null,
        labOrderId: form.labOrderId.trim() || null,
        technicianUserId: form.technicianUserId.trim(),
        notes: form.notes.trim() || null,
      },
      setSaving,
      onDone: () => {
        setOpen(false);
        setForm({
          specimenType: 'blood', specimenSource: '', cultureMedia: 'blood_agar',
          patientId: '', labOrderId: '', technicianUserId: '', notes: '',
        });
        reload();
      },
      successMsg: 'Culture inoculated & tracking started',
    });
  };

  const advanceStatus = async (id: string, newStatus: string, extra?: Record<string, any>) => {
    setUpdatingId(id);
    savePatch({
      path: `/culture/trackings/${id}`,
      body: { growthStatus: newStatus, ...extra },
      setSaving: (active: boolean) => { if (!active) setUpdatingId(null); },
      onDone: () => reload(),
      successMsg: `Status → ${newStatus.replace(/_/g, ' ')}`,
    });
  };

  // Compute incubation hours for display
  const incubHours = (inoculatedAt: string) => {
    const h = Math.round((Date.now() - new Date(inoculatedAt).getTime()) / 3600_000);
    return h < 24 ? `${h}h` : `${Math.round(h / 24)}d ${h % 24}h`;
  };

  const tableRows = rows.map((r: any) => [
    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
      {SPECIMEN_TYPES.find(s => s.value === r.specimenType)?.label ?? r.specimenType}
    </span>,
    <span className="text-xs text-slate-600">{r.specimenSource || '—'}</span>,
    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
      {MEDIA_TYPES.find(m => m.value === r.cultureMedia)?.label ?? r.cultureMedia}
    </span>,
    <span className="font-mono text-xs text-slate-600">{incubHours(r.inoculatedAt)}</span>,
    <StatusPill label={r.growthStatus.replace(/_/g, ' ')} tone={GROWTH_TONES[r.growthStatus] ?? 'neutral'} />,
    r.organismIdentified
      ? <span className="text-sm font-semibold text-slate-800">{r.organismIdentified}</span>
      : <span className="text-slate-400">—</span>,
    r.isFlaggedMdro
      ? <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">MDRO</span>
      : null,
    <div className="flex items-center gap-1.5">
      {r.growthStatus === 'INCUBATING' && (
        <>
          <button onClick={() => advanceStatus(r.id, 'NO_GROWTH')} disabled={updatingId === r.id}
            className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700 font-semibold">
            No Growth
          </button>
          <button onClick={() => advanceStatus(r.id, 'GROWTH_DETECTED')} disabled={updatingId === r.id}
            className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-700 font-semibold">
            Growth +
          </button>
        </>
      )}
      {r.growthStatus === 'GROWTH_DETECTED' && (
        <button onClick={() => {
          const org = prompt('Organism identified:');
          if (org) advanceStatus(r.id, 'IDENTIFIED', { organismIdentified: org });
        }} disabled={updatingId === r.id}
          className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 font-semibold">
          ID Organism
        </button>
      )}
      {r.growthStatus === 'IDENTIFIED' && (
        <button onClick={() => advanceStatus(r.id, 'FINAL')} disabled={updatingId === r.id}
          className="text-xs px-2 py-1 rounded font-semibold" style={{ background: '#E8F5F0', color: TEAL }}>
          Finalize
        </button>
      )}
    </div>,
  ]);

  return (
    <div className="p-6">
      <PageHeader
        title="Culture Dashboard"
        subtitle="Track active cultures from inoculation to final identification"
        onAction={() => setOpen(true)}
        actionLabel="New Culture"
      />

      <DataTable
        columns={['Specimen', 'Source', 'Media', 'Incub.', 'Status', 'Organism', 'MDRO', 'Actions']}
        rows={tableRows}
        loading={loading}
        empty="No active cultures — inoculate your first specimen."
      />

      <RegulatoryGuidance
        title="Microbiology Culture Tracking — Regulatory Compliance"
        summary="Culture processing is governed by NABL ISO 15189:2022, ICMR AMR guidelines, and IDSP notifiable disease requirements."
        regulations={[
          {
            body: 'NABL',
            citation: 'NABL 112A — Microbiology discipline requirements',
            requirement: 'Culture plates must be read at defined intervals. Organism identification and AST must follow CLSI/EUCAST guidelines. All results must be validated by a qualified microbiologist before release. Records retained for 5 years.',
            url: 'https://nabl-india.org',
          },
          {
            body: 'ICMR',
            citation: 'ICMR Guidelines on Antimicrobial Resistance Surveillance',
            requirement: 'Labs must report MDRO isolates (MRSA, VRE, ESBL, CRE, Acinetobacter) to the ICMR AMR surveillance network. Data includes organism, specimen source, susceptibility pattern, and patient demographics.',
            url: 'https://main.icmr.nic.in',
          },
          {
            body: 'IDSP',
            citation: 'Integrated Disease Surveillance Programme (IDSP/IHIP)',
            requirement: 'Notifiable diseases identified via culture (cholera, typhoid, meningococcus, diphtheria, etc.) must be reported to the District Surveillance Unit within 24 hours of confirmation per the Epidemic Diseases Act, 1897.',
          },
          {
            body: 'ICMR/DBT',
            citation: 'ICMR/DBT Biosafety Guidelines — BSL-2 Requirements',
            requirement: 'Microbiology labs handling pathogenic cultures must maintain BSL-2 biosafety measures: Class II BSC, autoclave validation, PPE, spill kits, and staff training documentation. Daily biosafety checklist mandatory.',
          },
        ]}
      />

      <Modal open={open} onClose={() => setOpen(false)} title="Inoculate New Culture"
        saving={saving} onSave={handleSave} saveLabel="Start Culture" wide>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Specimen Type" required>
            <select value={form.specimenType} onChange={(e) => patch('specimenType', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7C66]/30">
              {SPECIMEN_TYPES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Specimen Source">
            <input type="text" value={form.specimenSource}
              onChange={(e) => patch('specimenSource', e.target.value)}
              placeholder="e.g. Left arm blood culture, mid-stream urine"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7C66]/30" />
          </Field>

          <Field label="Culture Media" required>
            <select value={form.cultureMedia} onChange={(e) => patch('cultureMedia', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7C66]/30">
              {MEDIA_TYPES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Technician (User ID)" required>
            <input type="text" value={form.technicianUserId}
              onChange={(e) => patch('technicianUserId', e.target.value)}
              placeholder="Staff user ID"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7C66]/30" />
          </Field>

          <Field label="Patient ID">
            <input type="text" value={form.patientId}
              onChange={(e) => patch('patientId', e.target.value)}
              placeholder="Optional — link to patient"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7C66]/30" />
          </Field>

          <Field label="Lab Order ID">
            <input type="text" value={form.labOrderId}
              onChange={(e) => patch('labOrderId', e.target.value)}
              placeholder="Optional — link to lab order"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7C66]/30" />
          </Field>

          <Field label="Notes" span={2}>
            <textarea rows={2} value={form.notes}
              onChange={(e) => patch('notes', e.target.value)}
              placeholder="Clinical indication, antibiotic history, etc."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7C66]/30" />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
