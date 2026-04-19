'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useFeatureGate, FeatureLockedBlock } from '@/lib/feature-gate';
import { RegulatoryGuidance } from '@/lib/regulatory-guidance';
import { PageHeader, Modal, Field, DataTable, StatusPill, useList, savePost, savePatch, fmtDate, today, errMsg, TEAL } from '../compliance/_components';

const STAIN_TYPES = ['H&E', 'PAS', 'Masson Trichrome', 'Reticulin', 'Congo Red', 'Giemsa', 'Gram', 'Ziehl-Neelsen', 'Iron (Perl)', 'Mucicarmine', 'Special Stain — Other', 'IHC'];
const MAGNIFICATIONS = ['10x', '20x', '40x', '60x', '100x'];

export default function SlideScanningPage() {
  const gate = useFeatureGate('slide-scanning');
  if (gate.locked) return <FeatureLockedBlock gate={gate} />;
  const { rows, total, loading, page, setPage, reload } = useList('/diagnostic/slide-scanning');
  const [showModal, setShowModal] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const columns = useMemo(() => [
    { key: 'scanDate', label: 'Date', render: (r: any) => fmtDate(r.scanDate) },
    { key: 'caseNumber', label: 'Case #', render: (r: any) => <span style={{ fontWeight: 600, color: TEAL }}>{r.caseNumber}</span> },
    { key: 'slideId', label: 'Slide ID' },
    { key: 'patientName', label: 'Patient', render: (r: any) => r.patientName || '—' },
    { key: 'stainType', label: 'Stain' },
    { key: 'magnification', label: 'Mag.' },
    { key: 'focusQuality', label: 'Quality', render: (r: any) => r.focusQuality || '—' },
    { key: 'teleconsultRequested', label: 'Teleconsult', render: (r: any) => r.teleconsultRequested ? <span style={{ color: '#7c3aed', fontWeight: 600 }}>Requested</span> : '—' },
    { key: 'diagnosis', label: 'Diagnosis', render: (r: any) => r.diagnosis ? <span style={{ fontSize: 12 }}>{r.diagnosis.substring(0, 30)}...</span> : '—' },
    { key: 'status', label: 'Status', render: (r: any) => <StatusPill status={r.status} map={{ scanned: { bg: '#dbeafe', fg: '#1e40af', label: 'Scanned' }, reviewing: { bg: '#fef3c7', fg: '#92400e', label: 'Reviewing' }, reported: { bg: '#ecfdf5', fg: '#059669', label: 'Reported' } }} /> },
  ], []);
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader title="Slide Scanning — Digital Pathology" subtitle="Whole Slide Imaging · Teleconsultation · AI-Assisted Analysis" />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}><button onClick={() => { setEditId(null); setShowModal(true); }} style={priBtn}>+ New Slide Scan</button></div>
      <DataTable columns={columns} rows={rows} loading={loading} total={total} page={page} onPageChange={setPage} onRowClick={(r: any) => { setEditId(r.id); setShowModal(true); }} emptyMessage="No slide scans yet." />
      {showModal && <SlideModal id={editId} onClose={() => { setShowModal(false); setEditId(null); }} onSaved={() => { setShowModal(false); setEditId(null); reload(); }} />}
      <RegulatoryGuidance title="Digital Pathology — Regulatory Requirements" items={[
        { body: 'CAP Digital Pathology Guidelines (2022)', detail: 'College of American Pathologists: WSI validation required before primary diagnosis. Minimum 60-case validation study per pathologist per organ system. Display calibration and ambient lighting standards apply. Images must be archived with metadata.' },
        { body: 'NABL ISO 15189 — Histopathology Lab', detail: 'Tissue blocks must be retained for minimum 10 years. Slides retained for 5 years (cytology) to 10 years (histopathology). Digital slides do not replace glass slide retention requirements. Scanner calibration must be documented.' },
        { body: 'Telemedicine Guidelines 2020 — Telepathology', detail: 'Remote pathology consultation via WSI is permitted under India Telemedicine Guidelines 2020. Consulting pathologist must have valid MCI/NMC registration. Digital signature on teleconsultation reports is legally binding.' },
      ]} />
    </div>
  );
}

