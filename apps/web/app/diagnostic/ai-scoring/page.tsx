'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useFeatureGate, FeatureLockedBlock } from '@/lib/feature-gate';
import { RegulatoryGuidance } from '@/lib/regulatory-guidance';
import { PageHeader, Modal, Field, DataTable, StatusPill, useList, savePost, savePatch, fmtDate, today, errMsg, TEAL } from '../compliance/_components';

const CANCER_TYPES = ['Breast', 'Cervical', 'Colorectal', 'Lung', 'Prostate', 'Hepatocellular', 'Ovarian', 'Gastric', 'Head & Neck', 'Thyroid', 'Pancreatic', 'Other'];
const RISK_COLORS: Record<string, string> = { Low: '#16a34a', Moderate: '#d97706', High: '#ea580c', 'Very High': '#dc2626' };

export default function AiScoringPage() {
  const gate = useFeatureGate('ai-scoring');
  if (gate.locked) return <FeatureLockedBlock gate={gate} />;
  const { rows, total, loading, page, setPage, reload } = useList('/diagnostic/ai-scoring');
  const [showModal, setShowModal] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const columns = useMemo(() => [
    { key: 'assessmentDate', label: 'Date', render: (r: any) => fmtDate(r.assessmentDate) },
    { key: 'patientName', label: 'Patient' },
    { key: 'cancerType', label: 'Cancer' },
    { key: 'riskScore', label: 'Score', render: (r: any) => r.riskScore != null ? <span style={{ fontWeight: 700, fontSize: 15, color: RISK_COLORS[r.riskLevel] || '#475569' }}>{r.riskScore}%</span> : '—' },
    { key: 'riskLevel', label: 'Risk', render: (r: any) => r.riskLevel ? <span style={{ fontWeight: 600, color: RISK_COLORS[r.riskLevel] || '#475569', padding: '2px 10px', borderRadius: 12, fontSize: 11, background: r.riskLevel === 'Low' ? '#f0fdf4' : r.riskLevel === 'Moderate' ? '#fffbeb' : '#fef2f2' }}>{r.riskLevel}</span> : '—' },
    { key: 'referralNeeded', label: 'Referral', render: (r: any) => r.referralNeeded ? <span style={{ color: '#dc2626', fontWeight: 600 }}>Yes</span> : '—' },
    { key: 'clinicianOverride', label: 'Override', render: (r: any) => r.clinicianOverride ? <span style={{ color: '#7c3aed', fontWeight: 600 }}>Yes</span> : '—' },
    { key: 'status', label: 'Status', render: (r: any) => <StatusPill status={r.status} map={{ generated: { bg: '#dbeafe', fg: '#1e40af', label: 'Generated' }, reviewed: { bg: '#ecfdf5', fg: '#059669', label: 'Reviewed' }, overridden: { bg: '#f5f3ff', fg: '#6d28d9', label: 'Overridden' } }} /> },
  ], []);
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader title="AI Risk Scoring — Cancer Screening" subtitle="ML-Based Risk Stratification · Multi-Input Analysis · Clinician Override" />
      <div style={{ padding: 12, background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a', marginBottom: 16, fontSize: 13, color: '#78350f' }}>⚠ <strong>Decision Support Only</strong> — AI-generated scores are tools to assist clinical judgment. They must not be used as the sole basis for diagnosis or treatment decisions.</div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}><button onClick={() => { setEditId(null); setShowModal(true); }} style={priBtn}>+ New Risk Assessment</button></div>
      <DataTable columns={columns} rows={rows} loading={loading} total={total} page={page} onPageChange={setPage} onRowClick={(r: any) => { setEditId(r.id); setShowModal(true); }} emptyMessage="No AI risk assessments yet." />
      {showModal && <AiModal id={editId} onClose={() => { setShowModal(false); setEditId(null); }} onSaved={() => { setShowModal(false); setEditId(null); reload(); }} />}
      <RegulatoryGuidance title="AI Risk Scoring — Regulatory & Ethical Requirements" items={[
        { body: 'CDSCO SaMD (Software as Medical Device) Framework', detail: 'AI-based clinical decision support may classify as SaMD under CDSCO Draft Regulatory Framework for AI/ML-based Medical Devices. Risk classification depends on intended use. Post-market surveillance and version tracking are mandatory.' },
        { body: 'Clinician Override Mandatory', detail: 'All AI risk scores must be reviewed by a qualified clinician before acting on recommendations. Clinician override with documented reasoning must be available. The AI score alone cannot determine patient management.' },
        { body: 'Model Transparency & Version Control', detail: 'Model name, version, and training data characteristics must be documented for each assessment. Confidence intervals should be provided when available. Algorithm performance metrics (AUROC, sensitivity, specificity) must be tracked.' },
      ]} />
    </div>
  );
}

function AiModal({ id, onClose, onSaved }: { id: string | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [loading, setLoading] = useState(!!id);
  const [form, setForm] = useState({ patientName: '', patientAge: '', patientGender: '', assessmentDate: today(), cancerType: '', screeningTool: '', riskScore: '', modelName: '', modelVersion: '', confidenceInterval: '', recommendation: '', followUpInterval: '', referralNeeded: false, referralTo: '', clinicianReview: '', clinicianOverride: false, overrideReason: '', notes: '', status: 'generated' });
  const s = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  useEffect(() => { if (!id) return; fetch(`/api/v1/diagnostic/ai-scoring/${id}`).then(r => r.json()).then(d => { if (d) { const f: any = {}; Object.keys(form).forEach(k => { if (typeof d[k] === 'boolean') f[k] = d[k]; else f[k] = d[k]?.toString()?.split('T')[0] || d[k]?.toString() || ''; }); setForm(f); } }).finally(() => setLoading(false)); }, [id]);
  const handleSave = async () => { setError(''); setSaving(true); try { if (id) await savePatch(`/diagnostic/ai-scoring/${id}`, form); else await savePost('/diagnostic/ai-scoring', form); onSaved(); } catch (err) { setError(errMsg(err)); } finally { setSaving(false); } };
  if (loading) return <Modal title="Loading..." onClose={onClose}><div style={{ padding: 32, textAlign: 'center' }}>Loading...</div></Modal>;
  const score = form.riskScore ? Number(form.riskScore) : null;
  const level = score === null ? null : score < 20 ? 'Low' : score < 50 ? 'Moderate' : score < 80 ? 'High' : 'Very High';
  return (
    <Modal title={id ? 'Edit Risk Assessment' : 'New AI Risk Assessment'} onClose={onClose} width={900}>
      <div style={{ padding: '16px 24px', maxHeight: '75vh', overflowY: 'auto' }}>
        {error && <div style={{ padding: 12, background: '#fef2f2', color: '#dc2626', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Patient *"><input value={form.patientName} onChange={e => s('patientName', e.target.value)} style={inp} /></Field>
          <Field label="Age"><input type="number" value={form.patientAge} onChange={e => s('patientAge', e.target.value)} style={inp} /></Field>
          <Field label="Gender"><select value={form.patientGender} onChange={e => s('patientGender', e.target.value)} style={sel}><option value="">—</option><option value="male">Male</option><option value="female">Female</option></select></Field>
          <Field label="Cancer Type *"><select value={form.cancerType} onChange={e => s('cancerType', e.target.value)} style={sel}><option value="">Select...</option>{CANCER_TYPES.map(c => <option key={c} value={c}>{c}</option>)}</select></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Risk Score (0-100)"><input type="number" min={0} max={100} value={form.riskScore} onChange={e => s('riskScore', e.target.value)} style={inp} /></Field>
          <Field label="Model Name"><input value={form.modelName} onChange={e => s('modelName', e.target.value)} style={inp} /></Field>
          <Field label="Model Version"><input value={form.modelVersion} onChange={e => s('modelVersion', e.target.value)} style={inp} /></Field>
          <Field label="95% CI"><input value={form.confidenceInterval} onChange={e => s('confidenceInterval', e.target.value)} style={inp} placeholder="e.g. 35-65%" /></Field>
        </div>
        {level && <div style={{ padding: 16, borderRadius: 8, marginBottom: 16, textAlign: 'center', background: level === 'Very High' || level === 'High' ? '#fef2f2' : level === 'Moderate' ? '#fffbeb' : '#f0fdf4' }}><span style={{ fontSize: 28, fontWeight: 800, color: RISK_COLORS[level] }}>{score}%</span><div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>Risk Level: <strong style={{ color: RISK_COLORS[level] }}>{level}</strong></div></div>}
        <Field label="Recommendation" style={{ marginBottom: 12 }}><textarea value={form.recommendation} onChange={e => s('recommendation', e.target.value)} style={{ ...inp, height: 50 }} /></Field>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#7c3aed', marginBottom: 8 }}>CLINICIAN REVIEW (Mandatory)</div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Clinician Review Notes"><textarea value={form.clinicianReview} onChange={e => s('clinicianReview', e.target.value)} style={{ ...inp, height: 50 }} /></Field>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 8 }}><input type="checkbox" checked={form.clinicianOverride as any} onChange={e => s('clinicianOverride', e.target.checked)} /> Clinician overrides AI score</label>
            {form.clinicianOverride && <Field label="Override Reason"><input value={form.overrideReason} onChange={e => s('overrideReason', e.target.value)} style={inp} /></Field>}
          </div>
        </div>
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
