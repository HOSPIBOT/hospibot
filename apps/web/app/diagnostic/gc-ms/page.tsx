'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useFeatureGate, FeatureLockedBlock } from '@/lib/feature-gate';
import { RegulatoryGuidance } from '@/lib/regulatory-guidance';
import { PageHeader, Modal, Field, DataTable, StatusPill, useList, savePost, savePatch, fmtDate, today, errMsg, TEAL } from '../compliance/_components';

const TEST_TYPES = ['Drugs of Abuse Panel', 'Toxicology Screen', 'Doping Control (NADA)', 'Workplace Testing', 'Clinical Toxicology', 'Post-mortem Toxicology'];
const METHODS = ['GC-MS', 'LC-MS/MS', 'GC-FID', 'HPLC-UV', 'HPLC-DAD'];
const SCREENING_METHODS = ['Immunoassay (EMIT/CEDIA)', 'ELISA', 'Lateral Flow', 'TLC'];

export default function GcMsPage() {
  const gate = useFeatureGate('gc-ms');
  if (gate.locked) return <FeatureLockedBlock gate={gate} />;
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader title="GC-MS / LC-MS Analysis" subtitle="Forensic Chromatography · NDPS Act · ISO 17025 · WADA Technical Documents" />
      <GcMsList />
      <RegulatoryGuidance title="GC-MS/LC-MS — Regulatory Requirements" items={[
        { body: 'ISO/IEC 17025:2017 — Forensic Testing', detail: 'All confirmatory analyses must use validated GC-MS or LC-MS/MS methods. Method validation includes: linearity, precision, accuracy, LOD/LOQ, selectivity, carryover, and matrix effects. Internal standards (deuterated analogues) are mandatory for quantitative analysis.' },
        { body: 'NDPS Act 1985 — FSL Analysis Standards', detail: 'Forensic Science Laboratory analysis of seized substances must follow NCB Standing Orders. GC-MS is the gold standard for confirmation. Reports must include: retention times, ion ratios, and comparison with certified reference standards. Results are admissible as evidence per CrPC Section 293.' },
        { body: 'WADA Technical Documents (Anti-Doping)', detail: 'WADA TD2021MRPL specifies Minimum Required Performance Levels for each prohibited substance. Confirmation by GC-MS/MS or LC-MS/MS is mandatory. Each analytical batch must include: positive control, negative control, blank, and internal standard. Ion ratio criteria must be met for positive identification.' },
        { body: 'SOFT/AAFS Forensic Toxicology Guidelines', detail: 'Society of Forensic Toxicologists recommends: two-tier testing (screening + confirmation by different methodology). Confirmation cutoffs are typically lower than screening cutoffs. All positive confirmations must be reviewed by a certifying scientist before reporting.' },
      ]} />
    </div>
  );
}

function GcMsList() {
  const { rows, total, loading, page, setPage, reload } = useList('/diagnostic/gc-ms');
  const [showModal, setShowModal] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const columns = useMemo(() => [
    { key: 'caseNumber', label: 'Case #', render: (r: any) => <span style={{ fontWeight: 600, color: TEAL }}>{r.caseNumber}</span> },
    { key: 'analysisDate', label: 'Date', render: (r: any) => fmtDate(r.analysisDate) },
    { key: 'subjectName', label: 'Subject', render: (r: any) => r.subjectName || '—' },
    { key: 'testType', label: 'Type', render: (r: any) => r.testType || '—' },
    { key: 'instrumentMethod', label: 'Method' },
    { key: 'screeningResult', label: 'Screen', render: (r: any) => r.screeningResult === 'presumptive-positive' ? <span style={{ color: '#d97706' }}>Presumptive +</span> : r.screeningResult === 'negative' ? <span style={{ color: '#16a34a' }}>Neg</span> : '—' },
    { key: 'overallResult', label: 'Confirm', render: (r: any) => r.overallResult === 'positive' ? <span style={{ color: '#dc2626', fontWeight: 700 }}>POSITIVE</span> : r.overallResult === 'negative' ? <span style={{ color: '#16a34a' }}>Negative</span> : '—' },
    { key: 'qcPassed', label: 'QC', render: (r: any) => r.qcPassed ? <span style={{ color: '#16a34a' }}>✓</span> : <span style={{ color: '#dc2626' }}>✗</span> },
    { key: 'ndpsRelevant', label: 'NDPS', render: (r: any) => r.ndpsRelevant ? <span style={{ color: '#dc2626', fontWeight: 600 }}>Yes</span> : '—' },
    { key: 'status', label: 'Status', render: (r: any) => <StatusPill status={r.status} map={{ 'in-progress': { bg: '#fef3c7', fg: '#92400e', label: 'In Progress' }, reviewed: { bg: '#dbeafe', fg: '#1e40af', label: 'Reviewed' }, reported: { bg: '#ecfdf5', fg: '#059669', label: 'Reported' } }} /> },
  ], []);
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}><button onClick={() => { setEditId(null); setShowModal(true); }} style={priBtn}>+ New GC-MS Analysis</button></div>
      <DataTable columns={columns} rows={rows} loading={loading} total={total} page={page} onPageChange={setPage} onRowClick={(r: any) => { setEditId(r.id); setShowModal(true); }} emptyMessage="No GC-MS analyses yet." />
      {showModal && <GcMsModal id={editId} onClose={() => { setShowModal(false); setEditId(null); }} onSaved={() => { setShowModal(false); setEditId(null); reload(); }} />}
    </>
  );
}

