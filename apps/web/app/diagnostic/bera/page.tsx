'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useFeatureGate, FeatureLockedBlock } from '@/lib/feature-gate';
import { RegulatoryGuidance } from '@/lib/regulatory-guidance';
import { PageHeader, Modal, Field, DataTable, StatusPill, useList, savePost, savePatch, fmtDate, today, errMsg, TEAL } from '../compliance/_components';

const TEST_TYPES = ['ABR (Diagnostic)', 'AABR (Automated Screening)', 'OAE — TEOAE', 'OAE — DPOAE', 'ABR + OAE Combined'];
const RISK_FACTORS = ['NICU stay >5 days', 'Family history of hearing loss', 'Hyperbilirubinemia (exchange transfusion)', 'Ototoxic medications', 'Congenital CMV/Rubella/Toxo', 'Birth weight <1500g', 'Apgar 0-4 at 1 min', 'Mechanical ventilation >5 days', 'Craniofacial anomaly'];

export default function BeraPage() {
  const gate = useFeatureGate('bera');
  if (gate.locked) return <FeatureLockedBlock gate={gate} />;
  const { rows, total, loading, page, setPage, reload } = useList('/diagnostic/bera');
  const [showModal, setShowModal] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const columns = useMemo(() => [
    { key: 'testDate', label: 'Date', render: (r: any) => fmtDate(r.testDate) },
    { key: 'patientName', label: 'Patient' },
    { key: 'isNewborn', label: 'Newborn', render: (r: any) => r.isNewborn ? <span style={{ color: '#7c3aed', fontWeight: 600 }}>Yes</span> : 'No' },
    { key: 'testType', label: 'Type' },
    { key: 'rightThreshold', label: 'R Threshold', render: (r: any) => r.rightThreshold != null ? `${r.rightThreshold} dB` : '—' },
    { key: 'leftThreshold', label: 'L Threshold', render: (r: any) => r.leftThreshold != null ? `${r.leftThreshold} dB` : '—' },
    { key: 'screeningResult', label: 'Result', render: (r: any) => r.screeningResult === 'pass' ? <span style={{ color: '#16a34a', fontWeight: 600 }}>PASS</span> : r.screeningResult === 'refer' ? <span style={{ color: '#dc2626', fontWeight: 600 }}>REFER</span> : '—' },
    { key: 'referForDiagnostic', label: 'Referred', render: (r: any) => r.referForDiagnostic ? <span style={{ color: '#dc2626' }}>Yes</span> : '—' },
    { key: 'status', label: 'Status', render: (r: any) => <StatusPill status={r.status} map={{ draft: { bg: '#f1f5f9', fg: '#475569', label: 'Draft' }, verified: { bg: '#ecfdf5', fg: '#059669', label: 'Verified' }, reported: { bg: '#dbeafe', fg: '#1e40af', label: 'Reported' } }} /> },
  ], []);
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader title="BERA / OAE — Evoked Response Audiometry" subtitle="JCIH Guidelines · Newborn Hearing Screening · ABR Diagnostics" />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}><button onClick={() => { setEditId(null); setShowModal(true); }} style={priBtn}>+ New BERA/OAE Test</button></div>
      <DataTable columns={columns} rows={rows} loading={loading} total={total} page={page} onPageChange={setPage} onRowClick={(r: any) => { setEditId(r.id); setShowModal(true); }} emptyMessage="No BERA/OAE tests yet." />
      {showModal && <BeraModal id={editId} onClose={() => { setShowModal(false); setEditId(null); }} onSaved={() => { setShowModal(false); setEditId(null); reload(); }} />}
      <RegulatoryGuidance title="BERA/OAE — Regulatory Requirements" items={[
        { body: 'JCIH (Joint Committee on Infant Hearing) 2019', detail: 'Universal newborn hearing screening recommended before 1 month. Diagnostic ABR by 3 months. Intervention by 6 months (1-3-6 rule). High-risk infants need follow-up even if initial screen passes.' },
        { body: 'NHSP (National Hearing Screening Programme)', detail: 'India launched RBSK (Rashtriya Bal Swasthya Karyakram) including newborn hearing screening. OAE used for initial screening; ABR for diagnostic confirmation. Two-stage protocol: OAE screen → ABR if refer.' },
        { body: 'JCIH Risk Indicators for Hearing Loss', detail: 'High-risk indicators must be documented: NICU >5 days, family history, hyperbilirubinemia requiring exchange transfusion, ototoxic medications, congenital infections (TORCH), birth weight <1500g, low Apgar scores, mechanical ventilation.' },
      ]} />
    </div>
  );
}

