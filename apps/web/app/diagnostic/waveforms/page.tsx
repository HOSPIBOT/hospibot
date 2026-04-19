'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useFeatureGate, FeatureLockedBlock } from '@/lib/feature-gate';
import { RegulatoryGuidance } from '@/lib/regulatory-guidance';
import { PageHeader, Modal, Field, DataTable, StatusPill, useList, savePost, savePatch, fmtDate, today, errMsg, TEAL } from '../compliance/_components';

const STUDY_TYPES = ['Routine EEG', 'Sleep-Deprived EEG', 'Prolonged EEG', 'Video EEG', 'Ambulatory EEG', 'Motor NCS', 'Sensory NCS', 'Needle EMG', 'NCS + EMG Combined', 'Evoked Potentials (VEP/SSEP/BAEP)'];

export default function WaveformsPage() {
  const gate = useFeatureGate('waveforms');
  if (gate.locked) return <FeatureLockedBlock gate={gate} />;
  const { rows, total, loading, page, setPage, reload } = useList('/diagnostic/waveforms');
  const [showModal, setShowModal] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const columns = useMemo(() => [
    { key: 'studyDate', label: 'Date', render: (r: any) => fmtDate(r.studyDate) },
    { key: 'patientName', label: 'Patient' },
    { key: 'studyType', label: 'Study Type' },
    { key: 'recordingDuration', label: 'Duration', render: (r: any) => r.recordingDuration ? `${r.recordingDuration} min` : '—' },
    { key: 'abnormalFindings', label: 'Abnormal', render: (r: any) => r.abnormalFindings ? <span style={{ color: '#dc2626' }}>Yes</span> : <span style={{ color: '#94a3b8' }}>—</span> },
    { key: 'epileptiformActivity', label: 'Epileptiform', render: (r: any) => r.epileptiformActivity ? <span style={{ color: '#dc2626', fontWeight: 600 }}>⚠ Yes</span> : '—' },
    { key: 'neurophysiologist', label: 'Neurophysiologist', render: (r: any) => r.neurophysiologist || '—' },
    { key: 'status', label: 'Status', render: (r: any) => <StatusPill status={r.status} map={{ draft: { bg: '#f1f5f9', fg: '#475569', label: 'Draft' }, verified: { bg: '#ecfdf5', fg: '#059669', label: 'Verified' }, reported: { bg: '#dbeafe', fg: '#1e40af', label: 'Reported' } }} /> },
  ], []);
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader title="Waveform Studies — EEG / EMG / NCS" subtitle="ACNS Standards · AANEM Guidelines · Neurophysiology Reporting" />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}><button onClick={() => { setEditId(null); setShowModal(true); }} style={priBtn}>+ New Study</button></div>
      <DataTable columns={columns} rows={rows} loading={loading} total={total} page={page} onPageChange={setPage} onRowClick={(r: any) => { setEditId(r.id); setShowModal(true); }} emptyMessage="No waveform studies yet." />
      {showModal && <WaveformModal id={editId} onClose={() => { setShowModal(false); setEditId(null); }} onSaved={() => { setShowModal(false); setEditId(null); reload(); }} />}
      <RegulatoryGuidance title="Neurophysiology — Regulatory Requirements" items={[
        { body: 'ACNS Standards for EEG', detail: 'American Clinical Neurophysiology Society standards: minimum 20-minute recording, standard 10-20 electrode placement, activation procedures (hyperventilation, photic stimulation) unless contraindicated. Background activity, abnormalities, and epileptiform discharges must be documented.' },
        { body: 'AANEM Guidelines for NCS/EMG', detail: 'American Association of Neuromuscular & Electrodiagnostic Medicine: NCS must include motor and sensory studies of relevant nerves. Temperature must be maintained ≥32°C at recording site. F-waves and H-reflexes recorded when clinically indicated.' },
        { body: 'Pre-Study Medication Documentation', detail: 'Current medications (especially AEDs, benzodiazepines, sedatives) must be documented before EEG as they significantly affect background activity. Sleep deprivation must be confirmed if sleep-deprived EEG ordered.' },
      ]} />
    </div>
  );
}

