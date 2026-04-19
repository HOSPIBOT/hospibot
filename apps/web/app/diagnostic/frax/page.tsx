'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useFeatureGate, FeatureLockedBlock } from '@/lib/feature-gate';
import { RegulatoryGuidance } from '@/lib/regulatory-guidance';
import { PageHeader, Modal, Field, DataTable, StatusPill, useList, savePost, savePatch, fmtDate, today, errMsg, TEAL } from '../compliance/_components';

export default function FraxPage() {
  const gate = useFeatureGate('frax');
  if (gate.locked) return <FeatureLockedBlock gate={gate} />;
  const { rows, total, loading, page, setPage, reload } = useList('/diagnostic/frax');
  const [showModal, setShowModal] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const columns = useMemo(() => [
    { key: 'scanDate', label: 'Date', render: (r: any) => fmtDate(r.scanDate) },
    { key: 'patientName', label: 'Patient' },
    { key: 'tScoreSpine', label: 'T-Score Spine', render: (r: any) => r.tScoreSpine != null ? <span style={{ fontWeight: 600, color: r.tScoreSpine <= -2.5 ? '#dc2626' : r.tScoreSpine <= -1.0 ? '#d97706' : '#16a34a' }}>{r.tScoreSpine}</span> : '—' },
    { key: 'tScoreHip', label: 'T-Score Hip', render: (r: any) => r.tScoreHip != null ? <span style={{ fontWeight: 600, color: r.tScoreHip <= -2.5 ? '#dc2626' : r.tScoreHip <= -1.0 ? '#d97706' : '#16a34a' }}>{r.tScoreHip}</span> : '—' },
    { key: 'whoClassification', label: 'WHO Class', render: (r: any) => r.whoClassification ? <span style={{ fontWeight: 600, color: r.whoClassification === 'Osteoporosis' ? '#dc2626' : r.whoClassification === 'Osteopenia' ? '#d97706' : '#16a34a' }}>{r.whoClassification}</span> : '—' },
    { key: 'fraxMajor', label: 'FRAX Major %', render: (r: any) => r.fraxMajor != null ? `${r.fraxMajor}%` : '—' },
    { key: 'fraxHip', label: 'FRAX Hip %', render: (r: any) => r.fraxHip != null ? `${r.fraxHip}%` : '—' },
    { key: 'treatmentThreshold', label: 'Treat?', render: (r: any) => r.treatmentThreshold ? <span style={{ color: '#dc2626', fontWeight: 600 }}>Yes</span> : '—' },
    { key: 'status', label: 'Status', render: (r: any) => <StatusPill status={r.status} map={{ draft: { bg: '#f1f5f9', fg: '#475569', label: 'Draft' }, verified: { bg: '#ecfdf5', fg: '#059669', label: 'Verified' }, reported: { bg: '#dbeafe', fg: '#1e40af', label: 'Reported' } }} /> },
  ], []);
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader title="FRAX — Fracture Risk & Bone Density" subtitle="WHO FRAX Tool · ISCD Guidelines · T-Score Classification · Body Composition" />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}><button onClick={() => { setEditId(null); setShowModal(true); }} style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: TEAL, color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>+ New DEXA/FRAX Scan</button></div>
      <DataTable columns={columns} rows={rows} loading={loading} total={total} page={page} onPageChange={setPage} onRowClick={(r: any) => { setEditId(r.id); setShowModal(true); }} emptyMessage="No FRAX assessments yet." />
      {showModal && <FraxModal id={editId} onClose={() => { setShowModal(false); setEditId(null); }} onSaved={() => { setShowModal(false); setEditId(null); reload(); }} />}
      <RegulatoryGuidance title="FRAX / DEXA — Regulatory Requirements" items={[
        { body: 'WHO FRAX Tool (v4.1)', detail: 'FRAX calculates 10-year fracture probability using BMD + clinical risk factors. Treatment threshold: ≥20% major osteoporotic fracture OR ≥3% hip fracture risk. Country-specific models available for India.' },
        { body: 'ISCD Official Positions (2023)', detail: 'T-scores used for postmenopausal women and men ≥50. Z-scores used for premenopausal women, men <50, and children. WHO classification: Normal (T ≥ -1.0), Osteopenia (-1.0 to -2.5), Osteoporosis (T ≤ -2.5).' },
        { body: 'AERB — Pregnancy Contraindication Hard Block', detail: 'DEXA uses ionizing radiation. Pregnancy must be screened before every scan per AERB guidelines. HospiBot records pregnancy screening confirmation for every scan.' },
      ]} />
    </div>
  );
}

