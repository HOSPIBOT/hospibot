'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useFeatureGate, FeatureLockedBlock } from '@/lib/feature-gate';
import { RegulatoryGuidance } from '@/lib/regulatory-guidance';
import { PageHeader, Modal, Field, DataTable, StatusPill, useList, savePost, savePatch, fmtDate, today, errMsg, TEAL } from '../compliance/_components';

const METHODS = [
  { value: 'pcr-ssp', label: 'PCR-SSP' },
  { value: 'pcr-sso', label: 'PCR-SSO (Luminex)' },
  { value: 'ngs', label: 'Next-Gen Sequencing (NGS)' },
  { value: 'sbt', label: 'Sequence-Based Typing (SBT)' },
];

const HLA_LOCI = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'DR1', 'DR2', 'DQ1', 'DQ2', 'DP1', 'DP2'];

export default function HlaTypingPage() {
  const gate = useFeatureGate('hla-typing');
  if (gate.locked) return <FeatureLockedBlock gate={gate} />;

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader title="HLA Typing — Transplant Compatibility" subtitle="NOTTO Guidelines · NMDP/WMDA Standards · NABL ISO 15189" />
      <HlaList />
      <RegulatoryGuidance title="HLA Typing — Regulatory Requirements" items={[
        { body: 'NOTTO (National Organ & Tissue Transplant Organisation)', detail: 'All organ/tissue transplant activities in India are governed by the Transplantation of Human Organs & Tissues Act (THOTA) 1994/2011. NOTTO maintains the national registry. Donor consent is mandatory. All HLA typing labs must be registered with NOTTO for transplant-related testing.' },
        { body: 'NMDP/WMDA Standards for Stem Cell Registries', detail: 'National Marrow Donor Program (NMDP) and World Marrow Donor Association (WMDA) require: high-resolution HLA typing at A, B, C, DRB1, DQB1 loci for donor registry; confirmatory typing before transplant; minimum 6/6 match at A, B, DR for unrelated donors.' },
        { body: 'NABL ISO 15189 — Histocompatibility & Immunogenetics', detail: 'NABL accredits HLA labs under the Histocompatibility & Immunogenetics discipline. Requirements: validated typing methods, proficiency testing participation (e.g., ASHI PT), documented SOPs for each method, and quality control for reagents and equipment.' },
        { body: 'Match Score Calculation', detail: 'Standard 6-antigen match at HLA-A, B, DR (2 alleles each). 6/6 = perfect match. For unrelated donors, 8/8 or 10/10 high-resolution matching is preferred. HospiBot auto-calculates the 6-antigen match score when both donor and recipient HLA are entered.' },
        { body: 'Crossmatch & Antibody Screening', detail: 'Complement-dependent cytotoxicity (CDC) crossmatch or flow cytometry crossmatch is mandatory before transplant. Panel Reactive Antibody (PRA) screening identifies pre-formed antibodies. Virtual crossmatch using single-antigen bead testing is increasingly used.' },
      ]} />
    </div>
  );
}

function HlaList() {
  const { rows, total, loading, page, setPage, reload } = useList('/diagnostic/hla-typing');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const columns = useMemo(() => [
    { key: 'testDate', label: 'Date', render: (r: any) => fmtDate(r.testDate) },
    { key: 'patientName', label: 'Name' },
    { key: 'sampleType', label: 'Type', render: (r: any) => (
      <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
        background: r.sampleType === 'donor' ? '#dbeafe' : '#fef3c7',
        color: r.sampleType === 'donor' ? '#1e40af' : '#92400e',
      }}>{r.sampleType === 'donor' ? 'Donor' : 'Recipient'}</span>
    )},
    { key: 'method', label: 'Method', render: (r: any) => METHODS.find(m => m.value === r.method)?.label || r.method },
    { key: 'hlaA1', label: 'HLA-A', render: (r: any) => r.hlaA1 ? `${r.hlaA1}, ${r.hlaA2 || '?'}` : '—' },
    { key: 'hlaB1', label: 'HLA-B', render: (r: any) => r.hlaB1 ? `${r.hlaB1}, ${r.hlaB2 || '?'}` : '—' },
    { key: 'hlaDr1', label: 'HLA-DR', render: (r: any) => r.hlaDr1 ? `${r.hlaDr1}, ${r.hlaDr2 || '?'}` : '—' },
    { key: 'matchScore', label: 'Match', render: (r: any) => r.matchScore != null ? (
      <span style={{ fontWeight: 700, color: r.matchScore >= 5 ? '#16a34a' : r.matchScore >= 3 ? '#d97706' : '#dc2626' }}>
        {r.matchScore}/6
      </span>
    ) : '—' },
    { key: 'nottoRegistered', label: 'NOTTO', render: (r: any) => r.nottoRegistered ? <span style={{ color: '#16a34a' }}>✓</span> : <span style={{ color: '#94a3b8' }}>—</span> },
    { key: 'status', label: 'Status', render: (r: any) => <StatusPill status={r.status} map={{ draft: { bg: '#f1f5f9', fg: '#475569', label: 'Draft' }, verified: { bg: '#ecfdf5', fg: '#059669', label: 'Verified' }, reported: { bg: '#dbeafe', fg: '#1e40af', label: 'Reported' } }} /> },
  ], []);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={() => { setEditId(null); setShowModal(true); }} style={priBtn}>+ New HLA Typing</button>
      </div>
      <DataTable columns={columns} rows={rows} loading={loading} total={total} page={page} onPageChange={setPage} onRowClick={(r: any) => { setEditId(r.id); setShowModal(true); }} emptyMessage="No HLA typing records yet." />
      {showModal && <HlaModal id={editId} onClose={() => { setShowModal(false); setEditId(null); }} onSaved={() => { setShowModal(false); setEditId(null); reload(); }} />}
    </>
  );
}

