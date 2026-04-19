'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useFeatureGate, FeatureLockedBlock } from '@/lib/feature-gate';
import { RegulatoryGuidance } from '@/lib/regulatory-guidance';
import { PageHeader, Modal, Field, DataTable, StatusPill, useList, savePost, savePatch, fmtDate, today, errMsg, TEAL } from '../compliance/_components';

const PATTERNS = ['Normal', 'Obstructive', 'Restrictive', 'Mixed', 'Non-specific'];
const QUALITY_GRADES = ['A', 'B', 'C', 'D', 'F'];
const INDICATIONS = ['COPD Assessment', 'Asthma Diagnosis', 'Pre-operative', 'Occupational Health', 'Disability Evaluation', 'Treatment Monitoring', 'Smoking Cessation', 'Other'];

export default function SpirometryPage() {
  const gate = useFeatureGate('spirometry');
  if (gate.locked) return <FeatureLockedBlock gate={gate} />;

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader title="Spirometry — Pulmonary Function Testing" subtitle="ATS/ERS Standards · GOLD Classification · NABL ISO 15189" />
      <SpirometryList />
      <RegulatoryGuidance title="Spirometry — Regulatory Requirements" items={[
        { body: 'ATS/ERS Standards (2019)', detail: 'Spirometry must meet ATS/ERS acceptability criteria: minimum 3 acceptable manoeuvres, FVC within 150mL between best 2 efforts. Quality grades A-F based on repeatability. Equipment must be calibrated daily with a 3L syringe.' },
        { body: 'GOLD 2024 — COPD Classification', detail: 'COPD confirmed when post-bronchodilator FEV1/FVC < 0.70. GOLD 1: FEV1 ≥80% predicted (Mild). GOLD 2: 50-79% (Moderate). GOLD 3: 30-49% (Severe). GOLD 4: <30% (Very Severe). HospiBot auto-calculates staging.' },
        { body: 'Bronchodilator Reversibility (ATS/ERS)', detail: 'Significant reversibility: ≥200mL AND ≥12% increase in FEV1 or FVC post-bronchodilator. Suggests asthma rather than COPD. HospiBot records pre and post values for comparison.' },
        { body: 'NABL ISO 15189 — PFT Lab Accreditation', detail: 'PFT labs must maintain daily calibration logs, biological control testing, equipment maintenance records, and staff competency documentation. All results must be reviewed by a qualified pulmonologist.' },
      ]} />
    </div>
  );
}

function SpirometryList() {
  const { rows, total, loading, page, setPage, reload } = useList('/diagnostic/spirometry');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const columns = useMemo(() => [
    { key: 'testDate', label: 'Date', render: (r: any) => fmtDate(r.testDate) },
    { key: 'patientName', label: 'Patient' },
    { key: 'fev1', label: 'FEV1 (L)', render: (r: any) => r.fev1 ? `${r.fev1} (${r.fev1PctPredicted || '?'}%)` : '—' },
    { key: 'fvc', label: 'FVC (L)', render: (r: any) => r.fvc ? `${r.fvc} (${r.fvcPctPredicted || '?'}%)` : '—' },
    { key: 'fev1Fvc', label: 'FEV1/FVC', render: (r: any) => r.fev1Fvc != null ? <span style={{ color: r.fev1Fvc < 70 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>{r.fev1Fvc}%</span> : '—' },
    { key: 'pattern', label: 'Pattern', render: (r: any) => r.pattern || '—' },
    { key: 'goldStage', label: 'GOLD', render: (r: any) => r.goldStage ? <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: '#fef3c7', color: '#92400e' }}>{r.goldStage}</span> : '—' },
    { key: 'qualityGrade', label: 'Grade', render: (r: any) => r.qualityGrade || '—' },
    { key: 'status', label: 'Status', render: (r: any) => <StatusPill status={r.status} map={{ draft: { bg: '#f1f5f9', fg: '#475569', label: 'Draft' }, verified: { bg: '#ecfdf5', fg: '#059669', label: 'Verified' }, reported: { bg: '#dbeafe', fg: '#1e40af', label: 'Reported' } }} /> },
  ], []);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={() => { setEditId(null); setShowModal(true); }} style={priBtn}>+ New Spirometry Test</button>
      </div>
      <DataTable columns={columns} rows={rows} loading={loading} total={total} page={page} onPageChange={setPage} onRowClick={(r: any) => { setEditId(r.id); setShowModal(true); }} emptyMessage="No spirometry tests recorded." />
      {showModal && <SpirometryModal id={editId} onClose={() => { setShowModal(false); setEditId(null); }} onSaved={() => { setShowModal(false); setEditId(null); reload(); }} />}
    </>
  );
}

