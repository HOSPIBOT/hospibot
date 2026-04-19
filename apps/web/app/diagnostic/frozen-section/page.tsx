'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useFeatureGate, FeatureLockedBlock } from '@/lib/feature-gate';
import { RegulatoryGuidance } from '@/lib/regulatory-guidance';
import { PageHeader, Modal, Field, DataTable, StatusPill, useList, savePost, savePatch, fmtDate, today, errMsg, TEAL } from '../compliance/_components';

export default function FrozenSectionPage() {
  const gate = useFeatureGate('frozen-section');
  if (gate.locked) return <FeatureLockedBlock gate={gate} />;
  const { rows, total, loading, page, setPage, reload } = useList('/diagnostic/frozen-section');
  const [showModal, setShowModal] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const columns = useMemo(() => [
    { key: 'receivedAt', label: 'Received', render: (r: any) => fmtDate(r.receivedAt) },
    { key: 'caseNumber', label: 'Case #', render: (r: any) => <span style={{ fontWeight: 600, color: TEAL }}>{r.caseNumber}</span> },
    { key: 'patientName', label: 'Patient', render: (r: any) => r.patientName || '—' },
    { key: 'surgeonName', label: 'Surgeon' },
    { key: 'specimenSite', label: 'Site', render: (r: any) => r.specimenSite || '—' },
    { key: 'frozenDiagnosis', label: 'Frozen Dx', render: (r: any) => r.frozenDiagnosis ? <span style={{ fontSize: 12 }}>{r.frozenDiagnosis.substring(0, 40)}</span> : '—' },
    { key: 'tatMinutes', label: 'TAT', render: (r: any) => r.tatMinutes != null ? <span style={{ fontWeight: 600, color: r.tatMinutes <= 20 ? '#16a34a' : r.tatMinutes <= 30 ? '#d97706' : '#dc2626' }}>{r.tatMinutes} min</span> : '—' },
    { key: 'concordant', label: 'Concordance', render: (r: any) => r.concordant === true ? <span style={{ color: '#16a34a' }}>✓</span> : r.concordant === false ? <span style={{ color: '#dc2626' }}>✗</span> : '—' },
    { key: 'status', label: 'Status', render: (r: any) => <StatusPill status={r.status} map={{ received: { bg: '#fef3c7', fg: '#92400e', label: 'Received' }, processing: { bg: '#dbeafe', fg: '#1e40af', label: 'Processing' }, communicated: { bg: '#e0e7ff', fg: '#4338ca', label: 'Communicated' }, finalized: { bg: '#ecfdf5', fg: '#059669', label: 'Finalized' } }} /> },
  ], []);
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader title="Frozen Section — Intraoperative Pathology" subtitle="Rapid Diagnosis · TAT Tracking · Concordance Monitoring" />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}><button onClick={() => { setEditId(null); setShowModal(true); }} style={priBtn}>+ New Frozen Section</button></div>
      <DataTable columns={columns} rows={rows} loading={loading} total={total} page={page} onPageChange={setPage} onRowClick={(r: any) => { setEditId(r.id); setShowModal(true); }} emptyMessage="No frozen sections yet." />
      {showModal && <FrozenModal id={editId} onClose={() => { setShowModal(false); setEditId(null); }} onSaved={() => { setShowModal(false); setEditId(null); reload(); }} />}
      <RegulatoryGuidance title="Frozen Section — Regulatory Requirements" items={[
        { body: 'CAP Frozen Section Benchmarks', detail: 'Target TAT: ≤20 minutes from receipt to communication. Concordance rate with permanent sections should be ≥95%. All discordant cases must be reviewed at M&M conference.' },
        { body: 'Communication Documentation', detail: 'Frozen section result must be communicated verbally to the surgeon. Time, method, and person communicated to must be documented. Read-back confirmation recommended.' },
      ]} />
    </div>
  );
}

