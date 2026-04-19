'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useFeatureGate, FeatureLockedBlock } from '@/lib/feature-gate';
import { RegulatoryGuidance } from '@/lib/regulatory-guidance';
import { PageHeader, Modal, Field, DataTable, StatusPill, useList, savePost, savePatch, fmtDate, today, errMsg, TEAL } from '../compliance/_components';

const PANELS = ['Breast Panel (ER/PR/HER2/Ki67)', 'Lymphoma Panel', 'Melanoma Panel', 'Lung Panel', 'GI Panel', 'Soft Tissue Panel', 'Neuroendocrine Panel', 'Renal Panel', 'CK Panel', 'Custom Panel'];

export default function IhcPage() {
  const gate = useFeatureGate('ihc');
  if (gate.locked) return <FeatureLockedBlock gate={gate} />;
  const { rows, total, loading, page, setPage, reload } = useList('/diagnostic/ihc');
  const [showModal, setShowModal] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const columns = useMemo(() => [
    { key: 'requestDate', label: 'Date', render: (r: any) => fmtDate(r.requestDate) },
    { key: 'caseNumber', label: 'Case #', render: (r: any) => <span style={{ fontWeight: 600, color: TEAL }}>{r.caseNumber}</span> },
    { key: 'patientName', label: 'Patient', render: (r: any) => r.patientName || '—' },
    { key: 'antibodyPanel', label: 'Panel' },
    { key: 'erStatus', label: 'ER', render: (r: any) => r.erStatus ? <StatusBadge val={r.erStatus} /> : '—' },
    { key: 'prStatus', label: 'PR', render: (r: any) => r.prStatus ? <StatusBadge val={r.prStatus} /> : '—' },
    { key: 'herScore', label: 'HER2', render: (r: any) => r.herScore || '—' },
    { key: 'ki67Percentage', label: 'Ki67', render: (r: any) => r.ki67Percentage != null ? `${r.ki67Percentage}%` : '—' },
    { key: 'tatHours', label: 'TAT', render: (r: any) => r.tatHours ? `${r.tatHours}h` : '—' },
    { key: 'status', label: 'Status', render: (r: any) => <StatusPill status={r.status} map={{ requested: { bg: '#fef3c7', fg: '#92400e', label: 'Requested' }, staining: { bg: '#dbeafe', fg: '#1e40af', label: 'Staining' }, scored: { bg: '#e0e7ff', fg: '#4338ca', label: 'Scored' }, reported: { bg: '#ecfdf5', fg: '#059669', label: 'Reported' } }} /> },
  ], []);
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader title="IHC Workflow — Immunohistochemistry" subtitle="Antibody Panels · ER/PR/HER2/Ki67 Scoring · Turnaround Tracking" />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}><button onClick={() => { setEditId(null); setShowModal(true); }} style={priBtn}>+ New IHC Request</button></div>
      <DataTable columns={columns} rows={rows} loading={loading} total={total} page={page} onPageChange={setPage} onRowClick={(r: any) => { setEditId(r.id); setShowModal(true); }} emptyMessage="No IHC workflows yet." />
      {showModal && <IhcModal id={editId} onClose={() => { setShowModal(false); setEditId(null); }} onSaved={() => { setShowModal(false); setEditId(null); reload(); }} />}
      <RegulatoryGuidance title="IHC — Regulatory Requirements" items={[
        { body: 'CAP/ASCO Guidelines for ER/PR Testing', detail: 'ER/PR positive: ≥1% of tumor nuclei staining. Testing must use validated antibodies with appropriate controls. Results must include percentage, intensity, and Allred score.' },
        { body: 'CAP/ASCO HER2 Testing Guidelines (2023)', detail: 'HER2 IHC scoring: 0/1+ negative, 2+ equivocal (reflex to FISH), 3+ positive. Must use FDA-approved assays. TAT should not exceed 10 working days from biopsy to result.' },
        { body: 'Ki67 Standardization (IKWG)', detail: 'International Ki67 Working Group recommends standardized scoring: count at least 500 cells in hot spot areas. Report as percentage. Cutoff varies by tumor type (e.g., ≥20% high in breast cancer).' },
      ]} />
    </div>
  );
}

function StatusBadge({ val }: { val: string }) {
  const pos = val.toLowerCase().includes('pos') || val === '+';
  return <span style={{ fontWeight: 600, color: pos ? '#16a34a' : '#dc2626' }}>{val}</span>;
}

