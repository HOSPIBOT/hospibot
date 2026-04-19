'use client';

/**
 * Blood Donor Registry — NACO / D&C Act compliant.
 *
 * Every field and threshold in this page is derived from:
 *   - NACO Standards for Blood Banks & Blood Transfusion Services
 *   - Drugs & Cosmetics Rules 1945, Schedule F Part XII-B
 *   - Supreme Court PIL Common Cause vs Union of India (1996)
 *
 * Feature gate: 'donors' → minTier: 'small', allowedSubtypes: ['blood-bank','stem-cell-registry']
 */

import { useState, useMemo } from 'react';
import { useFeatureGate, FeatureLockedBlock } from '@/lib/feature-gate';
import { RegulatoryGuidance } from '@/lib/regulatory-guidance';
import {
  PageHeader, Modal, Field, DataTable, StatusPill,
  useList, savePost, fmtDate, TEAL,
} from '../compliance/_components';

// NACO thresholds — these are Indian law, NOT configurable
const NACO = {
  MIN_AGE: 18, MAX_AGE: 65,
  MIN_WEIGHT: 45, MIN_HB: 12.5,
  BP_SYS_MIN: 100, BP_SYS_MAX: 180,
  BP_DIA_MIN: 50, BP_DIA_MAX: 100,
  PULSE_MIN: 60, PULSE_MAX: 100,
};

const BLOOD_GROUPS = ['A', 'B', 'AB', 'O'];
const RH_FACTORS = ['POSITIVE', 'NEGATIVE'];
const DONOR_TYPES = [
  { value: 'VOLUNTARY', label: 'Voluntary Donor' },
  { value: 'REPLACEMENT', label: 'Replacement Donor' },
  // PAID is BANNED — Supreme Court 1996
];
const ID_PROOF_TYPES = [
  { value: '', label: '— Select —' },
  { value: 'AADHAAR', label: 'Aadhaar Card' },
  { value: 'VOTER_ID', label: 'Voter ID' },
  { value: 'PAN', label: 'PAN Card' },
  { value: 'DRIVING_LICENSE', label: 'Driving License' },
  { value: 'PASSPORT', label: 'Passport' },
];

export default function DonorRegistryPage() {
  const gate = useFeatureGate('donors');
  if (!gate.allowed) return <FeatureLockedBlock gate={gate} />;
  return <DonorContent />;
}

