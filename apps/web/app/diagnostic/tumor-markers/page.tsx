'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useFeatureGate, FeatureLockedBlock } from '@/lib/feature-gate';
import { RegulatoryGuidance } from '@/lib/regulatory-guidance';
import { PageHeader, Modal, Field, DataTable, StatusPill, useList, savePost, savePatch, fmtDate, today, errMsg, TEAL } from '../compliance/_components';

const MARKERS = [
  { name: 'PSA (Total)', code: 'PSA', cancer: 'Prostate', unit: 'ng/mL', refMax: 4.0 },
  { name: 'CA 125', code: 'CA125', cancer: 'Ovarian', unit: 'U/mL', refMax: 35 },
  { name: 'CA 19-9', code: 'CA199', cancer: 'Pancreatic', unit: 'U/mL', refMax: 37 },
  { name: 'CA 15-3', code: 'CA153', cancer: 'Breast', unit: 'U/mL', refMax: 30 },
  { name: 'CEA', code: 'CEA', cancer: 'Colorectal', unit: 'ng/mL', refMax: 5.0 },
  { name: 'AFP', code: 'AFP', cancer: 'Hepatocellular', unit: 'ng/mL', refMax: 10 },
  { name: 'βhCG', code: 'BHCG', cancer: 'Germ Cell', unit: 'mIU/mL', refMax: 5 },
  { name: 'LDH', code: 'LDH', cancer: 'Lymphoma', unit: 'U/L', refMax: 250 },
  { name: 'CA 72-4', code: 'CA724', cancer: 'Gastric', unit: 'U/mL', refMax: 6.9 },
  { name: 'HE4', code: 'HE4', cancer: 'Ovarian', unit: 'pmol/L', refMax: 140 },
  { name: 'NSE', code: 'NSE', cancer: 'Lung (SCLC)', unit: 'ng/mL', refMax: 16.3 },
  { name: 'CYFRA 21-1', code: 'CYFRA', cancer: 'Lung (NSCLC)', unit: 'ng/mL', refMax: 3.3 },
  { name: 'Thyroglobulin', code: 'TG', cancer: 'Thyroid', unit: 'ng/mL', refMax: 55 },
  { name: 'Calcitonin', code: 'CALCI', cancer: 'Medullary Thyroid', unit: 'pg/mL', refMax: 10 },
];

export default function TumorMarkersPage() {
  const gate = useFeatureGate('tumor-markers');
  if (gate.locked) return <FeatureLockedBlock gate={gate} />;
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader title="Tumor Markers — Cancer Screening" subtitle="NCCN Guidelines · ASCO Tumor Marker Recommendations · Serial Monitoring" />
      <TumorList />
      <RegulatoryGuidance title="Tumor Markers — Regulatory Requirements" items={[
        { body: 'NCCN Clinical Practice Guidelines', detail: 'Tumor markers should not be used alone for cancer diagnosis. They are most useful for monitoring treatment response and detecting recurrence. Serial measurements with consistent methodology are essential for trend analysis.' },
        { body: 'ASCO Tumor Marker Guidelines', detail: 'ASCO recommends specific markers for specific cancers: CEA for colorectal, CA 125 for ovarian, PSA for prostate, AFP for hepatocellular, CA 15-3 for breast. Markers should always be interpreted in clinical context.' },
        { body: 'NABL ISO 15189 — Immunoassay QC', detail: 'Tumor marker assays require daily QC with two levels of control. Inter-assay CV should be maintained within manufacturer specifications. Method comparison studies required when changing platforms.' },
      ]} />
    </div>
  );
}

function TumorList() {
  const { rows, total, loading, page, setPage, reload } = useList('/diagnostic/tumor-markers');
  const [showModal, setShowModal] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const columns = useMemo(() => [
    { key: 'testDate', label: 'Date', render: (r: any) => fmtDate(r.testDate) },
    { key: 'patientName', label: 'Patient' },
    { key: 'markerName', label: 'Marker', render: (r: any) => <span style={{ fontWeight: 600 }}>{r.markerName}</span> },
    { key: 'cancerType', label: 'Cancer Type', render: (r: any) => r.cancerType || '—' },
    { key: 'value', label: 'Value', render: (r: any) => r.value != null ? <span style={{ fontWeight: 600, color: r.isElevated ? '#dc2626' : '#16a34a' }}>{r.value} {r.unit || ''}</span> : '—' },
    { key: 'referenceMax', label: 'Ref Max', render: (r: any) => r.referenceMax != null ? `≤${r.referenceMax}` : '—' },
    { key: 'isElevated', label: 'Flag', render: (r: any) => r.isElevated ? <span style={{ color: '#dc2626', fontWeight: 700 }}>↑ HIGH</span> : <span style={{ color: '#94a3b8' }}>Normal</span> },
    { key: 'trend', label: 'Trend', render: (r: any) => r.trend === 'rising' ? <span style={{ color: '#dc2626' }}>↑ Rising</span> : r.trend === 'falling' ? <span style={{ color: '#16a34a' }}>↓ Falling</span> : r.trend === 'stable' ? <span style={{ color: '#d97706' }}>→ Stable</span> : '—' },
    { key: 'status', label: 'Status', render: (r: any) => <StatusPill status={r.status} map={{ draft: { bg: '#f1f5f9', fg: '#475569', label: 'Draft' }, verified: { bg: '#ecfdf5', fg: '#059669', label: 'Verified' }, reported: { bg: '#dbeafe', fg: '#1e40af', label: 'Reported' } }} /> },
  ], []);
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}><button onClick={() => { setEditId(null); setShowModal(true); }} style={priBtn}>+ New Tumor Marker</button></div>
      <DataTable columns={columns} rows={rows} loading={loading} total={total} page={page} onPageChange={setPage} onRowClick={(r: any) => { setEditId(r.id); setShowModal(true); }} emptyMessage="No tumor marker results yet." />
      {showModal && <TumorModal id={editId} onClose={() => { setShowModal(false); setEditId(null); }} onSaved={() => { setShowModal(false); setEditId(null); reload(); }} />}
    </>
  );
}

