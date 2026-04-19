'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useFeatureGate, FeatureLockedBlock } from '@/lib/feature-gate';
import { RegulatoryGuidance } from '@/lib/regulatory-guidance';
import { PageHeader, Modal, Field, DataTable, StatusPill, useList, savePost, savePatch, fmtDate, today, errMsg, TEAL } from '../compliance/_components';

const BIRADS = [
  { value: '0', label: '0 — Incomplete', color: '#6b7280' },
  { value: '1', label: '1 — Negative', color: '#16a34a' },
  { value: '2', label: '2 — Benign', color: '#16a34a' },
  { value: '3', label: '3 — Probably Benign', color: '#d97706' },
  { value: '4A', label: '4A — Low Suspicion', color: '#ea580c' },
  { value: '4B', label: '4B — Moderate Suspicion', color: '#dc2626' },
  { value: '4C', label: '4C — High Suspicion', color: '#991b1b' },
  { value: '5', label: '5 — Highly Suggestive', color: '#7f1d1d' },
  { value: '6', label: '6 — Known Malignancy', color: '#4c1d95' },
];

const DENSITIES = ['A — Almost entirely fatty', 'B — Scattered fibroglandular', 'C — Heterogeneously dense', 'D — Extremely dense'];
const MODALITIES = ['2D Mammography', '3D Tomosynthesis', 'Contrast-Enhanced', 'MRI'];

export default function BiRadsPage() {
  const gate = useFeatureGate('bi-rads');
  if (gate.locked) return <FeatureLockedBlock gate={gate} />;

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader title="BI-RADS — Mammography Reporting" subtitle="ACR BI-RADS Atlas · AERB Dose Register · Female Radiographer Mandate" />
      <BiRadsList />
      <RegulatoryGuidance title="BI-RADS — Regulatory Requirements" items={[
        { body: 'ACR BI-RADS Atlas (5th Edition)', detail: 'Standardized reporting for breast imaging. Categories 0-6 with defined follow-up actions. Breast density must be reported (A-D). Findings described using ACR lexicon: mass shape/margins/density, calcification morphology/distribution, architectural distortion, asymmetry.' },
        { body: 'AERB Mammography QA Standards', detail: 'AERB (Atomic Energy Regulatory Board) requires: annual equipment QA, mean glandular dose (MGD) recording, equipment AERB license, and radiation safety officer designation. MGD should be ≤2.5 mGy per exposure for standard breast thickness.' },
        { body: 'Female Radiographer Mandate', detail: 'Per Indian regulations, all mammography procedures must be performed by a female radiographer. HospiBot enforces this by requiring radiographer gender to be recorded and flagging male assignments.' },
        { body: 'NABL ISO 15189 — Mammography Centre', detail: 'NABL-accredited mammography centres must maintain: daily phantom QC logs, reject/repeat analysis, equipment calibration records, and radiologist qualification documentation. Double reading is recommended for screening programmes.' },
      ]} />
    </div>
  );
}

function BiRadsList() {
  const { rows, total, loading, page, setPage, reload } = useList('/diagnostic/bi-rads');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const columns = useMemo(() => [
    { key: 'studyDate', label: 'Date', render: (r: any) => fmtDate(r.studyDate) },
    { key: 'patientName', label: 'Patient' },
    { key: 'modality', label: 'Modality' },
    { key: 'breastDensity', label: 'Density', render: (r: any) => r.breastDensity ? r.breastDensity.charAt(0) : '—' },
    { key: 'biradsCategory', label: 'BI-RADS', render: (r: any) => {
      const b = BIRADS.find(x => x.value === r.biradsCategory);
      return r.biradsCategory ? <span style={{ fontWeight: 700, color: b?.color || '#475569', fontSize: 13 }}>{r.biradsCategory}</span> : '—';
    }},
    { key: 'biopsyRecommended', label: 'Biopsy', render: (r: any) => r.biopsyRecommended ? <span style={{ color: '#dc2626', fontWeight: 600 }}>Yes</span> : '—' },
    { key: 'radiographerGender', label: 'Radiographer', render: (r: any) => {
      if (!r.radiographerGender) return '—';
      return r.radiographerGender === 'female' ? <span style={{ color: '#16a34a' }}>✓ Female</span> : <span style={{ color: '#dc2626' }}>⚠ Male</span>;
    }},
    { key: 'status', label: 'Status', render: (r: any) => <StatusPill status={r.status} map={{ draft: { bg: '#f1f5f9', fg: '#475569', label: 'Draft' }, reviewed: { bg: '#dbeafe', fg: '#1e40af', label: 'Reviewed' }, finalized: { bg: '#ecfdf5', fg: '#059669', label: 'Finalized' } }} /> },
  ], []);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={() => { setEditId(null); setShowModal(true); }} style={priBtn}>+ New BI-RADS Report</button>
      </div>
      <DataTable columns={columns} rows={rows} loading={loading} total={total} page={page} onPageChange={setPage} onRowClick={(r: any) => { setEditId(r.id); setShowModal(true); }} emptyMessage="No BI-RADS reports yet." />
      {showModal && <BiRadsModal id={editId} onClose={() => { setShowModal(false); setEditId(null); }} onSaved={() => { setShowModal(false); setEditId(null); reload(); }} />}
    </>
  );
}