function DonorContent() {
  const { rows, loading, reload } = useList('/donor/registry');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const blankForm = {
    fullName: '', dateOfBirth: '', age: '', gender: 'MALE', phone: '',
    address: '', idProofType: '', idProofNumber: '',
    bloodGroup: 'O', rhFactor: 'POSITIVE',
    weightKg: '', hemoglobinGdl: '', bpSystolic: '', bpDiastolic: '', pulseRate: '',
    donorType: 'VOLUNTARY',
    certifiedByName: '', certifiedByRegNo: '',
    registeredByUserId: '', notes: '',
  };
  const [form, setForm] = useState(blankForm);
  const patch = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Live NACO eligibility check (client-side preview — server is authoritative)
  const eligibility = useMemo(() => {
    const reasons: string[] = [];
    const age = Number(form.age);
    const wt = Number(form.weightKg);
    const hb = Number(form.hemoglobinGdl);
    const sys = Number(form.bpSystolic);
    const dia = Number(form.bpDiastolic);
    const pulse = Number(form.pulseRate);

    if (form.age && (age < NACO.MIN_AGE || age > NACO.MAX_AGE))
      reasons.push(`Age ${age} outside ${NACO.MIN_AGE}–${NACO.MAX_AGE}`);
    if (form.weightKg && wt < NACO.MIN_WEIGHT)
      reasons.push(`Weight ${wt} kg below ${NACO.MIN_WEIGHT} kg`);
    if (form.hemoglobinGdl && hb < NACO.MIN_HB)
      reasons.push(`Hb ${hb} below ${NACO.MIN_HB} g/dL`);
    if (form.bpSystolic && (sys < NACO.BP_SYS_MIN || sys > NACO.BP_SYS_MAX))
      reasons.push(`BP systolic ${sys} outside ${NACO.BP_SYS_MIN}–${NACO.BP_SYS_MAX}`);
    if (form.bpDiastolic && (dia < NACO.BP_DIA_MIN || dia > NACO.BP_DIA_MAX))
      reasons.push(`BP diastolic ${dia} outside ${NACO.BP_DIA_MIN}–${NACO.BP_DIA_MAX}`);
    if (form.pulseRate && (pulse < NACO.PULSE_MIN || pulse > NACO.PULSE_MAX))
      reasons.push(`Pulse ${pulse} outside ${NACO.PULSE_MIN}–${NACO.PULSE_MAX}`);

    const hasData = form.age && form.weightKg && form.hemoglobinGdl && form.bpSystolic && form.bpDiastolic && form.pulseRate;
    return { eligible: hasData ? reasons.length === 0 : null, reasons };
  }, [form.age, form.weightKg, form.hemoglobinGdl, form.bpSystolic, form.bpDiastolic, form.pulseRate]);

  const canSave = form.fullName.trim() && form.age && form.phone.trim() && form.registeredByUserId.trim()
    && form.weightKg && form.hemoglobinGdl && form.bpSystolic && form.bpDiastolic && form.pulseRate;

  const handleSave = () => {
    if (!canSave) return;
    savePost({
      path: '/donor/registry',
      body: {
        ...form,
        age: Number(form.age),
        weightKg: Number(form.weightKg),
        hemoglobinGdl: Number(form.hemoglobinGdl),
        bpSystolic: Number(form.bpSystolic),
        bpDiastolic: Number(form.bpDiastolic),
        pulseRate: Number(form.pulseRate),
        dateOfBirth: form.dateOfBirth || null,
        idProofType: form.idProofType || null,
        idProofNumber: form.idProofNumber || null,
      },
      setSaving,
      onDone: () => { setOpen(false); setForm(blankForm); reload(); },
      successMsg: eligibility.eligible ? 'Donor registered — ELIGIBLE' : 'Donor registered — NOT ELIGIBLE (see reasons)',
    });
  };

  // Blood group display with color coding per D&C Rules
  const bgColor = (bg: string) =>
    bg === 'O' ? '#DBEAFE' : bg === 'A' ? '#FEF9C3' : bg === 'B' ? '#FCE7F3' : '#F3F4F6';
  const bgTextColor = (bg: string) =>
    bg === 'O' ? '#1E40AF' : bg === 'A' ? '#92400E' : bg === 'B' ? '#9D174D' : '#374151';

  const tableRows = rows.map((r: any) => [
    <span className="text-sm font-semibold text-slate-800">{r.fullName}</span>,
    <span style={{ background: bgColor(r.bloodGroup), color: bgTextColor(r.bloodGroup) }}
      className="text-xs px-2 py-0.5 rounded-full font-bold">
      {r.bloodGroup}{r.rhFactor === 'POSITIVE' ? '+' : '−'}
    </span>,
    <span className="text-xs text-slate-600">{r.donorType === 'VOLUNTARY' ? 'Voluntary' : 'Replacement'}</span>,
    <span className="text-sm text-slate-700">{r.age}y / {r.gender === 'MALE' ? 'M' : 'F'}</span>,
    <span className="text-sm text-slate-600">{r.phone}</span>,
    r.isEligible
      ? <StatusPill label="Eligible" tone="good" />
      : <StatusPill label="Not Eligible" tone="bad" />,
    r.isDeferredNow
      ? <StatusPill label={`Deferred${r.deferredUntil ? ' → ' + fmtDate(r.deferredUntil) : ''}`} tone="warn" />
      : null,
    <span className="text-xs text-slate-500">{r.totalDonations} donations</span>,
  ]);

  return (
    <div className="p-6">
      <PageHeader
        title="Donor Registry"
        subtitle="NACO-compliant donor registration with eligibility screening per D&C Rules Schedule F Part XII-B"
        onAction={() => setOpen(true)}
        actionLabel="Register Donor"
      />

      <DataTable
        columns={['Name', 'Blood Group', 'Type', 'Age/Gender', 'Phone', 'Eligibility', 'Deferral', 'Donations']}
        rows={tableRows}
        loading={loading}
        empty="No donors registered yet."
      />

      <RegulatoryGuidance
        title="Blood Donor Registration — Regulatory Compliance"
        summary="Donor registration is governed by the Drugs & Cosmetics Act 1940, NACO Standards, and Supreme Court directives."
        regulations={[
          {
            body: 'NACO',
            citation: 'NACO Standards for Blood Banks & BTS — Section B: Donor Selection',
            requirement: 'Donors must be 18–65 years, weight ≥45 kg, Hb ≥12.5 g/dL, pulse 60–100 bpm (regular), BP systolic 100–180 / diastolic 50–100 mmHg. Minimum 3 months between whole blood donations. Medical officer must certify fitness.',
            url: 'https://naco.gov.in/blood-transfusion-services-publications',
          },
          {
            body: 'DCGI',
            citation: 'Drugs & Cosmetics Rules 1945, Schedule F Part XII-B',
            requirement: 'Blood banks must maintain donor registers with name, age, sex, address, blood group, Rh type, donation date, bag ID, and TTI results. All records retained for minimum 5 years. Donor classification (Voluntary/Replacement) is mandatory on every label.',
            url: 'https://cdsco.gov.in',
          },
          {
            body: 'Supreme Court',
            citation: 'Common Cause vs Union of India (1996) — PIL on Blood Safety',
            requirement: 'Collection of blood from professional/paid donors is BANNED. Only voluntary and replacement donors are permitted. Blood banks found accepting paid donors face license cancellation under D&C Act Section 27(b).',
          },
          {
            body: 'NACO',
            citation: 'NACO Deferral Criteria — Donor Safety Guidelines',
            requirement: 'Deferral periods: malaria (3 months), jaundice/hepatitis (1 year), tattoo/piercing (6 months), major surgery (12 months), pregnancy (6 months post-delivery), rabies vaccine (1 year). Temporary deferrals must be recorded with reason and until-date.',
          },
          {
            body: 'DGHS',
            citation: 'DGHS/e-RaktKosh — National Blood Bank Platform',
            requirement: 'All licensed blood banks are encouraged to register on e-RaktKosh (eraktkosh.in) for centralized donor management, real-time stock reporting, and digital donation certificates.',
            url: 'https://www.eraktkosh.in',
          },
        ]}
      />

      <Modal open={open} onClose={() => setOpen(false)} title="Register Blood Donor"
        saving={saving} onSave={handleSave} saveLabel="Register Donor" wide>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* ── Identity ── */}
          <Field label="Full Name" required>
            <input type="text" value={form.fullName} onChange={(e) => patch('fullName', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </Field>
          <Field label="Age" required>
            <input type="number" min="1" max="100" value={form.age} onChange={(e) => patch('age', e.target.value)}
              placeholder="18–65" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </Field>
          <Field label="Gender" required>
            <select value={form.gender} onChange={(e) => patch('gender', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </Field>
          <Field label="Phone" required>
            <input type="tel" value={form.phone} onChange={(e) => patch('phone', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </Field>
          <Field label="ID Proof Type">
            <select value={form.idProofType} onChange={(e) => patch('idProofType', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              {ID_PROOF_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="ID Number">
            <input type="text" value={form.idProofNumber} onChange={(e) => patch('idProofNumber', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </Field>

          {/* ── Blood Group (D&C Rules color coding) ── */}
          <Field label="Blood Group (ABO)" required>
            <select value={form.bloodGroup} onChange={(e) => patch('bloodGroup', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="Rh Factor" required>
            <select value={form.rhFactor} onChange={(e) => patch('rhFactor', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              {RH_FACTORS.map((r) => <option key={r} value={r}>{r === 'POSITIVE' ? 'Rh Positive (+)' : 'Rh Negative (−)'}</option>)}
            </select>
          </Field>
          <Field label="Donor Type (D&C Rules)" required>
            <select value={form.donorType} onChange={(e) => patch('donorType', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              {DONOR_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>

          {/* ── NACO Medical Screening ── */}
          <div className="md:col-span-3 mt-2 mb-1">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              NACO Medical Screening — eligibility computed automatically
            </div>
          </div>
          <Field label="Weight (kg)" required>
            <input type="number" step="0.1" min="0" value={form.weightKg}
              onChange={(e) => patch('weightKg', e.target.value)}
              placeholder={`≥${NACO.MIN_WEIGHT}`}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </Field>
          <Field label="Hemoglobin (g/dL)" required>
            <input type="number" step="0.1" min="0" value={form.hemoglobinGdl}
              onChange={(e) => patch('hemoglobinGdl', e.target.value)}
              placeholder={`≥${NACO.MIN_HB}`}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </Field>
          <Field label="Pulse (bpm)" required>
            <input type="number" min="0" value={form.pulseRate}
              onChange={(e) => patch('pulseRate', e.target.value)}
              placeholder={`${NACO.PULSE_MIN}–${NACO.PULSE_MAX}`}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </Field>
          <Field label="BP Systolic (mmHg)" required>
            <input type="number" min="0" value={form.bpSystolic}
              onChange={(e) => patch('bpSystolic', e.target.value)}
              placeholder={`${NACO.BP_SYS_MIN}–${NACO.BP_SYS_MAX}`}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </Field>
          <Field label="BP Diastolic (mmHg)" required>
            <input type="number" min="0" value={form.bpDiastolic}
              onChange={(e) => patch('bpDiastolic', e.target.value)}
              placeholder={`${NACO.BP_DIA_MIN}–${NACO.BP_DIA_MAX}`}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </Field>

          {/* Live eligibility indicator */}
          {eligibility.eligible !== null && (
            <div className="md:col-span-3">
              <div className={`rounded-xl p-3 text-sm ${
                eligibility.eligible
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {eligibility.eligible ? (
                  <span className="font-semibold">✓ Donor meets all NACO eligibility criteria</span>
                ) : (
                  <div>
                    <span className="font-semibold">✗ Donor does NOT meet NACO criteria:</span>
                    <ul className="mt-1 ml-4 list-disc text-xs">
                      {eligibility.reasons.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Medical Officer Certification ── */}
          <Field label="Certifying Medical Officer">
            <input type="text" value={form.certifiedByName}
              onChange={(e) => patch('certifiedByName', e.target.value)}
              placeholder="Dr. name" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </Field>
          <Field label="MO Registration No.">
            <input type="text" value={form.certifiedByRegNo}
              onChange={(e) => patch('certifiedByRegNo', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </Field>
          <Field label="Registered By (User ID)" required>
            <input type="text" value={form.registeredByUserId}
              onChange={(e) => patch('registeredByUserId', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
