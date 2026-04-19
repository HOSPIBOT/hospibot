'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useFeatureGate, FeatureLockedBlock } from '@/lib/feature-gate';
import { RegulatoryGuidance } from '@/lib/regulatory-guidance';
import { PageHeader, Modal, Field, DataTable, StatusPill, useList, savePost, savePatch, fmtDate, today, errMsg, TEAL } from '../compliance/_components';

const ASA_CLASSES = ['ASA I — Healthy', 'ASA II — Mild Systemic', 'ASA III — Severe Systemic', 'ASA IV — Life Threat', 'ASA V — Moribund'];
const SEDATION_TYPES = ['Minimal (Anxiolysis)', 'Moderate (Conscious)', 'Deep', 'General Anesthesia'];
const PROC_TYPES = ['Upper GI Endoscopy', 'Colonoscopy', 'ERCP', 'EUS', 'Bronchoscopy', 'Sigmoidoscopy', 'Other'];

export default function SedationLogPage() {
  const gate = useFeatureGate('sedation-log');
  if (gate.locked) return <FeatureLockedBlock gate={gate} />;
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader title="Sedation Log — Endoscopy" subtitle="ASA Sedation Guidelines · Patient Safety · Aldrete Discharge Scoring" />
      <SedationList />
      <RegulatoryGuidance title="Sedation Log — Regulatory Requirements" items={[
        { body: 'ASA Practice Guidelines for Sedation (2018)', detail: 'Pre-procedure assessment required: ASA class, fasting status (≥2h clear liquids, ≥6h solids), allergies, airway evaluation. Continuous monitoring of SpO2, HR, BP, and consciousness level during sedation. Discharge requires Aldrete score ≥9.' },
        { body: 'ASGE Quality Indicators for Endoscopy', detail: 'Informed consent required before sedation. Sedation drugs, doses, and times must be documented. Adverse events must be recorded. Reversal agents (flumazenil, naloxone) must be immediately available.' },
        { body: 'Indian SEBI/MCI Guidelines', detail: 'Sedation for endoscopic procedures must be administered by or supervised by a trained physician. Emergency resuscitation equipment must be available in the procedure room. Post-procedure monitoring until full recovery with documented discharge criteria.' },
      ]} />
    </div>
  );
}

function SedationList() {
  const { rows, total, loading, page, setPage, reload } = useList('/diagnostic/sedation-log');
  const [showModal, setShowModal] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const columns = useMemo(() => [
    { key: 'procedureDate', label: 'Date', render: (r: any) => fmtDate(r.procedureDate) },
    { key: 'patientName', label: 'Patient' },
    { key: 'procedureType', label: 'Procedure' },
    { key: 'asaClass', label: 'ASA', render: (r: any) => r.asaClass ? r.asaClass.split('—')[0].trim() : '—' },
    { key: 'sedationType', label: 'Sedation' },
    { key: 'aldretScore', label: 'Aldrete', render: (r: any) => r.aldretScore != null ? <span style={{ color: r.aldretScore >= 9 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{r.aldretScore}/10</span> : '—' },
    { key: 'adverseEvents', label: 'Adverse', render: (r: any) => r.adverseEvents ? <span style={{ color: '#dc2626' }}>⚠ Yes</span> : <span style={{ color: '#94a3b8' }}>—</span> },
    { key: 'status', label: 'Status', render: (r: any) => <StatusPill status={r.status} map={{ 'in-progress': { bg: '#fef3c7', fg: '#92400e', label: 'In Progress' }, recovery: { bg: '#dbeafe', fg: '#1e40af', label: 'Recovery' }, discharged: { bg: '#ecfdf5', fg: '#059669', label: 'Discharged' } }} /> },
  ], []);
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}><button onClick={() => { setEditId(null); setShowModal(true); }} style={priBtn}>+ New Sedation Log</button></div>
      <DataTable columns={columns} rows={rows} loading={loading} total={total} page={page} onPageChange={setPage} onRowClick={(r: any) => { setEditId(r.id); setShowModal(true); }} emptyMessage="No sedation logs yet." />
      {showModal && <SedationModal id={editId} onClose={() => { setShowModal(false); setEditId(null); }} onSaved={() => { setShowModal(false); setEditId(null); reload(); }} />}
    </>
  );
}