function FrozenModal({ id, onClose, onSaved }: { id: string | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [loading, setLoading] = useState(!!id);
  const [form, setForm] = useState({ caseNumber: '', patientName: '', surgeonName: '', operatingRoom: '', specimenType: '', specimenSite: '', clinicalQuestion: '', receivedAt: '', grossDescription: '', sectionsCount: '', frozenDiagnosis: '', communicatedTo: '', communicatedAt: '', communicationMethod: 'phone', reportedAt: '', permanentDiagnosis: '', concordant: '', discordanceReason: '', pathologistName: '', notes: '', status: 'received' });
  const s = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  useEffect(() => { if (!id) return; fetch(`/api/v1/diagnostic/frozen-section/${id}`).then(r => r.json()).then(d => { if (d) { const f: any = {}; Object.keys(form).forEach(k => { if (d[k] === true) f[k] = 'true'; else if (d[k] === false) f[k] = 'false'; else f[k] = d[k]?.toString()?.replace('T', ' ')?.substring(0, 16) || d[k]?.toString() || ''; }); setForm(f); } }).finally(() => setLoading(false)); }, [id]);
  const handleSave = async () => { setError(''); setSaving(true); try { const payload = { ...form, concordant: form.concordant === 'true' ? true : form.concordant === 'false' ? false : null }; if (id) await savePatch(`/diagnostic/frozen-section/${id}`, payload); else await savePost('/diagnostic/frozen-section', payload); onSaved(); } catch (err) { setError(errMsg(err)); } finally { setSaving(false); } };
  if (loading) return <Modal title="Loading..." onClose={onClose}><div style={{ padding: 32, textAlign: 'center' }}>Loading...</div></Modal>;
  return (
    <Modal title={id ? 'Edit Frozen Section' : 'New Frozen Section'} onClose={onClose} width={900}>
      <div style={{ padding: '16px 24px', maxHeight: '75vh', overflowY: 'auto' }}>
        {error && <div style={{ padding: 12, background: '#fef2f2', color: '#dc2626', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Case # *"><input value={form.caseNumber} onChange={e => s('caseNumber', e.target.value)} style={inp} /></Field>
          <Field label="Patient"><input value={form.patientName} onChange={e => s('patientName', e.target.value)} style={inp} /></Field>
          <Field label="Surgeon *"><input value={form.surgeonName} onChange={e => s('surgeonName', e.target.value)} style={inp} /></Field>
          <Field label="OR"><input value={form.operatingRoom} onChange={e => s('operatingRoom', e.target.value)} style={inp} /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Specimen Site"><input value={form.specimenSite} onChange={e => s('specimenSite', e.target.value)} style={inp} /></Field>
          <Field label="Clinical Question"><input value={form.clinicalQuestion} onChange={e => s('clinicalQuestion', e.target.value)} style={inp} placeholder="e.g. Margin status? Malignant?" /></Field>
          <Field label="Received At"><input type="datetime-local" value={form.receivedAt} onChange={e => s('receivedAt', e.target.value)} style={inp} /></Field>
        </div>
        <Field label="Gross Description" style={{ marginBottom: 12 }}><textarea value={form.grossDescription} onChange={e => s('grossDescription', e.target.value)} style={{ ...inp, height: 50 }} /></Field>
        <Field label="Frozen Diagnosis" style={{ marginBottom: 12 }}><textarea value={form.frozenDiagnosis} onChange={e => s('frozenDiagnosis', e.target.value)} style={{ ...inp, height: 50 }} /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Communicated To"><input value={form.communicatedTo} onChange={e => s('communicatedTo', e.target.value)} style={inp} /></Field>
          <Field label="Communicated At"><input type="datetime-local" value={form.communicatedAt} onChange={e => s('communicatedAt', e.target.value)} style={inp} /></Field>
          <Field label="Reported At"><input type="datetime-local" value={form.reportedAt} onChange={e => s('reportedAt', e.target.value)} style={inp} /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Permanent Diagnosis"><input value={form.permanentDiagnosis} onChange={e => s('permanentDiagnosis', e.target.value)} style={inp} /></Field>
          <Field label="Concordant?"><select value={form.concordant} onChange={e => s('concordant', e.target.value)} style={sel}><option value="">—</option><option value="true">Yes — Concordant</option><option value="false">No — Discordant</option></select></Field>
          <Field label="Pathologist"><input value={form.pathologistName} onChange={e => s('pathologistName', e.target.value)} style={inp} /></Field>
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