function HlaModal({ id, onClose, onSaved }: { id: string | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!!id);
  const [form, setForm] = useState<any>({
    patientName: '', patientUhid: '', sampleType: 'donor', donorRegistryId: '',
    testDate: today(), method: 'pcr-ssp', indication: '',
    hlaA1: '', hlaA2: '', hlaB1: '', hlaB2: '', hlaC1: '', hlaC2: '',
    hlaDr1: '', hlaDr2: '', hlaDq1: '', hlaDq2: '', hlaDp1: '', hlaDp2: '',
    recipientHlaA1: '', recipientHlaA2: '', recipientHlaB1: '', recipientHlaB2: '',
    recipientHlaDr1: '', recipientHlaDr2: '',
    crossmatchResult: '', antibodyScreen: '', pra: '',
    consentObtained: false, nottoRegistered: false, nottoId: '', wmdaId: '',
    interpretation: '', notes: '', status: 'draft',
  });
  const s = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!id) return;
    fetch(`/api/v1/diagnostic/hla-typing/${id}`).then(r => r.json()).then(d => {
      if (d) {
        const f: any = {};
        Object.keys(form).forEach(k => {
          if (typeof d[k] === 'boolean') f[k] = d[k];
          else f[k] = d[k]?.toString()?.split('T')[0] || d[k]?.toString() || '';
        });
        setForm(f);
      }
    }).finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setError(''); setSaving(true);
    try {
      if (id) await savePatch(`/diagnostic/hla-typing/${id}`, form);
      else await savePost('/diagnostic/hla-typing', form);
      onSaved();
    } catch (err) { setError(errMsg(err)); } finally { setSaving(false); }
  };

  // Auto-calculate match score
  const calcMatch = () => {
    let m = 0;
    if (form.hlaA1 && (form.hlaA1 === form.recipientHlaA1 || form.hlaA1 === form.recipientHlaA2)) m++;
    if (form.hlaA2 && (form.hlaA2 === form.recipientHlaA1 || form.hlaA2 === form.recipientHlaA2)) m++;
    if (form.hlaB1 && (form.hlaB1 === form.recipientHlaB1 || form.hlaB1 === form.recipientHlaB2)) m++;
    if (form.hlaB2 && (form.hlaB2 === form.recipientHlaB1 || form.hlaB2 === form.recipientHlaB2)) m++;
    if (form.hlaDr1 && (form.hlaDr1 === form.recipientHlaDr1 || form.hlaDr1 === form.recipientHlaDr2)) m++;
    if (form.hlaDr2 && (form.hlaDr2 === form.recipientHlaDr1 || form.hlaDr2 === form.recipientHlaDr2)) m++;
    return m;
  };

  const hasRecipient = form.recipientHlaA1 || form.recipientHlaB1 || form.recipientHlaDr1;
  const matchScore = hasRecipient ? calcMatch() : null;

  if (loading) return <Modal title="Loading..." onClose={onClose}><div style={{ padding: 32, textAlign: 'center' }}>Loading...</div></Modal>;

  return (
    <Modal title={id ? 'Edit HLA Typing' : 'New HLA Typing'} onClose={onClose} width={1000}>
      <div style={{ padding: '16px 24px', maxHeight: '75vh', overflowY: 'auto' }}>
        {error && <div style={{ padding: 12, background: '#fef2f2', color: '#dc2626', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Name *"><input value={form.patientName} onChange={e => s('patientName', e.target.value)} style={inp} /></Field>
          <Field label="Sample Type *">
            <select value={form.sampleType} onChange={e => s('sampleType', e.target.value)} style={sel}>
              <option value="donor">Donor</option>
              <option value="recipient">Recipient</option>
            </select>
          </Field>
          <Field label="Method"><select value={form.method} onChange={e => s('method', e.target.value)} style={sel}>{METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select></Field>
          <Field label="Test Date"><input type="date" value={form.testDate} onChange={e => s('testDate', e.target.value)} style={inp} /></Field>
        </div>

        {/* NOTTO Consent — mandatory for donors */}
        {form.sampleType === 'donor' && (
          <div style={{ padding: 12, background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a', marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={form.consentObtained} onChange={e => s('consentObtained', e.target.checked)} />
              <span style={{ fontSize: 13, color: '#78350f', fontWeight: 500 }}>Donor consent obtained (mandatory per NOTTO / THOTA Act)</span>
            </label>
          </div>
        )}

        {/* HLA Alleles — Subject */}
        <div style={{ fontSize: 13, fontWeight: 600, color: TEAL, marginBottom: 8 }}>
          {form.sampleType === 'donor' ? 'DONOR' : 'RECIPIENT'} HLA TYPING
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 16 }}>
          {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(locus => (
            <Field key={locus} label={`HLA-${locus}`}>
              <input value={form[`hla${locus}`] || ''} onChange={e => s(`hla${locus}`, e.target.value)} style={{ ...inp, fontSize: 12, padding: '6px 8px' }} placeholder={`e.g. ${locus.startsWith('A') ? 'A*02:01' : locus.startsWith('B') ? 'B*07:02' : 'C*07:01'}`} />
            </Field>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 16 }}>
          {['Dr1', 'Dr2', 'Dq1', 'Dq2', 'Dp1', 'Dp2'].map(locus => (
            <Field key={locus} label={`HLA-${locus.toUpperCase()}`}>
              <input value={form[`hla${locus}`] || ''} onChange={e => s(`hla${locus}`, e.target.value)} style={{ ...inp, fontSize: 12, padding: '6px 8px' }} />
            </Field>
          ))}
        </div>

        {/* Recipient HLA for comparison */}
        <div style={{ fontSize: 13, fontWeight: 600, color: '#7c3aed', marginBottom: 8 }}>RECIPIENT HLA (for match comparison)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 16 }}>
          {['A1', 'A2', 'B1', 'B2', 'Dr1', 'Dr2'].map(locus => (
            <Field key={`r-${locus}`} label={`Recipient ${locus}`}>
              <input value={form[`recipientHla${locus}`] || ''} onChange={e => s(`recipientHla${locus}`, e.target.value)} style={{ ...inp, fontSize: 12, padding: '6px 8px', borderColor: '#c4b5fd' }} />
            </Field>
          ))}
        </div>

        {/* Match Score */}
        {matchScore != null && (
          <div style={{
            padding: 16, borderRadius: 8, marginBottom: 16, textAlign: 'center',
            background: matchScore >= 5 ? '#f0fdf4' : matchScore >= 3 ? '#fffbeb' : '#fef2f2',
            border: `2px solid ${matchScore >= 5 ? '#bbf7d0' : matchScore >= 3 ? '#fde68a' : '#fecaca'}`,
          }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: matchScore >= 5 ? '#16a34a' : matchScore >= 3 ? '#d97706' : '#dc2626' }}>
              {matchScore}/6
            </div>
            <div style={{ fontSize: 13, color: '#475569' }}>
              {matchScore === 6 ? 'Perfect Match' : matchScore >= 4 ? 'Good Match' : matchScore >= 2 ? 'Partial Match' : 'Poor Match'}
              {' '}(HLA-A, B, DR — 6 antigen)
            </div>
          </div>
        )}

        {/* NOTTO / WMDA Registration */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Crossmatch"><select value={form.crossmatchResult} onChange={e => s('crossmatchResult', e.target.value)} style={sel}><option value="">—</option><option value="negative">Negative (Compatible)</option><option value="positive">Positive (Incompatible)</option></select></Field>
          <Field label="PRA %"><input type="number" value={form.pra} onChange={e => s('pra', e.target.value)} style={inp} placeholder="0-100" /></Field>
          <Field label="NOTTO ID"><input value={form.nottoId} onChange={e => s('nottoId', e.target.value)} style={inp} /></Field>
          <Field label="WMDA ID"><input value={form.wmdaId} onChange={e => s('wmdaId', e.target.value)} style={inp} /></Field>
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
