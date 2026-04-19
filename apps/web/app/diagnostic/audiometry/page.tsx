'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useFeatureGate, FeatureLockedBlock } from '@/lib/feature-gate';
import { RegulatoryGuidance } from '@/lib/regulatory-guidance';
import { PageHeader, Modal, Field, DataTable, StatusPill, useList, savePost, savePatch, fmtDate, today, errMsg, TEAL } from '../compliance/_components';

const FREQUENCIES = ['250', '500', '1000', '2000', '4000', '8000'];
const TEST_TYPES = ['pure-tone', 'speech', 'impedance', 'oto-acoustic', 'combined'];
const TYMP_TYPES = ['Type A (Normal)', 'Type As (Stiff)', 'Type Ad (Flaccid)', 'Type B (Flat)', 'Type C (Neg. Pressure)'];

export default function AudiometryPage() {
  const gate = useFeatureGate('audiometry');
  if (gate.locked) return <FeatureLockedBlock gate={gate} />;

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader title="Audiometry — Hearing Assessment" subtitle="NIOSH/OSHA Standards · WHO Hearing Grading · NABL Accreditation" />
      <AudiometryList />
      <RegulatoryGuidance title="Audiometry — Regulatory Requirements" items={[
        { body: 'NIOSH/OSHA Audiometric Standards', detail: 'Baseline audiogram required within 6 months of occupational noise exposure. Annual monitoring audiograms for noise-exposed workers. Standard Threshold Shift (STS): average shift of 10dB or more at 2000, 3000, 4000 Hz. Equipment calibration per ANSI S3.6.' },
        { body: 'WHO Hearing Grading (2021)', detail: 'Normal: ≤25 dB. Mild: 26-40 dB. Moderate: 41-55 dB. Moderately Severe: 56-70 dB. Severe: 71-90 dB. Profound: >90 dB. Based on Pure Tone Average (PTA) at 500, 1000, 2000 Hz. HospiBot auto-calculates PTA and grade.' },
        { body: 'NABL ISO 15189 — Audiology Lab', detail: 'Sound booth must meet ANSI S3.1 ambient noise requirements. Audiometer calibration annually per ANSI S3.6. Daily biological check with known listener. All equipment must have documented calibration certificates.' },
        { body: 'Indian ENT Society Guidelines', detail: 'Pre-employment audiometry mandatory for noise-exposed industries. Audiogram must be performed in a sound-treated booth. Results interpreted by qualified audiologist or ENT surgeon. Reports must include air/bone conduction, speech audiometry, and tympanometry.' },
      ]} />
    </div>
  );
}

function AudiometryList() {
  const { rows, total, loading, page, setPage, reload } = useList('/diagnostic/audiometry');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const columns = useMemo(() => [
    { key: 'testDate', label: 'Date', render: (r: any) => fmtDate(r.testDate) },
    { key: 'patientName', label: 'Patient' },
    { key: 'testType', label: 'Type' },
    { key: 'rightPta', label: 'R PTA', render: (r: any) => r.rightPta != null ? `${r.rightPta} dB` : '—' },
    { key: 'leftPta', label: 'L PTA', render: (r: any) => r.leftPta != null ? `${r.leftPta} dB` : '—' },
    { key: 'rightGrade', label: 'R Grade', render: (r: any) => r.rightGrade ? <GradeBadge grade={r.rightGrade} /> : '—' },
    { key: 'leftGrade', label: 'L Grade', render: (r: any) => r.leftGrade ? <GradeBadge grade={r.leftGrade} /> : '—' },
    { key: 'status', label: 'Status', render: (r: any) => <StatusPill status={r.status} map={{ draft: { bg: '#f1f5f9', fg: '#475569', label: 'Draft' }, verified: { bg: '#ecfdf5', fg: '#059669', label: 'Verified' }, reported: { bg: '#dbeafe', fg: '#1e40af', label: 'Reported' } }} /> },
  ], []);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={() => { setEditId(null); setShowModal(true); }} style={priBtn}>+ New Audiometry Test</button>
      </div>
      <DataTable columns={columns} rows={rows} loading={loading} total={total} page={page} onPageChange={setPage} onRowClick={(r: any) => { setEditId(r.id); setShowModal(true); }} emptyMessage="No audiometry tests recorded." />
      {showModal && <AudiometryModal id={editId} onClose={() => { setShowModal(false); setEditId(null); }} onSaved={() => { setShowModal(false); setEditId(null); reload(); }} />}
    </>
  );
}

