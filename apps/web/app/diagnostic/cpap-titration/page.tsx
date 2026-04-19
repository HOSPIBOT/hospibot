'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useFeatureGate, FeatureLockedBlock } from '@/lib/feature-gate';
import { RegulatoryGuidance } from '@/lib/regulatory-guidance';
import { PageHeader, Modal, Field, DataTable, StatusPill, useList, savePost, savePatch, fmtDate, today, errMsg, TEAL } from '../compliance/_components';

const DEVICE_TYPES = ['CPAP', 'Auto-CPAP (APAP)', 'BiPAP', 'BiPAP-ST', 'ASV'];
const MASK_TYPES = ['Nasal', 'Nasal Pillows', 'Full Face', 'Oronasal', 'Oral'];

export default function CpapTitrationPage() {
  const gate = useFeatureGate('cpap-titration');
  if (gate.locked) return <FeatureLockedBlock gate={gate} />;
  const { rows, total, loading, page, setPage, reload } = useList('/diagnostic/cpap-titration');
  const [showModal, setShowModal] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const columns = useMemo(() => [
    { key: 'studyDate', label: 'Date', render: (r: any) => fmtDate(r.studyDate) },
    { key: 'patientName', label: 'Patient' },
    { key: 'deviceType', label: 'Device' },
    { key: 'diagnosticAhi', label: 'Diag AHI', render: (r: any) => r.diagnosticAhi != null ? r.diagnosticAhi : '—' },
    { key: 'optimalPressure', label: 'Optimal (cmH₂O)', render: (r: any) => r.optimalPressure != null ? <span style={{ fontWeight: 600, color: TEAL }}>{r.optimalPressure}</span> : '—' },
    { key: 'residualAhi', label: 'Residual AHI', render: (r: any) => r.residualAhi != null ? <span style={{ color: r.residualAhi < 5 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{r.residualAhi}</span> : '—' },
    { key: 'avgLeak', label: 'Avg Leak', render: (r: any) => r.avgLeak != null ? `${r.avgLeak} L/m` : '—' },
    { key: 'patientTolerance', label: 'Tolerance', render: (r: any) => r.patientTolerance || '—' },
    { key: 'status', label: 'Status', render: (r: any) => <StatusPill status={r.status} map={{ draft: { bg: '#f1f5f9', fg: '#475569', label: 'Draft' }, titrated: { bg: '#dbeafe', fg: '#1e40af', label: 'Titrated' }, prescribed: { bg: '#ecfdf5', fg: '#059669', label: 'Prescribed' } }} /> },
  ], []);
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader title="CPAP Titration — Pressure Optimization" subtitle="AASM Titration Protocol · Leak Monitoring · Residual AHI" />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}><button onClick={() => { setEditId(null); setShowModal(true); }} style={priBtn}>+ New Titration</button></div>
      <DataTable columns={columns} rows={rows} loading={loading} total={total} page={page} onPageChange={setPage} onRowClick={(r: any) => { setEditId(r.id); setShowModal(true); }} emptyMessage="No CPAP titrations yet." />
      {showModal && <CpapModal id={editId} onClose={() => { setShowModal(false); setEditId(null); }} onSaved={() => { setShowModal(false); setEditId(null); reload(); }} />}
      <RegulatoryGuidance title="CPAP Titration — Regulatory Requirements" items={[
        { body: 'AASM CPAP Titration Protocol', detail: 'Start at 4 cmH₂O, increase by 1 cmH₂O at ≥5-minute intervals until obstructive events eliminated. Optimal pressure: eliminates apneas, hypopneas, and snoring in supine REM. Target residual AHI <5.' },
        { body: 'Leak Management', detail: 'Unintentional leak >24 L/min indicates poor mask fit. Excessive leak reduces therapy efficacy. Mask refitting or resizing should be attempted during titration. Document mask type and size.' },
      ]} />
    </div>
  );
}