function SpirometryModal({ id, onClose, onSaved }: { id: string | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!!id);
  const [form, setForm] = useState({ patientName: '', patientUhid: '', patientAge: '', patientGender: '', patientHeight: '', patientWeight: '', testDate: today(), indication: '', fvc: '', fvcPredicted: '', fev1: '', fev1Predicted: '', fev1FvcPredicted: '', pef: '', pefPredicted: '', fef2575: '', fef2575Predicted: '', qualityGrade: '', interpretation: '', pattern: '', bdResponse: '', technicianName: '', reviewedBy: '', notes: '', status: 'draft' });
  const s = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => { if (!id) return; fetch(`/api/v1/diagnostic/spirometry/${id}`).then(r => r.json()).then(d => { if (d) { const f: any = {}; Object.keys(form).forEach(k => { f[k] = d[k]?.toString()?.split('T')[0] || d[k]?.toString() || ''; }); setForm(f); } }).finally(() => setLoading(false)); }, [id]);

  const handleSave = async () => { setError(''); setSaving(true); try { if (id) await savePatch(`/diagnostic/spirometry/${id}`, form); else await savePost('/diagnostic/spirometry', form); onSaved(); } catch (err) { setError(errMsg(err)); } finally { setSaving(false); } };

  // Auto-calculate ratios for display
  const fev1Fvc = form.fev1 && form.fvc ? Math.round((Number(form.fev1) / Number(form.fvc)) * 100 * 10) / 10 : null;
  const fev1Pct = form.fev1 && form.fev1Predicted ? Math.round((Number(form.fev1) / Number(form.fev1Predicted)) * 100) : null;

  if (loading) return <Modal title="Loading..." onClose={onClose}><div style={{ padding: 32, textAlign: 'center' }}>Loading...</div></Modal>;

  return (
    <Modal title={id ? 'Edit Spirometry Test' : 'New Spirometry Test'} onClose={onClose} width={950}>
      <div style={{ padding: '16px 24px', maxHeight: '75vh', overflowY: 'auto' }}>
        {error && <div style={{ padding: 12, background: '#fef2f2', color: '#dc2626', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Patient Name *"><input value={form.patientName} onChange={e => s('patientName', e.target.value)} style={inp} /></Field>
          <Field label="Age"><input type="number" value={form.patientAge} onChange={e => s('patientAge', e.target.value)} style={inp} /></Field>
          <Field label="Height (cm)"><input type="number" value={form.patientHeight} onChange={e => s('patientHeight', e.target.value)} style={inp} /></Field>
          <Field label="Weight (kg)"><input type="number" value={form.patientWeight} onChange={e => s('patientWeight', e.target.value)} style={inp} /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Test Date *"><input type="date" value={form.testDate} onChange={e => s('testDate', e.target.value)} style={inp} /></Field>
          <Field label="Indication"><select value={form.indication} onChange={e => s('indication', e.target.value)} style={sel}><option value="">Select...</option>{INDICATIONS.map(i => <option key={i} value={i}>{i}</option>)}</select></Field>
          <Field label="Gender"><select value={form.patientGender} onChange={e => s('patientGender', e.target.value)} style={sel}><option value="">—</option><option value="male">Male</option><option value="female">Female</option></select></Field>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: TEAL, marginBottom: 8, marginTop: 4 }}>SPIROMETRIC VALUES</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="FEV1 (L)"><input type="number" step="0.01" value={form.fev1} onChange={e => s('fev1', e.target.value)} style={inp} /></Field>
          <Field label="FEV1 Predicted"><input type="number" step="0.01" value={form.fev1Predicted} onChange={e => s('fev1Predicted', e.target.value)} style={inp} /></Field>
          <Field label="FVC (L)"><input type="number" step="0.01" value={form.fvc} onChange={e => s('fvc', e.target.value)} style={inp} /></Field>
          <Field label="FVC Predicted"><input type="number" step="0.01" value={form.fvcPredicted} onChange={e => s('fvcPredicted', e.target.value)} style={inp} /></Field>
        </div>
        {fev1Fvc != null && (
          <div style={{ padding: 12, background: fev1Fvc < 70 ? '#fef2f2' : '#f0fdf4', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
            <strong>FEV1/FVC:</strong> <span style={{ fontWeight: 700, color: fev1Fvc < 70 ? '#dc2626' : '#16a34a' }}>{fev1Fvc}%</span>
            {fev1Fvc < 70 && <span style={{ color: '#dc2626', marginLeft: 8 }}>⚠ Obstructive pattern (below LLN)</span>}
            {fev1Pct && <span style={{ marginLeft: 16 }}><strong>FEV1 % predicted:</strong> {fev1Pct}%</span>}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="PEF (L/s)"><input type="number" step="0.01" value={form.pef} onChange={e => s('pef', e.target.value)} style={inp} /></Field>
          <Field label="PEF Predicted"><input type="number" step="0.01" value={form.pefPredicted} onChange={e => s('pefPredicted', e.target.value)} style={inp} /></Field>
          <Field label="FEF 25-75 (L/s)"><input type="number" step="0.01" value={form.fef2575} onChange={e => s('fef2575', e.target.value)} style={inp} /></Field>
          <Field label="FEF 25-75 Predicted"><input type="number" step="0.01" value={form.fef2575Predicted} onChange={e => s('fef2575Predicted', e.target.value)} style={inp} /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Quality Grade"><select value={form.qualityGrade} onChange={e => s('qualityGrade', e.target.value)} style={sel}><option value="">Select...</option>{QUALITY_GRADES.map(g => <option key={g} value={g}>{g}</option>)}</select></Field>
          <Field label="Pattern"><select value={form.pattern} onChange={e => s('pattern', e.target.value)} style={sel}><option value="">Select...</option>{PATTERNS.map(p => <option key={p} value={p.toLowerCase()}>{p}</option>)}</select></Field>
          <Field label="BD Response"><select value={form.bdResponse} onChange={e => s('bdResponse', e.target.value)} style={sel}><option value="">—</option><option value="significant">Significant</option><option value="not-significant">Not Significant</option></select></Field>
          <Field label="Status"><select value={form.status} onChange={e => s('status', e.target.value)} style={sel}><option value="draft">Draft</option><option value="verified">Verified</option><option value="reported">Reported</option></select></Field>
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
