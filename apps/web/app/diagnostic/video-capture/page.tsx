'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useFeatureGate, FeatureLockedBlock } from '@/lib/feature-gate';
import { RegulatoryGuidance } from '@/lib/regulatory-guidance';
import { PageHeader, Modal, Field, DataTable, StatusPill, useList, savePost, savePatch, fmtDate, today, errMsg, TEAL } from '../compliance/_components';

const PROC_TYPES = ['Upper GI Endoscopy', 'Colonoscopy', 'ERCP', 'EUS (Endoscopic Ultrasound)', 'Bronchoscopy', 'Capsule Endoscopy', 'Enteroscopy', 'Sigmoidoscopy'];
const SCOPE_TYPES = ['Gastroscope', 'Colonoscope', 'Duodenoscope', 'Bronchoscope', 'Echoendoscope', 'Enteroscope'];

export default function VideoCapturePage() {
  const gate = useFeatureGate('video-capture');
  if (gate.locked) return <FeatureLockedBlock gate={gate} />;
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader title="Video Capture — Endoscopy Recording" subtitle="ASGE Quality Indicators · Photo Documentation · Biopsy Tracking" />
      <VideoList />
      <RegulatoryGuidance title="Video Capture — Regulatory Requirements" items={[
        { body: 'ASGE Quality Indicators in Endoscopy', detail: 'Photo documentation of key landmarks is mandatory. For colonoscopy: cecal intubation rate must be ≥95%, adenoma detection rate tracked, withdrawal time ≥6 minutes recommended. Boston Bowel Preparation Scale (0-9) must be recorded.' },
        { body: 'ESGE Technical Review — Image Documentation', detail: 'Minimum photo documentation requirements: upper GI — 8 standard views; colonoscopy — 7 standard views including cecum, ileocecal valve, and all pathology. All biopsy sites must be photographed before and after biopsy.' },
        { body: 'Scope Reprocessing Documentation', detail: 'Scope serial number must be recorded for every procedure for reprocessing traceability. In case of infection, scope tracking enables rapid identification of all patients examined with the same scope.' },
      ]} />
    </div>
  );
}

function VideoList() {
  const { rows, total, loading, page, setPage, reload } = useList('/diagnostic/video-capture');
  const [showModal, setShowModal] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const columns = useMemo(() => [
    { key: 'recordingId', label: 'Recording ID', render: (r: any) => <span style={{ fontWeight: 600, color: TEAL }}>{r.recordingId}</span> },
    { key: 'procedureDate', label: 'Date', render: (r: any) => fmtDate(r.procedureDate) },
    { key: 'patientName', label: 'Patient' },
    { key: 'procedureType', label: 'Procedure' },
    { key: 'endoscopist', label: 'Endoscopist', render: (r: any) => r.endoscopist || '—' },
    { key: 'imageCount', label: 'Images', render: (r: any) => r.imageCount || '—' },
    { key: 'durationMinutes', label: 'Duration', render: (r: any) => r.durationMinutes ? `${r.durationMinutes} min` : '—' },
    { key: 'biopsyCount', label: 'Biopsies', render: (r: any) => r.biopsyCount || '—' },
    { key: 'cecalIntubation', label: 'Cecal', render: (r: any) => r.procedureType?.includes('Colon') ? (r.cecalIntubation ? <span style={{ color: '#16a34a' }}>✓</span> : <span style={{ color: '#dc2626' }}>✗</span>) : '—' },
    { key: 'status', label: 'Status', render: (r: any) => <StatusPill status={r.status} map={{ recorded: { bg: '#dbeafe', fg: '#1e40af', label: 'Recorded' }, reviewed: { bg: '#ecfdf5', fg: '#059669', label: 'Reviewed' }, archived: { bg: '#f3f4f6', fg: '#6b7280', label: 'Archived' } }} /> },
  ], []);
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}><button onClick={() => { setEditId(null); setShowModal(true); }} style={priBtn}>+ New Recording</button></div>
      <DataTable columns={columns} rows={rows} loading={loading} total={total} page={page} onPageChange={setPage} onRowClick={(r: any) => { setEditId(r.id); setShowModal(true); }} emptyMessage="No video capture records yet." />
      {showModal && <VideoModal id={editId} onClose={() => { setShowModal(false); setEditId(null); }} onSaved={() => { setShowModal(false); setEditId(null); reload(); }} />}
    </>
  );
}

