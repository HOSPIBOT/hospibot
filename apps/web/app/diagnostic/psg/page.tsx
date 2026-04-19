'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useFeatureGate, FeatureLockedBlock } from '@/lib/feature-gate';
import { RegulatoryGuidance } from '@/lib/regulatory-guidance';
import { PageHeader, Modal, Field, DataTable, StatusPill, useList, savePost, savePatch, fmtDate, today, errMsg, TEAL } from '../compliance/_components';

const STUDY_TYPES = ['Full PSG (Level 1)', 'Split-Night PSG', 'CPAP Titration', 'Home Sleep Test (Level 3)', 'MSLT', 'MWT'];
const SEV_COLORS: Record<string, string> = { Normal: '#16a34a', Mild: '#d97706', Moderate: '#ea580c', Severe: '#dc2626' };

export default function PsgPage() {
  const gate = useFeatureGate('psg');
  if (gate.locked) return <FeatureLockedBlock gate={gate} />;
  const { rows, total, loading, page, setPage, reload } = useList('/diagnostic/psg');
  const [showModal, setShowModal] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const columns = useMemo(() => [
    { key: 'studyDate', label: 'Date', render: (r: any) => fmtDate(r.studyDate) },
    { key: 'patientName', label: 'Patient' },
    { key: 'studyType', label: 'Type', render: (r: any) => r.studyType || '—' },
    { key: 'ahi', label: 'AHI', render: (r: any) => r.ahi != null ? <span style={{ fontWeight: 700, color: SEV_COLORS[r.osaSeverity] || '#475569' }}>{r.ahi}</span> : '—' },
    { key: 'osaSeverity', label: 'OSA Severity', render: (r: any) => r.osaSeverity ? <span style={{ fontWeight: 600, color: SEV_COLORS[r.osaSeverity] || '#475569' }}>{r.osaSeverity}</span> : '—' },
    { key: 'lowestSpo2', label: 'Low SpO2', render: (r: any) => r.lowestSpo2 != null ? <span style={{ color: r.lowestSpo2 < 88 ? '#dc2626' : '#475569' }}>{r.lowestSpo2}%</span> : '—' },
    { key: 'sleepEfficiency', label: 'SE%', render: (r: any) => r.sleepEfficiency != null ? `${r.sleepEfficiency}%` : '—' },
    { key: 'epworthScore', label: 'ESS', render: (r: any) => r.epworthScore != null ? r.epworthScore : '—' },
    { key: 'status', label: 'Status', render: (r: any) => <StatusPill status={r.status} map={{ draft: { bg: '#f1f5f9', fg: '#475569', label: 'Draft' }, scored: { bg: '#dbeafe', fg: '#1e40af', label: 'Scored' }, reported: { bg: '#ecfdf5', fg: '#059669', label: 'Reported' } }} /> },
  ], []);
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader title="Polysomnography — Sleep Studies" subtitle="AASM Scoring Manual v3 · AHI Classification · Sleep Architecture" />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}><button onClick={() => { setEditId(null); setShowModal(true); }} style={priBtn}>+ New Sleep Study</button></div>
      <DataTable columns={columns} rows={rows} loading={loading} total={total} page={page} onPageChange={setPage} onRowClick={(r: any) => { setEditId(r.id); setShowModal(true); }} emptyMessage="No sleep studies yet." />
      {showModal && <PsgModal id={editId} onClose={() => { setShowModal(false); setEditId(null); }} onSaved={() => { setShowModal(false); setEditId(null); reload(); }} />}
      <RegulatoryGuidance title="Polysomnography — Regulatory Requirements" items={[
        { body: 'AASM Manual for Scoring Sleep (v3)', detail: 'PSG scoring must follow AASM criteria for sleep stages (N1, N2, N3, REM), respiratory events (apneas ≥10s, hypopneas with ≥3% desat or arousal), and movement events (PLMs). AHI classification: Normal <5, Mild 5-14, Moderate 15-29, Severe ≥30.' },
        { body: 'AASM Accreditation Standards', detail: 'Sleep labs must have minimum infrastructure: sound-attenuated rooms, video monitoring, emergency equipment, trained technologists (RPSGT preferred). Equipment calibration and bio-calibration required before each study.' },
        { body: 'Epworth Sleepiness Scale (ESS)', detail: 'Pre-study ESS score must be documented. Score ≥10 suggests excessive daytime sleepiness. Combined with AHI for clinical decision-making regarding CPAP therapy initiation.' },
      ]} />
    </div>
  );
}