function AudiometryModal({ id, onClose, onSaved }: { id: string | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!!id);
  const [form, setForm] = useState({ patientName: '', patientUhid: '', patientAge: '', patientGender: '', testDate: today(), testType: 'pure-tone', indication: '', tympanometryRight: '', tympanometryLeft: '', interpretation: '', recommendation: '', audiologistName: '', notes: '', status: 'draft' });
  const [rightTh, setRightTh] = useState<Record<string, string>>({});
  const [leftTh, setLeftTh] = useState<Record<string, string>>({});
  const s = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!id) return;
    fetch(`/api/v1/diagnostic/audiometry/${id}`).then(r => r.json()).then(d => {
      if (d) {
        const f: any = {};
        Object.keys(form).forEach(k => { f[k] = d[k]?.toString()?.split('T')[0] || d[k]?.toString() || ''; });
        setForm(f);
        if (d.rightThresholds) setRightTh(d.rightThresholds);
        if (d.leftThresholds) setLeftTh(d.leftThresholds);
      }
    }).finally(() => setLoading(false));
  }, [id]);

  const calcPta = (th: Record<string, string>) => {
    const v = [th['500'], th['1000'], th['2000']].map(Number).filter(n => !isNaN(n));
    return v.length === 3 ? Math.round((v.reduce((a, b) => a + b, 0) / 3) * 10) / 10 : null;
  };

  const handleSave = async () => {
    setError(''); setSaving(true);
    try {
      const payload = { ...form, rightThresholds: rightTh, leftThresholds: leftTh };
      if (id) await savePatch(`/diagnostic/audiometry/${id}`, payload);
      else await savePost('/diagnostic/audiometry', payload);
      onSaved();
    } catch (err) { setError(errMsg(err)); } finally { setSaving(false); }
  };

  if (loading) return <Modal title="Loading..." onClose={onClose}><div style={{ padding: 32, textAlign: 'center' }}>Loading...</div></Modal>;

  const rPta = calcPta(rightTh);
  const lPta = calcPta(leftTh);

  return (
    <Modal title={id ? 'Edit Audiometry' : 'New Audiometry Test'} onClose={onClose} width={950}>
      <div style={{ padding: '16px 24px', maxHeight: '75vh', overflowY: 'auto' }}>
        {error && <div style={{ padding: 12, background: '#fef2f2', color: '#dc2626', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Patient Name *"><input value={form.patientName} onChange={e => s('patientName', e.target.value)} style={inp} /></Field>
          <Field label="Age"><input type="number" value={form.patientAge} onChange={e => s('patientAge', e.target.value)} style={inp} /></Field>
          <Field label="Test Date *"><input type="date" value={form.testDate} onChange={e => s('testDate', e.target.value)} style={inp} /></Field>
          <Field label="Test Type"><select value={form.testType} onChange={e => s('testType', e.target.value)} style={sel}>{TEST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></Field>
        </div>

        <div style={{ fontSize: 13, fontWeight: 600, color: TEAL, marginBottom: 8 }}>AIR CONDUCTION THRESHOLDS (dB HL)</div>
        <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(6, 1fr)', gap: 4, marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Hz</div>
          {FREQUENCIES.map(f => <div key={f} style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', fontWeight: 600 }}>{f}</div>)}
          <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>Right</div>
          {FREQUENCIES.map(f => <input key={`r-${f}`} type="number" value={rightTh[f] || ''} onChange={e => setRightTh(p => ({ ...p, [f]: e.target.value }))} style={{ ...inp, textAlign: 'center', padding: '4px', fontSize: 12, borderColor: '#fecaca' }} />)}
          <div style={{ fontSize: 12, color: '#2563eb', fontWeight: 600 }}>Left</div>
          {FREQUENCIES.map(f => <input key={`l-${f}`} type="number" value={leftTh[f] || ''} onChange={e => setLeftTh(p => ({ ...p, [f]: e.target.value }))} style={{ ...inp, textAlign: 'center', padding: '4px', fontSize: 12, borderColor: '#93c5fd' }} />)}
        </div>

        {(rPta != null || lPta != null) && (
          <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, marginBottom: 16, display: 'flex', gap: 24, fontSize: 13 }}>
            {rPta != null && <span><strong style={{ color: '#dc2626' }}>R PTA:</strong> {rPta} dB — <GradeBadge grade={classifyHL(rPta)} /></span>}
            {lPta != null && <span><strong style={{ color: '#2563eb' }}>L PTA:</strong> {lPta} dB — <GradeBadge grade={classifyHL(lPta)} /></span>}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Tympanometry (Right)"><select value={form.tympanometryRight} onChange={e => s('tympanometryRight', e.target.value)} style={sel}><option value="">—</option>{TYMP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></Field>
          <Field label="Tympanometry (Left)"><select value={form.tympanometryLeft} onChange={e => s('tympanometryLeft', e.target.value)} style={sel}><option value="">—</option>{TYMP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></Field>
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

function classifyHL(pta: number): string {
  if (pta <= 25) return 'Normal';
  if (pta <= 40) return 'Mild';
  if (pta <= 55) return 'Moderate';
  if (pta <= 70) return 'Mod. Severe';
  if (pta <= 90) return 'Severe';
  return 'Profound';
}

function GradeBadge({ grade }: { grade: string }) {
  const colors: Record<string, string> = { Normal: '#16a34a', Mild: '#d97706', Moderate: '#ea580c', 'Mod. Severe': '#dc2626', 'Moderately Severe': '#dc2626', Severe: '#991b1b', Profound: '#7f1d1d' };
  return <span style={{ fontSize: 11, fontWeight: 600, color: colors[grade] || '#475569' }}>{grade}</span>;
}

const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' };
const sel: React.CSSProperties = { ...inp, appearance: 'auto' as any };
const priBtn: React.CSSProperties = { padding: '8px 20px', borderRadius: 6, border: 'none', background: TEAL, color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer' };
const secBtn: React.CSSProperties = { padding: '8px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: 500, fontSize: 13, cursor: 'pointer' };
