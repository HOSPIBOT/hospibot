'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useFeatureGate, FeatureLockedBlock } from '@/lib/feature-gate';
import { RegulatoryGuidance } from '@/lib/regulatory-guidance';
import { PageHeader, Modal, Field, DataTable, StatusPill, useList, savePost, savePatch, fmtDate, today, errMsg, TEAL } from '../compliance/_components';

// WHO 6th Edition lower reference limits
const WHO_REF = { volume: 1.4, concentration: 16, totalMotility: 42, progressiveMotility: 30, normalMorphology: 4, vitality: 54 };

export default function CasaPage() {
  const gate = useFeatureGate('casa');
  if (gate.locked) return <FeatureLockedBlock gate={gate} />;
  const { rows, total, loading, page, setPage, reload } = useList('/diagnostic/casa');
  const [showModal, setShowModal] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const columns = useMemo(() => [
    { key: 'testDate', label: 'Date', render: (r: any) => fmtDate(r.testDate) },
    { key: 'patientName', label: 'Patient' },
    { key: 'volume', label: 'Vol (mL)', render: (r: any) => r.volume != null ? <RefVal val={r.volume} ref_={WHO_REF.volume} unit="mL" /> : '—' },
    { key: 'concentration', label: 'Conc (M/mL)', render: (r: any) => r.concentration != null ? <RefVal val={r.concentration} ref_={WHO_REF.concentration} /> : '—' },
    { key: 'totalMotility', label: 'Motility %', render: (r: any) => r.totalMotility != null ? <RefVal val={r.totalMotility} ref_={WHO_REF.totalMotility} unit="%" /> : '—' },
    { key: 'normalMorphology', label: 'Morph %', render: (r: any) => r.normalMorphology != null ? <RefVal val={r.normalMorphology} ref_={WHO_REF.normalMorphology} unit="%" /> : '—' },
    { key: 'whoAssessment', label: 'WHO', render: (r: any) => r.whoAssessment === 'Normal' ? <span style={{ color: '#16a34a', fontWeight: 600 }}>Normal</span> : r.whoAssessment === 'Abnormal' ? <span style={{ color: '#dc2626', fontWeight: 600 }}>Abnormal</span> : '—' },
    { key: 'status', label: 'Status', render: (r: any) => <StatusPill status={r.status} map={{ draft: { bg: '#f1f5f9', fg: '#475569', label: 'Draft' }, verified: { bg: '#ecfdf5', fg: '#059669', label: 'Verified' }, reported: { bg: '#dbeafe', fg: '#1e40af', label: 'Reported' } }} /> },
  ], []);
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader title="CASA — Computer-Assisted Semen Analysis" subtitle="WHO 6th Edition · Motility & Morphology · Velocity Parameters" />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}><button onClick={() => { setEditId(null); setShowModal(true); }} style={priBtn}>+ New Semen Analysis</button></div>
      <DataTable columns={columns} rows={rows} loading={loading} total={total} page={page} onPageChange={setPage} onRowClick={(r: any) => { setEditId(r.id); setShowModal(true); }} emptyMessage="No CASA analyses yet." />
      {showModal && <CasaModal id={editId} onClose={() => { setShowModal(false); setEditId(null); }} onSaved={() => { setShowModal(false); setEditId(null); reload(); }} />}
      <RegulatoryGuidance title="CASA — Regulatory Requirements" items={[
        { body: 'WHO Laboratory Manual 6th Edition (2021)', detail: 'Lower reference limits (5th centile): Volume ≥1.4 mL, Concentration ≥16 M/mL, Total motility ≥42%, Progressive motility ≥30%, Normal morphology ≥4%, Vitality ≥54%. Abstinence 2-7 days. Analysis within 1 hour of collection.' },
        { body: 'NABL ISO 15189 — Andrology Lab', detail: 'Daily QC with proficiency testing samples. CASA instrument must be calibrated per manufacturer protocol. Manual morphology assessment with Diff-Quik or Papanicolaou stain must be available as backup.' },
        { body: 'ART Act 2021 — Semen Banking', detail: 'Donor semen must be quarantined for 6 months with repeat infectious disease testing (HIV, HBV, HCV) before release. Donors must be 21-55 years. Maximum 1 donor per 10 births. All results linked to donor registry.' },
      ]} />
    </div>
  );
}

function RefVal({ val, ref_, unit }: { val: number; ref_: number; unit?: string }) {
  const low = val < ref_;
  return <span style={{ fontWeight: 600, color: low ? '#dc2626' : '#16a34a' }}>{val}{unit ? ` ${unit}` : ''}{low ? ' ↓' : ''}</span>;
}