function FraxModal({ id, onClose, onSaved }: { id: string | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [loading, setLoading] = useState(!!id);
  const [form, setForm] = useState({ patientName: '', patientAge: '', patientGender: '', patientHeight: '', patientWeight: '', scanDate: today(), bmdSpine: '', tScoreSpine: '', bmdHip: '', tScoreHip: '', bmdFemoralNeck: '', tScoreFemoralNeck: '', previousFracture: false, parentHipFracture: false, currentSmoking: false, glucocorticoids: false, rheumatoidArthritis: false, secondaryOsteoporosis: false, alcoholUnits: '', fraxMajor: '', fraxHip: '', pregnancyScreened: false, interpretation: '', recommendation: '', notes: '', status: 'draft' });
  const s = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  useEffect(() => { if (!id) return; fetch(`/api/v1/diagnostic/frax/${id}`).then(r => r.json()).then(d => { if (d) { const f: any = {}; Object.keys(form).forEach(k => { if (typeof d[k] === 'boolean') f[k] = d[k]; else f[k] = d[k]?.toString()?.split('T')[0] || d[k]?.toString() || ''; }); setForm(f); } }).finally(() => setLoading(false)); }, [id]);
  const handleSave = async () => { setError(''); setSaving(true); try { if (id) await savePatch(`/diagnostic/frax/${id}`, form); else await savePost('/diagnostic/frax', form); onSaved(); } catch (err) { setError(errMsg(err)); } finally { setSaving(false); } };
  if (loading) return <Modal title="Loading..." onClose={onClose}><div style={{ padding: 32, textAlign: 'center' }}>Loading...</div></Modal>;
  const tMin = Math.min(...[form.tScoreSpine, form.tScoreHip].map(Number).filter(n => !isNaN(n)));
  const whoClass = isNaN(tMin) ? null : tMin >= -1 ? 'Normal' : tMin >= -2.5 ? 'Osteopenia' : 'Osteoporosis';
  return (
    <Modal title={id ? 'Edit FRAX Assessment' : 'New DEXA / FRAX Scan'} onClose={onClose} width={950}>
      <div style={{ padding: '16px 24px', maxHeight: '75vh', overflowY: 'auto' }}>
        {error && <div style={{ padding: 12, background: '#fef2f2', color: '#dc2626', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Patient *"><input value={form.patientName} onChange={e => s('patientName', e.target.value)} style={inp} /></Field>
          <Field label="Age"><input type="number" value={form.patientAge} onChange={e => s('patientAge', e.target.value)} style={inp} /></Field>
          <Field label="Gender"><select value={form.patientGender} onChange={e => s('patientGender', e.target.value)} style={sel}><option value="">—</option><option value="female">Female</option><option value="male">Male</option></select></Field>
          <Field label="Height (cm)"><input type="number" value={form.patientHeight} onChange={e => s('patientHeight', e.target.value)} style={inp} /></Field>
          <Field label="Scan Date"><input type="date" value={form.scanDate} onChange={e => s('scanDate', e.target.value)} style={inp} /></Field>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: TEAL, marginBottom: 8 }}>BMD & T-SCORES</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          <Field label="BMD Spine"><input type="number" step="0.001" value={form.bmdSpine} onChange={e => s('bmdSpine', e.target.value)} style={inp} /></Field>
          <Field label="T-Score Spine"><input type="number" step="0.1" value={form.tScoreSpine} onChange={e => s('tScoreSpine', e.target.value)} style={inp} /></Field>
          <Field label="BMD Hip"><input type="number" step="0.001" value={form.bmdHip} onChange={e => s('bmdHip', e.target.value)} style={inp} /></Field>
          <Field label="T-Score Hip"><input type="number" step="0.1" value={form.tScoreHip} onChange={e => s('tScoreHip', e.target.value)} style={inp} /></Field>
          <Field label="BMD Fem. Neck"><input type="number" step="0.001" value={form.bmdFemoralNeck} onChange={e => s('bmdFemoralNeck', e.target.value)} style={inp} /></Field>
          <Field label="T-Score F.Neck"><input type="number" step="0.1" value={form.tScoreFemoralNeck} onChange={e => s('tScoreFemoralNeck', e.target.value)} style={inp} /></Field>
        </div>
        {whoClass && <div style={{ padding: 12, borderRadius: 8, marginBottom: 16, background: whoClass === 'Osteoporosis' ? '#fef2f2' : whoClass === 'Osteopenia' ? '#fffbeb' : '#f0fdf4', fontWeight: 600, color: whoClass === 'Osteoporosis' ? '#dc2626' : whoClass === 'Osteopenia' ? '#d97706' : '#16a34a' }}>WHO Classification: {whoClass}</div>}
        <div style={{ fontSize: 13, fontWeight: 600, color: TEAL, marginBottom: 8 }}>FRAX RISK FACTORS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          {[['previousFracture', 'Previous fracture'], ['parentHipFracture', 'Parent hip fracture'], ['currentSmoking', 'Current smoking'], ['glucocorticoids', 'Glucocorticoids'], ['rheumatoidArthritis', 'Rheumatoid arthritis'], ['secondaryOsteoporosis', 'Secondary osteoporosis']].map(([k, l]) => (
            <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}><input type="checkbox" checked={(form as any)[k]} onChange={e => s(k, e.target.checked)} /> {l}</label>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="FRAX Major (%)"><input type="number" step="0.1" value={form.fraxMajor} onChange={e => s('fraxMajor', e.target.value)} style={inp} /></Field>
          <Field label="FRAX Hip (%)"><input type="number" step="0.1" value={form.fraxHip} onChange={e => s('fraxHip', e.target.value)} style={inp} /></Field>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '20px 0 0' }}><input type="checkbox" checked={form.pregnancyScreened as any} onChange={e => s('pregnancyScreened', e.target.checked)} /><span style={{ fontSize: 13 }}>Pregnancy screened (AERB)</span></label>
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