function BiRadsModal({ id, onClose, onSaved }: { id: string | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!!id);
  const [form, setForm] = useState({ patientName: '', patientUhid: '', patientAge: '', studyDate: today(), studyType: 'screening', modality: '2D Mammography', laterality: 'bilateral', breastDensity: '', findings: '', biradsCategory: '', impression: '', radiologistName: '', radiographerName: '', radiographerGender: '', mgd: '', aerbDoseRecorded: false, notes: '', status: 'draft' });
  const s = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => { if (!id) return; fetch(`/api/v1/diagnostic/bi-rads/${id}`).then(r => r.json()).then(d => { if (d) { const f: any = {}; Object.keys(form).forEach(k => { f[k] = d[k]?.toString()?.split('T')[0] || d[k]?.toString() || ''; }); f.aerbDoseRecorded = d.aerbDoseRecorded || false; setForm(f); } }).finally(() => setLoading(false)); }, [id]);

  const handleSave = async () => { setError(''); setSaving(true); try { if (id) await savePatch(`/diagnostic/bi-rads/${id}`, form); else await savePost('/diagnostic/bi-rads', form); onSaved(); } catch (err) { setError(errMsg(err)); } finally { setSaving(false); } };

  if (loading) return <Modal title="Loading..." onClose={onClose}><div style={{ padding: 32, textAlign: 'center' }}>Loading...</div></Modal>;

  const selectedBirads = BIRADS.find(b => b.value === form.biradsCategory);

  return (
    <Modal title={id ? 'Edit BI-RADS Report' : 'New BI-RADS Report'} onClose={onClose} width={950}>
      <div style={{ padding: '16px 24px', maxHeight: '75vh', overflowY: 'auto' }}>
        {error && <div style={{ padding: 12, background: '#fef2f2', color: '#dc2626', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Patient Name *"><input value={form.patientName} onChange={e => s('patientName', e.target.value)} style={inp} /></Field>
          <Field label="Age"><input type="number" value={form.patientAge} onChange={e => s('patientAge', e.target.value)} style={inp} /></Field>
          <Field label="Study Date *"><input type="date" value={form.studyDate} onChange={e => s('studyDate', e.target.value)} style={inp} /></Field>
          <Field label="Modality"><select value={form.modality} onChange={e => s('modality', e.target.value)} style={sel}>{MODALITIES.map(m => <option key={m} value={m}>{m}</option>)}</select></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Study Type"><select value={form.studyType} onChange={e => s('studyType', e.target.value)} style={sel}><option value="screening">Screening</option><option value="diagnostic">Diagnostic</option></select></Field>
          <Field label="Laterality"><select value={form.laterality} onChange={e => s('laterality', e.target.value)} style={sel}><option value="bilateral">Bilateral</option><option value="right">Right</option><option value="left">Left</option></select></Field>
          <Field label="Breast Density"><select value={form.breastDensity} onChange={e => s('breastDensity', e.target.value)} style={sel}><option value="">Select...</option>{DENSITIES.map(d => <option key={d} value={d}>{d}</option>)}</select></Field>
        </div>
        <Field label="Findings" style={{ marginBottom: 16 }}><textarea value={form.findings} onChange={e => s('findings', e.target.value)} style={{ ...inp, height: 80 }} placeholder="Describe masses, calcifications, architectural distortion, asymmetry..." /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="BI-RADS Category *">
            <select value={form.biradsCategory} onChange={e => s('biradsCategory', e.target.value)} style={{ ...sel, fontWeight: 600, color: selectedBirads?.color || '#1e293b' }}>
              <option value="">Select...</option>
              {BIRADS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
          </Field>
          <Field label="Impression"><input value={form.impression} onChange={e => s('impression', e.target.value)} style={inp} /></Field>
        </div>
        {['4A', '4B', '4C', '5'].includes(form.biradsCategory) && (
          <div style={{ padding: 12, background: '#fef2f2', borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#991b1b', border: '1px solid #fecaca' }}>
            ⚠ <strong>Biopsy recommended</strong> for BI-RADS {form.biradsCategory}. Ensure follow-up scheduling and patient counselling are documented.
          </div>
        )}
        <div style={{ fontSize: 13, fontWeight: 600, color: TEAL, marginBottom: 8 }}>RADIOGRAPHER & DOSE</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Radiographer"><input value={form.radiographerName} onChange={e => s('radiographerName', e.target.value)} style={inp} /></Field>
          <Field label="Radiographer Gender *">
            <select value={form.radiographerGender} onChange={e => s('radiographerGender', e.target.value)} style={sel}>
              <option value="">Select...</option>
              <option value="female">Female</option>
              <option value="male">Male (⚠ Not Permitted)</option>
            </select>
          </Field>
          <Field label="MGD (mGy)"><input type="number" step="0.1" value={form.mgd} onChange={e => s('mgd', e.target.value)} style={inp} /></Field>
          <Field label="AERB Dose Logged">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
              <input type="checkbox" checked={form.aerbDoseRecorded as any} onChange={e => s('aerbDoseRecorded', e.target.checked)} />
              <span style={{ fontSize: 13 }}>Dose recorded in AERB register</span>
            </label>
          </Field>
        </div>
        {form.radiographerGender === 'male' && (
          <div style={{ padding: 12, background: '#fef2f2', borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#dc2626', border: '1px solid #fecaca' }}>
            ⚠ <strong>Regulatory violation</strong>: Mammography must be performed by a female radiographer per Indian regulations.
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
          <button onClick={onClose} style={secBtn}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={priBtn}>{saving ? 'Saving...' : id ? 'Update' : 'Save'}</button>
        </div>
      </div>
    </Modal>
  );
}

const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' };
const sel: React.CSSProperties = { ...inp, appearance: 'auto' as any };
const priBtn: React.CSSProperties = { padding: '8px 20px', borderRadius: 6, border: 'none', background: TEAL, color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer' };
const secBtn: React.CSSProperties = { padding: '8px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: 500, fontSize: 13, cursor: 'pointer' };