function IhcModal({ id, onClose, onSaved }: { id: string | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [loading, setLoading] = useState(!!id);
  const [form, setForm] = useState({ caseNumber: '', patientName: '', specimenType: '', specimenSite: '', blockId: '', requestDate: today(), requestedBy: '', indication: '', antibodyPanel: 'Breast Panel (ER/PR/HER2/Ki67)', stainingMethod: 'automated', erStatus: '', prStatus: '', herScore: '', ki67Percentage: '', scoringMethod: '', interpretation: '', pathologistName: '', tatHours: '', notes: '', status: 'requested' });
  const s = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  useEffect(() => { if (!id) return; fetch(`/api/v1/diagnostic/ihc/${id}`).then(r => r.json()).then(d => { if (d) { const f: any = {}; Object.keys(form).forEach(k => { f[k] = d[k]?.toString()?.split('T')[0] || d[k]?.toString() || ''; }); setForm(f); } }).finally(() => setLoading(false)); }, [id]);
  const handleSave = async () => { setError(''); setSaving(true); try { if (id) await savePatch(`/diagnostic/ihc/${id}`, form); else await savePost('/diagnostic/ihc', form); onSaved(); } catch (err) { setError(errMsg(err)); } finally { setSaving(false); } };
  if (loading) return <Modal title="Loading..." onClose={onClose}><div style={{ padding: 32, textAlign: 'center' }}>Loading...</div></Modal>;
  const isBreast = form.antibodyPanel.includes('Breast');
  return (
    <Modal title={id ? 'Edit IHC' : 'New IHC Request'} onClose={onClose} width={900}>
      <div style={{ padding: '16px 24px', maxHeight: '75vh', overflowY: 'auto' }}>
        {error && <div style={{ padding: 12, background: '#fef2f2', color: '#dc2626', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Case # *"><input value={form.caseNumber} onChange={e => s('caseNumber', e.target.value)} style={inp} /></Field>
          <Field label="Patient"><input value={form.patientName} onChange={e => s('patientName', e.target.value)} style={inp} /></Field>
          <Field label="Panel *"><select value={form.antibodyPanel} onChange={e => s('antibodyPanel', e.target.value)} style={sel}>{PANELS.map(p => <option key={p} value={p}>{p}</option>)}</select></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Block ID"><input value={form.blockId} onChange={e => s('blockId', e.target.value)} style={inp} /></Field>
          <Field label="Specimen Site"><input value={form.specimenSite} onChange={e => s('specimenSite', e.target.value)} style={inp} /></Field>
          <Field label="Request Date"><input type="date" value={form.requestDate} onChange={e => s('requestDate', e.target.value)} style={inp} /></Field>
          <Field label="Requested By"><input value={form.requestedBy} onChange={e => s('requestedBy', e.target.value)} style={inp} /></Field>
        </div>
        {isBreast && (<>
          <div style={{ fontSize: 13, fontWeight: 600, color: TEAL, marginBottom: 8 }}>BREAST PANEL RESULTS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            <Field label="ER Status"><select value={form.erStatus} onChange={e => s('erStatus', e.target.value)} style={sel}><option value="">—</option><option value="Positive">Positive</option><option value="Negative">Negative</option></select></Field>
            <Field label="PR Status"><select value={form.prStatus} onChange={e => s('prStatus', e.target.value)} style={sel}><option value="">—</option><option value="Positive">Positive</option><option value="Negative">Negative</option></select></Field>
            <Field label="HER2 Score"><select value={form.herScore} onChange={e => s('herScore', e.target.value)} style={sel}><option value="">—</option><option value="0">0 (Negative)</option><option value="1+">1+ (Negative)</option><option value="2+">2+ (Equivocal → FISH)</option><option value="3+">3+ (Positive)</option></select></Field>
            <Field label="Ki67 %"><input type="number" value={form.ki67Percentage} onChange={e => s('ki67Percentage', e.target.value)} style={inp} /></Field>
          </div>
        </>)}
        <Field label="Interpretation" style={{ marginBottom: 16 }}><textarea value={form.interpretation} onChange={e => s('interpretation', e.target.value)} style={{ ...inp, height: 60 }} /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Pathologist"><input value={form.pathologistName} onChange={e => s('pathologistName', e.target.value)} style={inp} /></Field>
          <Field label="TAT (hours)"><input type="number" value={form.tatHours} onChange={e => s('tatHours', e.target.value)} style={inp} /></Field>
          <Field label="Status"><select value={form.status} onChange={e => s('status', e.target.value)} style={sel}><option value="requested">Requested</option><option value="staining">Staining</option><option value="scored">Scored</option><option value="reported">Reported</option></select></Field>
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
