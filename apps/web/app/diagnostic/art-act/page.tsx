'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useFeatureGate, FeatureLockedBlock } from '@/lib/feature-gate';
import { RegulatoryGuidance } from '@/lib/regulatory-guidance';
import { PageHeader, Modal, Field, DataTable, StatusPill, useList, savePost, savePatch, fmtDate, today, errMsg, TEAL } from '../compliance/_components';

const RECORD_TYPES = [
  { value: 'registration', label: 'Clinic Registration (NARTSR)' },
  { value: 'staff-qualification', label: 'Staff Qualification Record' },
  { value: 'consent-form', label: 'Consent Form Log' },
  { value: 'inspection', label: 'Inspection Record' },
  { value: 'report', label: 'National Registry Report' },
  { value: 'grievance', label: 'Grievance (Form 5)' },
  { value: 'renewal', label: 'Registration Renewal' },
];

const FORM_TYPES = [
  'Form 3 — Registration Certificate', 'Form 4 — Appeal Application',
  'Form 5 — Grievance', 'Form D — IVF/ICSI Consent', 'Form 11 — Posthumous Collection',
  'Form 15 — Embryo Freezing Consent', 'Form 16 — Gamete Freezing Consent',
];

const STAFF_ROLES = ['Gynecologist', 'Andrologist', 'Clinical Embryologist', 'Counsellor', 'Nurse', 'Lab Technician'];

export default function ArtActPage() {
  const gate = useFeatureGate('art-act');
  if (gate.locked) return <FeatureLockedBlock gate={gate} />;

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader title="ART Act 2021 Compliance" subtitle="National Registry · Staff Qualifications · Consent Forms · Inspections" />
      <ArtActList />
      <RegulatoryGuidance title="ART Act — Regulatory Requirements" items={[
        { body: 'ART (Regulation) Act 2021, Sections 15-18', detail: 'All ART clinics and banks must register with NARTSR (artsurrogacy.gov.in). Registration valid for 5 years. State Board inspection required before granting registration. Certificate must be displayed prominently.' },
        { body: 'ART Rules 2022 — Forms 3, 4, 5', detail: 'Form 3: Registration certificate. Form 4: Appeal against rejection. Form 5: Grievance format for commissioning couples, surrogates, donors. Clinics must maintain a Grievance Cell.' },
        { body: 'Section 21-24 — Clinic Duties', detail: 'Written informed consent (Form D) mandatory. Records must be maintained for 25 years. Annual reporting to National Registry on procedures undertaken and outcomes. Sex-selective ART is prohibited (Section 32).' },
        { body: 'Staff Qualifications (ART Rules 2022)', detail: 'Gynecologist: PG in OB-GYN + 3 years experience + 50 OPU record. Embryologist: PG in Clinical Embryology (4 semesters) + 3 years lab experience OR PhD in ART + 1 year experience. Andrologist: MCh/DNB Urology with male infertility training.' },
        { body: 'Section 33 — Penalties', detail: 'Operating without registration: up to 10 lakh fine. Sex-selective ART: 5-10 years imprisonment + 10-25 lakh fine. Sale of gametes/embryos: 5-10 years imprisonment + 10-25 lakh fine.' },
      ]} />
    </div>
  );
}