function PsgModal({ id, onClose, onSaved }: { id: string | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [loading, setLoading] = useState(!!id);
  const [form, setForm] = useState({ patientName: '', patientAge: '', patientBmi: '', epworthScore: '', studyDate: today(), studyType: 'Full PSG (Level 1)', lightsOff: '', lightsOn: '', totalRecordTime: '', totalSleepTime: '', sleepEfficiency: '', sleepLatency: '', remLatency: '', stageN1Pct: '', stageN2Pct: '', stageN3Pct: '', stageRemPct: '', ahi: '', obstructiveApneas: '', centralApneas: '', hypopneas: '', supineAhi: '', remAhi: '', lowestSpo2: '', meanSpo2: '', odi: '', t90: '', plmIndex: '', arousalIndex: '', snoring: false, interpretation: '', recommendation: '', sleepPhysician: '', notes: '', status: 'draft' });
  const s = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  useEffect(() => { if (!id) return; fetch(`/api/v1/diagnostic/psg/${id}`).then(r => r.json()).then(d => { if (d) { const f: any = {}; Object.keys(form).forEach(k => { if (typeof d[k] === 'boolean') f[k] = d[k]; else f[k] = d[k]?.toString()?.split('T')[0] || d[k]?.toString() || ''; }); setForm(f); } }).finally(() => setLoading(false)); }, [id]);
  const handleSave = async () => { setError(''); setSaving(true); try { if (id) await savePatch(`/diagnostic/psg/${id}`, form); else await savePost('/diagnostic/psg', form); onSaved(); } catch (err) { setError(errMsg(err)); } finally { setSaving(false); } };
  if (loading) return <Modal title="Loading..." onClose={onClose}><div style={{ padding: 32, textAlign: 'center' }}>Loading...</div></Modal>;
  const ahi = form.ahi ? Number(form.ahi) : null;
  const sev = ahi === null ? null : ahi < 5 ? 'Normal' : ahi < 15 ? 'Mild' : ahi < 30 ? 'Moderate' : 'Severe';
  return (
    <Modal title={id ? 'Edit Sleep Study' : 'New Polysomnography'} onClose={onClose} width={950}>
      <div style={{ padding: '16px 24px', maxHeight: '75vh', overflowY: 'auto' }}>
        {error && <div style={{ padding: 12, background: '#fef2f2', color: '#dc2626', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Patient *"><input value={form.patientName} onChange={e => s('patientName', e.target.value)} style={inp} /></Field>
          <Field label="Age"><input type="number" value={form.patientAge} onChange={e => s('patientAge', e.target.value)} style={inp} /></Field>
          <Field label="BMI"><input type="number" step="0.1" value={form.patientBmi} onChange={e => s('patientBmi', e.target.value)} style={inp} /></Field>
          <Field label="ESS Score"><input type="number" value={form.epworthScore} onChange={e => s('epworthScore', e.target.value)} style={inp} /></Field>
          <Field label="Study Type"><select value={form.studyType} onChange={e => s('studyType', e.target.value)} style={sel}>{STUDY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></Field>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: TEAL, marginBottom: 8 }}>RESPIRATORY EVENTS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="AHI *"><input type="number" step="0.1" value={form.ahi} onChange={e => s('ahi', e.target.value)} style={inp} /></Field>
          <Field label="Obstructive"><input type="number" value={form.obstructiveApneas} onChange={e => s('obstructiveApneas', e.target.value)} style={inp} /></Field>
          <Field label="Central"><input type="number" value={form.centralApneas} onChange={e => s('centralApneas', e.target.value)} style={inp} /></Field>
          <Field label="Hypopneas"><input type="number" value={form.hypopneas} onChange={e => s('hypopneas', e.target.value)} style={inp} /></Field>
          <Field label="Supine AHI"><input type="number" step="0.1" value={form.supineAhi} onChange={e => s('supineAhi', e.target.value)} style={inp} /></Field>
        </div>
        {sev && <div style={{ padding: 12, borderRadius: 8, marginBottom: 16, fontWeight: 700, fontSize: 15, textAlign: 'center', background: sev === 'Severe' ? '#fef2f2' : sev === 'Moderate' ? '#fff7ed' : sev === 'Mild' ? '#fffbeb' : '#f0fdf4', color: SEV_COLORS[sev] }}>OSA Severity: {sev} (AHI {ahi})</div>}
        <div style={{ fontSize: 13, fontWeight: 600, color: TEAL, marginBottom: 8 }}>OXYGENATION</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Lowest SpO2 %"><input type="number" value={form.lowestSpo2} onChange={e => s('lowestSpo2', e.target.value)} style={inp} /></Field>
          <Field label="Mean SpO2 %"><input type="number" value={form.meanSpo2} onChange={e => s('meanSpo2', e.target.value)} style={inp} /></Field>
          <Field label="ODI"><input type="number" step="0.1" value={form.odi} onChange={e => s('odi', e.target.value)} style={inp} /></Field>
          <Field label="T90 (min)"><input type="number" value={form.t90} onChange={e => s('t90', e.target.value)} style={inp} /></Field>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: TEAL, marginBottom: 8 }}>SLEEP ARCHITECTURE</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="SE %"><input type="number" value={form.sleepEfficiency} onChange={e => s('sleepEfficiency', e.target.value)} style={inp} /></Field>
          <Field label="N1 %"><input type="number" value={form.stageN1Pct} onChange={e => s('stageN1Pct', e.target.value)} style={inp} /></Field>
          <Field label="N2 %"><input type="number" value={form.stageN2Pct} onChange={e => s('stageN2Pct', e.target.value)} style={inp} /></Field>
          <Field label="N3 %"><input type="number" value={form.stageN3Pct} onChange={e => s('stageN3Pct', e.target.value)} style={inp} /></Field>
          <Field label="REM %"><input type="number" value={form.stageRemPct} onChange={e => s('stageRemPct', e.target.value)} style={inp} /></Field>
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