function CasaModal({ id, onClose, onSaved }: { id: string | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [loading, setLoading] = useState(!!id);
  const [form, setForm] = useState({ patientName: '', partnerName: '', testDate: today(), abstinenceDays: '', collectionMethod: 'masturbation', collectionTime: '', analysisTime: '', liquefactionTime: '', volume: '', ph: '', appearance: '', viscosity: '', concentration: '', totalCount: '', totalMotility: '', progressiveMotility: '', nonProgressiveMotility: '', immotile: '', normalMorphology: '', headDefects: '', midpieceDefects: '', tailDefects: '', vitality: '', vcl: '', vsl: '', vap: '', roundCells: '', wbc: '', andrologist: '', notes: '', status: 'draft' });
  const s = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  useEffect(() => { if (!id) return; fetch(`/api/v1/diagnostic/casa/${id}`).then(r => r.json()).then(d => { if (d) { const f: any = {}; Object.keys(form).forEach(k => { f[k] = d[k]?.toString()?.split('T')[0] || d[k]?.toString() || ''; }); setForm(f); } }).finally(() => setLoading(false)); }, [id]);
  const handleSave = async () => { setError(''); setSaving(true); try { if (id) await savePatch(`/diagnostic/casa/${id}`, form); else await savePost('/diagnostic/casa', form); onSaved(); } catch (err) { setError(errMsg(err)); } finally { setSaving(false); } };
  if (loading) return <Modal title="Loading..." onClose={onClose}><div style={{ padding: 32, textAlign: 'center' }}>Loading...</div></Modal>;
  return (
    <Modal title={id ? 'Edit Semen Analysis' : 'New CASA Analysis'} onClose={onClose} width={950}>
      <div style={{ padding: '16px 24px', maxHeight: '75vh', overflowY: 'auto' }}>
        {error && <div style={{ padding: 12, background: '#fef2f2', color: '#dc2626', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Patient *"><input value={form.patientName} onChange={e => s('patientName', e.target.value)} style={inp} /></Field>
          <Field label="Partner"><input value={form.partnerName} onChange={e => s('partnerName', e.target.value)} style={inp} /></Field>
          <Field label="Date"><input type="date" value={form.testDate} onChange={e => s('testDate', e.target.value)} style={inp} /></Field>
          <Field label="Abstinence (days)"><input type="number" value={form.abstinenceDays} onChange={e => s('abstinenceDays', e.target.value)} style={inp} /></Field>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: TEAL, marginBottom: 8 }}>MACROSCOPIC</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label={`Volume (≥${WHO_REF.volume} mL)`}><input type="number" step="0.1" value={form.volume} onChange={e => s('volume', e.target.value)} style={inp} /></Field>
          <Field label="pH"><input type="number" step="0.1" value={form.ph} onChange={e => s('ph', e.target.value)} style={inp} /></Field>
          <Field label="Appearance"><select value={form.appearance} onChange={e => s('appearance', e.target.value)} style={sel}><option value="">—</option><option value="Normal (grey-opalescent)">Normal</option><option value="Clear">Clear</option><option value="Yellow">Yellow</option><option value="Brown-red">Brown-red</option></select></Field>
          <Field label="Liquefaction (min)"><input type="number" value={form.liquefactionTime} onChange={e => s('liquefactionTime', e.target.value)} style={inp} /></Field>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: TEAL, marginBottom: 8 }}>CONCENTRATION & MOTILITY</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label={`Conc (≥${WHO_REF.concentration} M/mL)`}><input type="number" step="0.1" value={form.concentration} onChange={e => s('concentration', e.target.value)} style={inp} /></Field>
          <Field label={`Total Motility (≥${WHO_REF.totalMotility}%)`}><input type="number" step="0.1" value={form.totalMotility} onChange={e => s('totalMotility', e.target.value)} style={inp} /></Field>
          <Field label={`Progressive (≥${WHO_REF.progressiveMotility}%)`}><input type="number" step="0.1" value={form.progressiveMotility} onChange={e => s('progressiveMotility', e.target.value)} style={inp} /></Field>
          <Field label="Immotile %"><input type="number" step="0.1" value={form.immotile} onChange={e => s('immotile', e.target.value)} style={inp} /></Field>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: TEAL, marginBottom: 8 }}>MORPHOLOGY (Strict Criteria)</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label={`Normal (≥${WHO_REF.normalMorphology}%)`}><input type="number" step="0.1" value={form.normalMorphology} onChange={e => s('normalMorphology', e.target.value)} style={inp} /></Field>
          <Field label="Head Defects %"><input type="number" step="0.1" value={form.headDefects} onChange={e => s('headDefects', e.target.value)} style={inp} /></Field>
          <Field label="Midpiece %"><input type="number" step="0.1" value={form.midpieceDefects} onChange={e => s('midpieceDefects', e.target.value)} style={inp} /></Field>
          <Field label="Tail %"><input type="number" step="0.1" value={form.tailDefects} onChange={e => s('tailDefects', e.target.value)} style={inp} /></Field>
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