function VideoModal({ id, onClose, onSaved }: { id: string | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [loading, setLoading] = useState(!!id);
  const [form, setForm] = useState({ patientName: '', patientUhid: '', procedureDate: today(), procedureType: 'Upper GI Endoscopy', scopeType: '', scopeId: '', endoscopist: '', recordingStart: '', recordingEnd: '', durationMinutes: '', imageCount: '', findings: '', biopsyCount: '', completionStatus: '', cecalIntubation: false, withdrawalTime: '', bostonPrepScore: '', polypsFound: '', polypectomyDone: false, notes: '', status: 'recorded' });
  const s = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  useEffect(() => { if (!id) return; fetch(`/api/v1/diagnostic/video-capture/${id}`).then(r => r.json()).then(d => { if (d) { const f: any = {}; Object.keys(form).forEach(k => { if (typeof d[k] === 'boolean') f[k] = d[k]; else f[k] = d[k]?.toString()?.split('T')[0] || d[k]?.toString() || ''; }); setForm(f); } }).finally(() => setLoading(false)); }, [id]);
  const handleSave = async () => { setError(''); setSaving(true); try { if (id) await savePatch(`/diagnostic/video-capture/${id}`, form); else await savePost('/diagnostic/video-capture', form); onSaved(); } catch (err) { setError(errMsg(err)); } finally { setSaving(false); } };
  if (loading) return <Modal title="Loading..." onClose={onClose}><div style={{ padding: 32, textAlign: 'center' }}>Loading...</div></Modal>;
  return (
    <Modal title={id ? 'Edit Recording' : 'New Video Recording'} onClose={onClose} width={900}>
      <div style={{ padding: '16px 24px', maxHeight: '75vh', overflowY: 'auto' }}>
        {error && <div style={{ padding: 12, background: '#fef2f2', color: '#dc2626', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Patient *"><input value={form.patientName} onChange={e => s('patientName', e.target.value)} style={inp} /></Field>
          <Field label="Date"><input type="date" value={form.procedureDate} onChange={e => s('procedureDate', e.target.value)} style={inp} /></Field>
          <Field label="Procedure *"><select value={form.procedureType} onChange={e => s('procedureType', e.target.value)} style={sel}>{PROC_TYPES.map(p => <option key={p} value={p}>{p}</option>)}</select></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Scope Type"><select value={form.scopeType} onChange={e => s('scopeType', e.target.value)} style={sel}><option value="">Select...</option>{SCOPE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}</select></Field>
          <Field label="Scope Serial #"><input value={form.scopeId} onChange={e => s('scopeId', e.target.value)} style={inp} /></Field>
          <Field label="Endoscopist"><input value={form.endoscopist} onChange={e => s('endoscopist', e.target.value)} style={inp} /></Field>
          <Field label="Images Captured"><input type="number" value={form.imageCount} onChange={e => s('imageCount', e.target.value)} style={inp} /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Start Time"><input type="time" value={form.recordingStart} onChange={e => s('recordingStart', e.target.value)} style={inp} /></Field>
          <Field label="End Time"><input type="time" value={form.recordingEnd} onChange={e => s('recordingEnd', e.target.value)} style={inp} /></Field>
          <Field label="Duration (min)"><input type="number" value={form.durationMinutes} onChange={e => s('durationMinutes', e.target.value)} style={inp} /></Field>
          <Field label="Biopsy Count"><input type="number" value={form.biopsyCount} onChange={e => s('biopsyCount', e.target.value)} style={inp} /></Field>
        </div>
        {form.procedureType.includes('Colon') && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16, padding: 12, background: '#f8fafc', borderRadius: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}><input type="checkbox" checked={form.cecalIntubation as any} onChange={e => s('cecalIntubation', e.target.checked)} /> Cecal Intubation</label>
            <Field label="Withdrawal (min)"><input value={form.withdrawalTime} onChange={e => s('withdrawalTime', e.target.value)} style={inp} /></Field>
            <Field label="Boston Prep (0-9)"><input type="number" min={0} max={9} value={form.bostonPrepScore} onChange={e => s('bostonPrepScore', e.target.value)} style={inp} /></Field>
            <Field label="Polyps Found"><input type="number" value={form.polypsFound} onChange={e => s('polypsFound', e.target.value)} style={inp} /></Field>
          </div>
        )}
        <Field label="Findings" style={{ marginBottom: 16 }}><textarea value={form.findings} onChange={e => s('findings', e.target.value)} style={{ ...inp, height: 80 }} placeholder="Describe endoscopic findings..." /></Field>
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