function GcMsModal({ id, onClose, onSaved }: { id: string | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [loading, setLoading] = useState(!!id);
  const [form, setForm] = useState({ caseNumber: '', subjectName: '', subjectId: '', testType: 'Drugs of Abuse Panel', specimenType: 'Urine', screeningResult: '', screeningMethod: '', confirmRequired: false, instrumentMethod: 'GC-MS', instrumentId: '', analysisDate: today(), analystName: '', overallResult: '', qcPassed: false, internalStandard: '', batchId: '', reviewedBy: '', reportNumber: '', ndpsRelevant: false, notes: '', status: 'in-progress' });
  const s = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  useEffect(() => { if (!id) return; fetch(`/api/v1/diagnostic/gc-ms/${id}`).then(r => r.json()).then(d => { if (d) { const f: any = {}; Object.keys(form).forEach(k => { if (typeof d[k] === 'boolean') f[k] = d[k]; else f[k] = d[k]?.toString()?.split('T')[0] || d[k]?.toString() || ''; }); setForm(f); } }).finally(() => setLoading(false)); }, [id]);
  const handleSave = async () => { setError(''); setSaving(true); try { if (id) await savePatch(`/diagnostic/gc-ms/${id}`, form); else await savePost('/diagnostic/gc-ms', form); onSaved(); } catch (err) { setError(errMsg(err)); } finally { setSaving(false); } };
  if (loading) return <Modal title="Loading..." onClose={onClose}><div style={{ padding: 32, textAlign: 'center' }}>Loading...</div></Modal>;
  return (
    <Modal title={id ? 'Edit GC-MS Analysis' : 'New GC-MS/LC-MS Analysis'} onClose={onClose} width={900}>
      <div style={{ padding: '16px 24px', maxHeight: '75vh', overflowY: 'auto' }}>
        {error && <div style={{ padding: 12, background: '#fef2f2', color: '#dc2626', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Case # *"><input value={form.caseNumber} onChange={e => s('caseNumber', e.target.value)} style={inp} /></Field>
          <Field label="Subject Name"><input value={form.subjectName} onChange={e => s('subjectName', e.target.value)} style={inp} /></Field>
          <Field label="Test Type *"><select value={form.testType} onChange={e => s('testType', e.target.value)} style={sel}>{TEST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></Field>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: TEAL, marginBottom: 8 }}>SCREENING</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Screening Method"><select value={form.screeningMethod} onChange={e => s('screeningMethod', e.target.value)} style={sel}><option value="">Select...</option>{SCREENING_METHODS.map(m => <option key={m} value={m}>{m}</option>)}</select></Field>
          <Field label="Screening Result"><select value={form.screeningResult} onChange={e => s('screeningResult', e.target.value)} style={sel}><option value="">—</option><option value="negative">Negative</option><option value="presumptive-positive">Presumptive Positive</option></select></Field>
          <Field label="Confirm Required"><label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}><input type="checkbox" checked={form.confirmRequired as any} onChange={e => s('confirmRequired', e.target.checked)} /><span style={{ fontSize: 13 }}>Confirmation testing required</span></label></Field>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: TEAL, marginBottom: 8 }}>CONFIRMATION (GC-MS / LC-MS)</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Method *"><select value={form.instrumentMethod} onChange={e => s('instrumentMethod', e.target.value)} style={sel}>{METHODS.map(m => <option key={m} value={m}>{m}</option>)}</select></Field>
          <Field label="Instrument ID"><input value={form.instrumentId} onChange={e => s('instrumentId', e.target.value)} style={inp} /></Field>
          <Field label="Analysis Date"><input type="date" value={form.analysisDate} onChange={e => s('analysisDate', e.target.value)} style={inp} /></Field>
          <Field label="Analyst"><input value={form.analystName} onChange={e => s('analystName', e.target.value)} style={inp} /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Overall Result"><select value={form.overallResult} onChange={e => s('overallResult', e.target.value)} style={{ ...sel, fontWeight: 600, color: form.overallResult === 'positive' ? '#dc2626' : form.overallResult === 'negative' ? '#16a34a' : '#1e293b' }}><option value="">—</option><option value="negative">Negative</option><option value="positive">Positive</option><option value="inconclusive">Inconclusive</option></select></Field>
          <Field label="Internal Standard"><input value={form.internalStandard} onChange={e => s('internalStandard', e.target.value)} style={inp} placeholder="e.g. d5-Amphetamine" /></Field>
          <Field label="Batch ID"><input value={form.batchId} onChange={e => s('batchId', e.target.value)} style={inp} /></Field>
          <Field label="QC Passed"><label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}><input type="checkbox" checked={form.qcPassed as any} onChange={e => s('qcPassed', e.target.checked)} /><span style={{ fontSize: 13 }}>Batch QC passed</span></label></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Reviewed By"><input value={form.reviewedBy} onChange={e => s('reviewedBy', e.target.value)} style={inp} /></Field>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}><input type="checkbox" checked={form.ndpsRelevant as any} onChange={e => s('ndpsRelevant', e.target.checked)} /><span style={{ fontSize: 13, color: '#dc2626', fontWeight: 500 }}>NDPS Act relevant (narcotic/psychotropic substance detected)</span></label>
        </div>
        {form.ndpsRelevant && <div style={{ padding: 12, background: '#fef2f2', borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#991b1b', border: '1px solid #fecaca' }}>⚠ <strong>NDPS Act Alert</strong> — This analysis detected a substance controlled under the NDPS Act 1985. Ensure chain of custody documentation is complete. Report must be submitted to the requesting authority/court.</div>}
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