function ArtActList() {
  const { rows, total, loading, page, setPage, reload } = useList('/diagnostic/art-act');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<any>(null);

  useEffect(() => {
    fetch('/api/v1/diagnostic/art-act/reports/dashboard').then(r => r.json()).then(setDashboard).catch(() => {});
  }, []);

  const columns = useMemo(() => [
    { key: 'recordType', label: 'Type', render: (r: any) => RECORD_TYPES.find(t => t.value === r.recordType)?.label || r.recordType },
    { key: 'title', label: 'Title' },
    { key: 'referenceNumber', label: 'Ref #', render: (r: any) => r.referenceNumber || '—' },
    { key: 'formType', label: 'Form', render: (r: any) => r.formType || '—' },
    { key: 'validUntil', label: 'Valid Until', render: (r: any) => r.validUntil ? fmtDate(r.validUntil) : '—' },
    { key: 'status', label: 'Status', render: (r: any) => <StatusPill status={r.status} map={{
      pending: { bg: '#fef3c7', fg: '#92400e', label: 'Pending' },
      submitted: { bg: '#dbeafe', fg: '#1e40af', label: 'Submitted' },
      approved: { bg: '#ecfdf5', fg: '#059669', label: 'Approved' },
      active: { bg: '#ecfdf5', fg: '#059669', label: 'Active' },
      rejected: { bg: '#fef2f2', fg: '#dc2626', label: 'Rejected' },
      expired: { bg: '#f3f4f6', fg: '#6b7280', label: 'Expired' },
    }} /> },
  ], []);

  return (
    <>
      {dashboard && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
          <StatCard label="Total Records" value={dashboard.total} />
          <StatCard label="Expiring Soon (90d)" value={dashboard.expiringSoon} color="#d97706" />
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={() => { setEditId(null); setShowModal(true); }} style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: TEAL, color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>+ New Record</button>
      </div>
      <DataTable columns={columns} rows={rows} loading={loading} total={total} page={page} onPageChange={setPage} onRowClick={(r: any) => { setEditId(r.id); setShowModal(true); }} emptyMessage="No ART Act compliance records yet." />
      {showModal && <ArtActModal id={editId} onClose={() => { setShowModal(false); setEditId(null); }} onSaved={() => { setShowModal(false); setEditId(null); reload(); }} />}
    </>
  );
}

function ArtActModal({ id, onClose, onSaved }: { id: string | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!!id);
  const [form, setForm] = useState({ recordType: 'registration', title: '', referenceNumber: '', description: '', formType: '', staffName: '', staffQualification: '', staffRole: '', registrationNumber: '', validFrom: '', validUntil: '', renewalDueDate: '', submittedTo: '', submittedDate: '', approvedDate: '', inspectionDate: '', inspectionResult: '', complianceNotes: '', status: 'pending', notes: '' });
  const s = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => { if (!id) return; fetch(`/api/v1/diagnostic/art-act/${id}`).then(r => r.json()).then(d => { if (d) { const f: any = {}; Object.keys(form).forEach(k => { f[k] = d[k]?.toString()?.split('T')[0] || d[k] || ''; }); setForm(f); } }).finally(() => setLoading(false)); }, [id]);

  const handleSave = async () => { setError(''); setSaving(true); try { if (id) await savePatch(`/diagnostic/art-act/${id}`, form); else await savePost('/diagnostic/art-act', form); onSaved(); } catch (err) { setError(errMsg(err)); } finally { setSaving(false); } };

  if (loading) return <Modal title="Loading..." onClose={onClose}><div style={{ padding: 32, textAlign: 'center' }}>Loading...</div></Modal>;

  return (
    <Modal title={id ? 'Edit ART Act Record' : 'New ART Act Record'} onClose={onClose} width={900}>
      <div style={{ padding: '16px 24px', maxHeight: '75vh', overflowY: 'auto' }}>
        {error && <div style={{ padding: 12, background: '#fef2f2', color: '#dc2626', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Record Type *"><select value={form.recordType} onChange={e => s('recordType', e.target.value)} style={sel}>{RECORD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></Field>
          <Field label="Title *"><input value={form.title} onChange={e => s('title', e.target.value)} style={inp} /></Field>
          <Field label="Reference #"><input value={form.referenceNumber} onChange={e => s('referenceNumber', e.target.value)} style={inp} /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Form Type"><select value={form.formType} onChange={e => s('formType', e.target.value)} style={sel}><option value="">Select...</option>{FORM_TYPES.map(f => <option key={f} value={f}>{f}</option>)}</select></Field>
          <Field label="Status"><select value={form.status} onChange={e => s('status', e.target.value)} style={sel}><option value="pending">Pending</option><option value="submitted">Submitted</option><option value="approved">Approved</option><option value="active">Active</option><option value="rejected">Rejected</option><option value="expired">Expired</option></select></Field>
        </div>
        {form.recordType === 'staff-qualification' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            <Field label="Staff Name"><input value={form.staffName} onChange={e => s('staffName', e.target.value)} style={inp} /></Field>
            <Field label="Role"><select value={form.staffRole} onChange={e => s('staffRole', e.target.value)} style={sel}><option value="">Select...</option>{STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}</select></Field>
            <Field label="Qualification"><input value={form.staffQualification} onChange={e => s('staffQualification', e.target.value)} style={inp} /></Field>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Valid From"><input type="date" value={form.validFrom} onChange={e => s('validFrom', e.target.value)} style={inp} /></Field>
          <Field label="Valid Until"><input type="date" value={form.validUntil} onChange={e => s('validUntil', e.target.value)} style={inp} /></Field>
          <Field label="Renewal Due"><input type="date" value={form.renewalDueDate} onChange={e => s('renewalDueDate', e.target.value)} style={inp} /></Field>
        </div>
        <Field label="Notes" style={{ marginBottom: 16 }}><textarea value={form.notes} onChange={e => s('notes', e.target.value)} style={{ ...inp, height: 60 }} /></Field>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
          <button onClick={onClose} style={secBtn}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={priBtn}>{saving ? 'Saving...' : id ? 'Update' : 'Create'}</button>
        </div>
      </div>
    </Modal>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (<div style={{ padding: 16, borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}><div style={{ fontSize: 12, color: '#64748b' }}>{label}</div><div style={{ fontSize: 28, fontWeight: 700, color: color || TEAL, marginTop: 4 }}>{value}</div></div>);
}

const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' };
const sel: React.CSSProperties = { ...inp, appearance: 'auto' as any };
const priBtn: React.CSSProperties = { padding: '8px 20px', borderRadius: 6, border: 'none', background: TEAL, color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer' };
const secBtn: React.CSSProperties = { padding: '8px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: 500, fontSize: 13, cursor: 'pointer' };