function TumorModal({ id, onClose, onSaved }: { id: string | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [loading, setLoading] = useState(!!id);
  const [form, setForm] = useState({ patientName: '', patientUhid: '', patientAge: '', patientGender: '', testDate: today(), markerName: '', markerCode: '', cancerType: '', value: '', unit: '', referenceMin: '', referenceMax: '', previousValue: '', previousDate: '', trend: '', method: '', clinicalHistory: '', interpretation: '', recommendation: '', orderedBy: '', notes: '', status: 'draft' });
  const s = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const selectMarker = (markerName: string) => {
    const m = MARKERS.find(x => x.name === markerName);
    if (m) { s('markerName', m.name); s('markerCode', m.code); s('cancerType', m.cancer); s('unit', m.unit); s('referenceMax', m.refMax.toString()); }
    else { s('markerName', markerName); }
  };

  useEffect(() => { if (!id) return; fetch(`/api/v1/diagnostic/tumor-markers/${id}`).then(r => r.json()).then(d => { if (d) { const f: any = {}; Object.keys(form).forEach(k => { f[k] = d[k]?.toString()?.split('T')[0] || d[k]?.toString() || ''; }); setForm(f); } }).finally(() => setLoading(false)); }, [id]);
  const handleSave = async () => { setError(''); setSaving(true); try { if (id) await savePatch(`/diagnostic/tumor-markers/${id}`, form); else await savePost('/diagnostic/tumor-markers', form); onSaved(); } catch (err) { setError(errMsg(err)); } finally { setSaving(false); } };
  if (loading) return <Modal title="Loading..." onClose={onClose}><div style={{ padding: 32, textAlign: 'center' }}>Loading...</div></Modal>;
  const isElevated = form.value && form.referenceMax ? Number(form.value) > Number(form.referenceMax) : false;
  return (
    <Modal title={id ? 'Edit Tumor Marker' : 'New Tumor Marker Result'} onClose={onClose} width={900}>
      <div style={{ padding: '16px 24px', maxHeight: '75vh', overflowY: 'auto' }}>
        {error && <div style={{ padding: 12, background: '#fef2f2', color: '#dc2626', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Patient *"><input value={form.patientName} onChange={e => s('patientName', e.target.value)} style={inp} /></Field>
          <Field label="Age"><input type="number" value={form.patientAge} onChange={e => s('patientAge', e.target.value)} style={inp} /></Field>
          <Field label="Test Date"><input type="date" value={form.testDate} onChange={e => s('testDate', e.target.value)} style={inp} /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Marker *"><select value={form.markerName} onChange={e => selectMarker(e.target.value)} style={sel}><option value="">Select...</option>{MARKERS.map(m => <option key={m.name} value={m.name}>{m.name} ({m.cancer})</option>)}</select></Field>
          <Field label="Cancer Type"><input value={form.cancerType} onChange={e => s('cancerType', e.target.value)} style={inp} /></Field>
          <Field label="Method"><input value={form.method} onChange={e => s('method', e.target.value)} style={inp} placeholder="e.g. ECLIA, ELISA" /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Value *"><input type="number" step="0.01" value={form.value} onChange={e => s('value', e.target.value)} style={{ ...inp, borderColor: isElevated ? '#fecaca' : '#cbd5e1', background: isElevated ? '#fef2f2' : 'white' }} /></Field>
          <Field label="Unit"><input value={form.unit} onChange={e => s('unit', e.target.value)} style={inp} /></Field>
          <Field label="Ref Max"><input type="number" step="0.01" value={form.referenceMax} onChange={e => s('referenceMax', e.target.value)} style={inp} /></Field>
          <Field label="Trend"><select value={form.trend} onChange={e => s('trend', e.target.value)} style={sel}><option value="">—</option><option value="rising">↑ Rising</option><option value="stable">→ Stable</option><option value="falling">↓ Falling</option></select></Field>
        </div>
        {isElevated && <div style={{ padding: 12, background: '#fef2f2', borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#dc2626', border: '1px solid #fecaca' }}>⚠ <strong>ELEVATED</strong> — Value {form.value} exceeds reference maximum {form.referenceMax} {form.unit}. Clinical correlation and follow-up recommended per NCCN/ASCO guidelines.</div>}
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