function CpapModal({ id, onClose, onSaved }: { id: string | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [loading, setLoading] = useState(!!id);
  const [form, setForm] = useState({ patientName: '', diagnosticAhi: '', studyDate: today(), studyType: 'full-night', deviceType: 'CPAP', deviceModel: '', maskType: '', maskSize: '', startPressure: '4', optimalPressure: '', maxPressure: '', epapPressure: '', ipapPressure: '', residualAhi: '', avgLeak: '', maxLeak: '', lowestSpo2: '', meanSpo2: '', supplementalO2: false, patientTolerance: '', recommendation: '', prescribedPressure: '', prescribedDevice: '', sleepPhysician: '', notes: '', status: 'draft' });
  const s = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  useEffect(() => { if (!id) return; fetch(`/api/v1/diagnostic/cpap-titration/${id}`).then(r => r.json()).then(d => { if (d) { const f: any = {}; Object.keys(form).forEach(k => { if (typeof d[k] === 'boolean') f[k] = d[k]; else f[k] = d[k]?.toString()?.split('T')[0] || d[k]?.toString() || ''; }); setForm(f); } }).finally(() => setLoading(false)); }, [id]);
  const handleSave = async () => { setError(''); setSaving(true); try { if (id) await savePatch(`/diagnostic/cpap-titration/${id}`, form); else await savePost('/diagnostic/cpap-titration', form); onSaved(); } catch (err) { setError(errMsg(err)); } finally { setSaving(false); } };
  if (loading) return <Modal title="Loading..." onClose={onClose}><div style={{ padding: 32, textAlign: 'center' }}>Loading...</div></Modal>;
  const isBipap = form.deviceType.includes('BiPAP') || form.deviceType === 'ASV';
  return (
    <Modal title={id ? 'Edit Titration' : 'New CPAP Titration'} onClose={onClose} width={900}>
      <div style={{ padding: '16px 24px', maxHeight: '75vh', overflowY: 'auto' }}>
        {error && <div style={{ padding: 12, background: '#fef2f2', color: '#dc2626', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Patient *"><input value={form.patientName} onChange={e => s('patientName', e.target.value)} style={inp} /></Field>
          <Field label="Diagnostic AHI"><input type="number" step="0.1" value={form.diagnosticAhi} onChange={e => s('diagnosticAhi', e.target.value)} style={inp} /></Field>
          <Field label="Date"><input type="date" value={form.studyDate} onChange={e => s('studyDate', e.target.value)} style={inp} /></Field>
          <Field label="Device"><select value={form.deviceType} onChange={e => s('deviceType', e.target.value)} style={sel}>{DEVICE_TYPES.map(d => <option key={d} value={d}>{d}</option>)}</select></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Mask Type"><select value={form.maskType} onChange={e => s('maskType', e.target.value)} style={sel}><option value="">—</option>{MASK_TYPES.map(m => <option key={m} value={m}>{m}</option>)}</select></Field>
          <Field label="Mask Size"><input value={form.maskSize} onChange={e => s('maskSize', e.target.value)} style={inp} placeholder="S / M / L" /></Field>
          <Field label="Device Model"><input value={form.deviceModel} onChange={e => s('deviceModel', e.target.value)} style={inp} /></Field>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: TEAL, marginBottom: 8 }}>PRESSURE SETTINGS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Start (cmH₂O)"><input type="number" step="0.5" value={form.startPressure} onChange={e => s('startPressure', e.target.value)} style={inp} /></Field>
          <Field label="Optimal"><input type="number" step="0.5" value={form.optimalPressure} onChange={e => s('optimalPressure', e.target.value)} style={inp} /></Field>
          <Field label="Max"><input type="number" step="0.5" value={form.maxPressure} onChange={e => s('maxPressure', e.target.value)} style={inp} /></Field>
          {isBipap && <Field label="EPAP"><input type="number" step="0.5" value={form.epapPressure} onChange={e => s('epapPressure', e.target.value)} style={inp} /></Field>}
          {isBipap && <Field label="IPAP"><input type="number" step="0.5" value={form.ipapPressure} onChange={e => s('ipapPressure', e.target.value)} style={inp} /></Field>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Residual AHI"><input type="number" step="0.1" value={form.residualAhi} onChange={e => s('residualAhi', e.target.value)} style={inp} /></Field>
          <Field label="Avg Leak (L/min)"><input type="number" value={form.avgLeak} onChange={e => s('avgLeak', e.target.value)} style={inp} /></Field>
          <Field label="Lowest SpO2"><input type="number" value={form.lowestSpo2} onChange={e => s('lowestSpo2', e.target.value)} style={inp} /></Field>
          <Field label="Tolerance"><select value={form.patientTolerance} onChange={e => s('patientTolerance', e.target.value)} style={sel}><option value="">—</option><option value="excellent">Excellent</option><option value="good">Good</option><option value="fair">Fair</option><option value="poor">Poor</option></select></Field>
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