function WaveformModal({ id, onClose, onSaved }: { id: string | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [loading, setLoading] = useState(!!id);
  const [form, setForm] = useState({ patientName: '', patientAge: '', patientGender: '', studyDate: today(), studyType: 'Routine EEG', indication: '', medicationList: '', sleepDeprived: false, montage: '', channelCount: '', recordingDuration: '', activationProcedures: '', backgroundActivity: '', abnormalFindings: '', epileptiformActivity: '', nervesStudied: '', needleEmgFindings: '', interpretation: '', clinicalCorrelation: '', neurophysiologist: '', technicianName: '', notes: '', status: 'draft' });
  const s = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  useEffect(() => { if (!id) return; fetch(`/api/v1/diagnostic/waveforms/${id}`).then(r => r.json()).then(d => { if (d) { const f: any = {}; Object.keys(form).forEach(k => { if (typeof d[k] === 'boolean') f[k] = d[k]; else f[k] = d[k]?.toString()?.split('T')[0] || d[k]?.toString() || ''; }); setForm(f); } }).finally(() => setLoading(false)); }, [id]);
  const handleSave = async () => { setError(''); setSaving(true); try { if (id) await savePatch(`/diagnostic/waveforms/${id}`, form); else await savePost('/diagnostic/waveforms', form); onSaved(); } catch (err) { setError(errMsg(err)); } finally { setSaving(false); } };
  if (loading) return <Modal title="Loading..." onClose={onClose}><div style={{ padding: 32, textAlign: 'center' }}>Loading...</div></Modal>;
  const isEeg = form.studyType.includes('EEG');
  const isNcs = form.studyType.includes('NCS') || form.studyType.includes('EMG');
  return (
    <Modal title={id ? 'Edit Study' : 'New Waveform Study'} onClose={onClose} width={900}>
      <div style={{ padding: '16px 24px', maxHeight: '75vh', overflowY: 'auto' }}>
        {error && <div style={{ padding: 12, background: '#fef2f2', color: '#dc2626', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Patient *"><input value={form.patientName} onChange={e => s('patientName', e.target.value)} style={inp} /></Field>
          <Field label="Age"><input type="number" value={form.patientAge} onChange={e => s('patientAge', e.target.value)} style={inp} /></Field>
          <Field label="Date"><input type="date" value={form.studyDate} onChange={e => s('studyDate', e.target.value)} style={inp} /></Field>
          <Field label="Study Type *"><select value={form.studyType} onChange={e => s('studyType', e.target.value)} style={sel}>{STUDY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Indication"><input value={form.indication} onChange={e => s('indication', e.target.value)} style={inp} /></Field>
          <Field label="Current Medications"><input value={form.medicationList} onChange={e => s('medicationList', e.target.value)} style={inp} placeholder="AEDs, sedatives, etc." /></Field>
        </div>
        {isEeg && (<>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            <Field label="Duration (min)"><input type="number" value={form.recordingDuration} onChange={e => s('recordingDuration', e.target.value)} style={inp} /></Field>
            <Field label="Montage"><input value={form.montage} onChange={e => s('montage', e.target.value)} style={inp} placeholder="Bipolar / Referential" /></Field>
            <Field label="Channels"><input type="number" value={form.channelCount} onChange={e => s('channelCount', e.target.value)} style={inp} /></Field>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '20px 0 0', fontSize: 13 }}><input type="checkbox" checked={form.sleepDeprived as any} onChange={e => s('sleepDeprived', e.target.checked)} /> Sleep deprived</label>
          </div>
          <Field label="Background Activity" style={{ marginBottom: 12 }}><textarea value={form.backgroundActivity} onChange={e => s('backgroundActivity', e.target.value)} style={{ ...inp, height: 50 }} /></Field>
          <Field label="Epileptiform Activity" style={{ marginBottom: 12 }}><input value={form.epileptiformActivity} onChange={e => s('epileptiformActivity', e.target.value)} style={inp} placeholder="Spikes, sharp waves, spike-and-wave..." /></Field>
        </>)}
        {isNcs && (<>
          <Field label="Nerves Studied" style={{ marginBottom: 12 }}><input value={form.nervesStudied} onChange={e => s('nervesStudied', e.target.value)} style={inp} placeholder="Median, ulnar, peroneal, tibial..." /></Field>
          <Field label="Needle EMG Findings" style={{ marginBottom: 12 }}><textarea value={form.needleEmgFindings} onChange={e => s('needleEmgFindings', e.target.value)} style={{ ...inp, height: 50 }} /></Field>
        </>)}
        <Field label="Interpretation" style={{ marginBottom: 12 }}><textarea value={form.interpretation} onChange={e => s('interpretation', e.target.value)} style={{ ...inp, height: 60 }} /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Neurophysiologist"><input value={form.neurophysiologist} onChange={e => s('neurophysiologist', e.target.value)} style={inp} /></Field>
          <Field label="Technician"><input value={form.technicianName} onChange={e => s('technicianName', e.target.value)} style={inp} /></Field>
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