function SlideModal({ id, onClose, onSaved }: { id: string | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [loading, setLoading] = useState(!!id);
  const [form, setForm] = useState({ caseNumber: '', slideId: '', patientName: '', specimenType: '', specimenSite: '', stainType: 'H&E', scanDate: today(), scannerId: '', magnification: '40x', focusQuality: '', pathologistName: '', teleconsultRequested: false, teleconsultTo: '', teleconsultResponse: '', diagnosis: '', icdCode: '', notes: '', status: 'scanned' });
  const s = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  useEffect(() => { if (!id) return; fetch(`/api/v1/diagnostic/slide-scanning/${id}`).then(r => r.json()).then(d => { if (d) { const f: any = {}; Object.keys(form).forEach(k => { if (typeof d[k] === 'boolean') f[k] = d[k]; else f[k] = d[k]?.toString()?.split('T')[0] || d[k]?.toString() || ''; }); setForm(f); } }).finally(() => setLoading(false)); }, [id]);
  const handleSave = async () => { setError(''); setSaving(true); try { if (id) await savePatch(`/diagnostic/slide-scanning/${id}`, form); else await savePost('/diagnostic/slide-scanning', form); onSaved(); } catch (err) { setError(errMsg(err)); } finally { setSaving(false); } };
  if (loading) return <Modal title="Loading..." onClose={onClose}><div style={{ padding: 32, textAlign: 'center' }}>Loading...</div></Modal>;
  return (
    <Modal title={id ? 'Edit Slide Scan' : 'New Slide Scan'} onClose={onClose} width={900}>
      <div style={{ padding: '16px 24px', maxHeight: '75vh', overflowY: 'auto' }}>
        {error && <div style={{ padding: 12, background: '#fef2f2', color: '#dc2626', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Case # *"><input value={form.caseNumber} onChange={e => s('caseNumber', e.target.value)} style={inp} /></Field>
          <Field label="Slide ID *"><input value={form.slideId} onChange={e => s('slideId', e.target.value)} style={inp} /></Field>
          <Field label="Patient"><input value={form.patientName} onChange={e => s('patientName', e.target.value)} style={inp} /></Field>
          <Field label="Scan Date"><input type="date" value={form.scanDate} onChange={e => s('scanDate', e.target.value)} style={inp} /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Specimen Type"><input value={form.specimenType} onChange={e => s('specimenType', e.target.value)} style={inp} placeholder="Biopsy / Resection" /></Field>
          <Field label="Specimen Site"><input value={form.specimenSite} onChange={e => s('specimenSite', e.target.value)} style={inp} /></Field>
          <Field label="Stain"><select value={form.stainType} onChange={e => s('stainType', e.target.value)} style={sel}>{STAIN_TYPES.map(s => <option key={s} value={s}>{s}</option>)}</select></Field>
          <Field label="Magnification"><select value={form.magnification} onChange={e => s('magnification', e.target.value)} style={sel}>{MAGNIFICATIONS.map(m => <option key={m} value={m}>{m}</option>)}</select></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Scanner ID"><input value={form.scannerId} onChange={e => s('scannerId', e.target.value)} style={inp} /></Field>
          <Field label="Focus Quality"><select value={form.focusQuality} onChange={e => s('focusQuality', e.target.value)} style={sel}><option value="">—</option><option value="excellent">Excellent</option><option value="good">Good</option><option value="acceptable">Acceptable</option><option value="poor">Poor — Rescan needed</option></select></Field>
          <Field label="Pathologist"><input value={form.pathologistName} onChange={e => s('pathologistName', e.target.value)} style={inp} /></Field>
        </div>
        <div style={{ padding: 12, background: '#f5f3ff', borderRadius: 8, border: '1px solid #c4b5fd', marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, color: '#6d28d9' }}><input type="checkbox" checked={form.teleconsultRequested as any} onChange={e => s('teleconsultRequested', e.target.checked)} /> Request teleconsultation</label>
          {form.teleconsultRequested && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
              <Field label="Consult To"><input value={form.teleconsultTo} onChange={e => s('teleconsultTo', e.target.value)} style={inp} placeholder="Expert pathologist name/institution" /></Field>
              <Field label="Response"><input value={form.teleconsultResponse} onChange={e => s('teleconsultResponse', e.target.value)} style={inp} /></Field>
            </div>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Diagnosis"><input value={form.diagnosis} onChange={e => s('diagnosis', e.target.value)} style={inp} /></Field>
          <Field label="ICD Code"><input value={form.icdCode} onChange={e => s('icdCode', e.target.value)} style={inp} placeholder="e.g. C50.9" /></Field>
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