function BeraModal({ id, onClose, onSaved }: { id: string | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [loading, setLoading] = useState(!!id);
  const [form, setForm] = useState({ patientName: '', patientAge: '', isNewborn: false, gestationalAge: '', birthWeight: '', testDate: today(), testType: 'ABR (Diagnostic)', indication: '', riskFactors: '', stimulusType: 'click', rightThreshold: '', leftThreshold: '', rightWaveV: '', leftWaveV: '', rightIPL: '', leftIPL: '', rightResult: '', leftResult: '', oaeRightResult: '', oaeLeftResult: '', screeningResult: '', referForDiagnostic: false, interpretation: '', audiologistName: '', notes: '', status: 'draft' });
  const s = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  useEffect(() => { if (!id) return; fetch(`/api/v1/diagnostic/bera/${id}`).then(r => r.json()).then(d => { if (d) { const f: any = {}; Object.keys(form).forEach(k => { if (typeof d[k] === 'boolean') f[k] = d[k]; else f[k] = d[k]?.toString()?.split('T')[0] || d[k]?.toString() || ''; }); setForm(f); } }).finally(() => setLoading(false)); }, [id]);
  const handleSave = async () => { setError(''); setSaving(true); try { if (id) await savePatch(`/diagnostic/bera/${id}`, form); else await savePost('/diagnostic/bera', form); onSaved(); } catch (err) { setError(errMsg(err)); } finally { setSaving(false); } };
  if (loading) return <Modal title="Loading..." onClose={onClose}><div style={{ padding: 32, textAlign: 'center' }}>Loading...</div></Modal>;
  return (
    <Modal title={id ? 'Edit BERA/OAE' : 'New BERA/OAE Test'} onClose={onClose} width={900}>
      <div style={{ padding: '16px 24px', maxHeight: '75vh', overflowY: 'auto' }}>
        {error && <div style={{ padding: 12, background: '#fef2f2', color: '#dc2626', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Patient *"><input value={form.patientName} onChange={e => s('patientName', e.target.value)} style={inp} /></Field>
          <Field label="Age"><input value={form.patientAge} onChange={e => s('patientAge', e.target.value)} style={inp} placeholder="e.g. 3 days" /></Field>
          <Field label="Date"><input type="date" value={form.testDate} onChange={e => s('testDate', e.target.value)} style={inp} /></Field>
          <Field label="Test Type"><select value={form.testType} onChange={e => s('testType', e.target.value)} style={sel}>{TEST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}><input type="checkbox" checked={form.isNewborn as any} onChange={e => s('isNewborn', e.target.checked)} /> Newborn screening</label>
          {form.isNewborn && <Field label="Gestational Age (wks)"><input type="number" value={form.gestationalAge} onChange={e => s('gestationalAge', e.target.value)} style={inp} /></Field>}
          {form.isNewborn && <Field label="Birth Weight (g)"><input type="number" value={form.birthWeight} onChange={e => s('birthWeight', e.target.value)} style={inp} /></Field>}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: TEAL, marginBottom: 8 }}>ABR RESULTS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          <Field label="R Threshold (dB)"><input type="number" value={form.rightThreshold} onChange={e => s('rightThreshold', e.target.value)} style={{ ...inp, borderColor: '#fecaca' }} /></Field>
          <Field label="L Threshold (dB)"><input type="number" value={form.leftThreshold} onChange={e => s('leftThreshold', e.target.value)} style={{ ...inp, borderColor: '#93c5fd' }} /></Field>
          <Field label="R Wave V (ms)"><input type="number" step="0.01" value={form.rightWaveV} onChange={e => s('rightWaveV', e.target.value)} style={inp} /></Field>
          <Field label="L Wave V (ms)"><input type="number" step="0.01" value={form.leftWaveV} onChange={e => s('leftWaveV', e.target.value)} style={inp} /></Field>
          <Field label="R I-V IPL (ms)"><input type="number" step="0.01" value={form.rightIPL} onChange={e => s('rightIPL', e.target.value)} style={inp} /></Field>
          <Field label="L I-V IPL (ms)"><input type="number" step="0.01" value={form.leftIPL} onChange={e => s('leftIPL', e.target.value)} style={inp} /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Screening Result"><select value={form.screeningResult} onChange={e => s('screeningResult', e.target.value)} style={sel}><option value="">—</option><option value="pass">PASS</option><option value="refer">REFER</option></select></Field>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '20px 0 0', fontSize: 13 }}><input type="checkbox" checked={form.referForDiagnostic as any} onChange={e => s('referForDiagnostic', e.target.checked)} /> Refer for diagnostic ABR</label>
          <Field label="Audiologist"><input value={form.audiologistName} onChange={e => s('audiologistName', e.target.value)} style={inp} /></Field>
        </div>
        <Field label="Interpretation" style={{ marginBottom: 16 }}><textarea value={form.interpretation} onChange={e => s('interpretation', e.target.value)} style={{ ...inp, height: 60 }} /></Field>
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