function SedationModal({ id, onClose, onSaved }: { id: string | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [loading, setLoading] = useState(!!id);
  const [form, setForm] = useState({ patientName: '', patientAge: '', patientWeight: '', procedureDate: today(), procedureType: '', asaClass: '', allergies: '', fastingHours: '', fastingConfirmed: false, sedationConsent: false, sedationType: 'Moderate (Conscious)', sedationStartTime: '', sedationEndTime: '', recoveryStartTime: '', dischargeTime: '', aldretScore: '', endoscopist: '', sedationist: '', adverseEvents: '', escortPresent: false, dischargeInstructions: false, notes: '', status: 'in-progress' });
  const s = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  useEffect(() => { if (!id) return; fetch(`/api/v1/diagnostic/sedation-log/${id}`).then(r => r.json()).then(d => { if (d) { const f: any = {}; Object.keys(form).forEach(k => { if (typeof d[k] === 'boolean') f[k] = d[k]; else f[k] = d[k]?.toString()?.split('T')[0] || d[k]?.toString() || ''; }); setForm(f); } }).finally(() => setLoading(false)); }, [id]);
  const handleSave = async () => { setError(''); setSaving(true); try { if (id) await savePatch(`/diagnostic/sedation-log/${id}`, form); else await savePost('/diagnostic/sedation-log', form); onSaved(); } catch (err) { setError(errMsg(err)); } finally { setSaving(false); } };
  if (loading) return <Modal title="Loading..." onClose={onClose}><div style={{ padding: 32, textAlign: 'center' }}>Loading...</div></Modal>;
  return (
    <Modal title={id ? 'Edit Sedation Log' : 'New Sedation Log'} onClose={onClose} width={900}>
      <div style={{ padding: '16px 24px', maxHeight: '75vh', overflowY: 'auto' }}>
        {error && <div style={{ padding: 12, background: '#fef2f2', color: '#dc2626', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Patient *"><input value={form.patientName} onChange={e => s('patientName', e.target.value)} style={inp} /></Field>
          <Field label="Age"><input type="number" value={form.patientAge} onChange={e => s('patientAge', e.target.value)} style={inp} /></Field>
          <Field label="Weight (kg)"><input type="number" value={form.patientWeight} onChange={e => s('patientWeight', e.target.value)} style={inp} /></Field>
          <Field label="Date *"><input type="date" value={form.procedureDate} onChange={e => s('procedureDate', e.target.value)} style={inp} /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Procedure"><select value={form.procedureType} onChange={e => s('procedureType', e.target.value)} style={sel}><option value="">Select...</option>{PROC_TYPES.map(p => <option key={p} value={p}>{p}</option>)}</select></Field>
          <Field label="ASA Class"><select value={form.asaClass} onChange={e => s('asaClass', e.target.value)} style={sel}><option value="">Select...</option>{ASA_CLASSES.map(a => <option key={a} value={a}>{a}</option>)}</select></Field>
          <Field label="Sedation Type"><select value={form.sedationType} onChange={e => s('sedationType', e.target.value)} style={sel}>{SEDATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></Field>
        </div>
        <div style={{ padding: 12, background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}><input type="checkbox" checked={form.sedationConsent as any} onChange={e => s('sedationConsent', e.target.checked)} /> Sedation consent obtained *</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}><input type="checkbox" checked={form.fastingConfirmed as any} onChange={e => s('fastingConfirmed', e.target.checked)} /> Fasting confirmed</label>
            <Field label="Hours fasted" style={{ flex: 'none', width: 100 }}><input type="number" value={form.fastingHours} onChange={e => s('fastingHours', e.target.value)} style={inp} /></Field>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Sedation Start"><input type="time" value={form.sedationStartTime} onChange={e => s('sedationStartTime', e.target.value)} style={inp} /></Field>
          <Field label="Sedation End"><input type="time" value={form.sedationEndTime} onChange={e => s('sedationEndTime', e.target.value)} style={inp} /></Field>
          <Field label="Recovery Start"><input type="time" value={form.recoveryStartTime} onChange={e => s('recoveryStartTime', e.target.value)} style={inp} /></Field>
          <Field label="Discharge Time"><input type="time" value={form.dischargeTime} onChange={e => s('dischargeTime', e.target.value)} style={inp} /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Aldrete Score (0-10)"><input type="number" min={0} max={10} value={form.aldretScore} onChange={e => s('aldretScore', e.target.value)} style={inp} /></Field>
          <Field label="Endoscopist"><input value={form.endoscopist} onChange={e => s('endoscopist', e.target.value)} style={inp} /></Field>
          <Field label="Sedationist"><input value={form.sedationist} onChange={e => s('sedationist', e.target.value)} style={inp} /></Field>
        </div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}><input type="checkbox" checked={form.escortPresent as any} onChange={e => s('escortPresent', e.target.checked)} /> Escort present for discharge</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}><input type="checkbox" checked={form.dischargeInstructions as any} onChange={e => s('dischargeInstructions', e.target.checked)} /> Discharge instructions given</label>
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
