'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useFeatureGate, FeatureLockedBlock } from '@/lib/feature-gate';
import { RegulatoryGuidance } from '@/lib/regulatory-guidance';
import { PageHeader, Modal, Field, DataTable, StatusPill, useList, savePost, savePatch, fmtDate, today, errMsg, TEAL } from '../compliance/_components';

const SPECIMEN_TYPES = ['Embryo', 'Oocyte', 'Sperm', 'Ovarian Tissue'];
const FREEZE_METHODS = ['Vitrification', 'Slow Freeze'];
const STATUSES = { stored: { bg: '#ecfdf5', fg: '#059669', label: 'Stored' }, thawed: { bg: '#dbeafe', fg: '#1e40af', label: 'Thawed' }, discarded: { bg: '#f3f4f6', fg: '#6b7280', label: 'Discarded' }, transferred: { bg: '#fef3c7', fg: '#92400e', label: 'Transferred' }, expired: { bg: '#fef2f2', fg: '#dc2626', label: 'Expired' } };

export default function CryopreservationPage() {
  const gate = useFeatureGate('cryopreservation');
  if (gate.locked) return <FeatureLockedBlock gate={gate} />;
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader title="Cryopreservation — Embryo/Oocyte/Sperm Bank" subtitle="ART Act 2021 Forms 15/16 · ICMR Cryobank Guidelines · ISAR Standards" />
      <CryoList />
      <RegulatoryGuidance title="Cryopreservation — Regulatory Requirements" items={[
        { body: 'ART Act 2021, Forms 15 & 16', detail: 'Form 15: Consent for embryo freezing. Form 16: Consent for gamete freezing. Both require specification of disposal wishes on death/divorce/incapacity. Storage consent must be renewed annually.' },
        { body: 'ICMR ART Guidelines — Cryobank Standards', detail: 'Cryocans must have local alarms and auto-dial to alert staff after hours. LN2 levels must be checked and logged twice daily. Backup storage facility required. All straws must be uniquely labeled with patient ID, date, and specimen type.' },
        { body: 'ISAR Consensus — Vitrification Protocol', detail: 'Vitrification is the preferred method for embryo and oocyte cryopreservation. Each straw must be double-witnessed at loading. Thaw survival rates must be tracked and reported. Equipment must be maintained with documented calibration.' },
      ]} />
    </div>
  );
}

function CryoList() {
  const { rows, total, loading, page, setPage, reload } = useList('/diagnostic/cryopreservation');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const columns = useMemo(() => [
    { key: 'strawId', label: 'Straw ID', render: (r: any) => <span style={{ fontWeight: 600, color: TEAL }}>{r.strawId}</span> },
    { key: 'patientName', label: 'Patient' },
    { key: 'specimenType', label: 'Type' },
    { key: 'freezeDate', label: 'Frozen', render: (r: any) => fmtDate(r.freezeDate) },
    { key: 'freezeMethod', label: 'Method' },
    { key: 'tankId', label: 'Tank', render: (r: any) => r.tankId ? `${r.tankId}/${r.canisterId || '?'}/${r.caneId || '?'}` : '—' },
    { key: 'strawCount', label: 'Straws' },
    { key: 'storageFeeStatus', label: 'Fee', render: (r: any) => r.storageFeeStatus === 'paid' ? <span style={{ color: '#16a34a' }}>Paid</span> : <span style={{ color: '#dc2626' }}>Due</span> },
    { key: 'status', label: 'Status', render: (r: any) => <StatusPill status={r.status} map={STATUSES} /> },
  ], []);
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}><button onClick={() => { setEditId(null); setShowModal(true); }} style={priBtn}>+ New Cryo Record</button></div>
      <DataTable columns={columns} rows={rows} loading={loading} total={total} page={page} onPageChange={setPage} onRowClick={(r: any) => { setEditId(r.id); setShowModal(true); }} emptyMessage="No cryopreservation records yet." />
      {showModal && <CryoModal id={editId} onClose={() => { setShowModal(false); setEditId(null); }} onSaved={() => { setShowModal(false); setEditId(null); reload(); }} />}
    </>
  );
}

function CryoModal({ id, onClose, onSaved }: { id: string | null; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [loading, setLoading] = useState(!!id);
  const [form, setForm] = useState({ patientName: '', partnerName: '', specimenType: 'Embryo', strawId: '', strawCount: '1', freezeMethod: 'Vitrification', freezeDate: today(), embryoStage: '', embryoGrade: '', embryoDay: '', tankId: '', canisterId: '', caneId: '', gobletId: '', consentCryoStorage: false, consentDisposal: '', renewalDueDate: '', storageFeeStatus: 'paid', notes: '', status: 'stored' });
  const s = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  useEffect(() => { if (!id) return; fetch(`/api/v1/diagnostic/cryopreservation/${id}`).then(r => r.json()).then(d => { if (d) { const f: any = {}; Object.keys(form).forEach(k => { if (typeof d[k] === 'boolean') f[k] = d[k]; else f[k] = d[k]?.toString()?.split('T')[0] || d[k]?.toString() || ''; }); setForm(f); } }).finally(() => setLoading(false)); }, [id]);
  const handleSave = async () => { setError(''); setSaving(true); try { if (id) await savePatch(`/diagnostic/cryopreservation/${id}`, form); else await savePost('/diagnostic/cryopreservation', form); onSaved(); } catch (err) { setError(errMsg(err)); } finally { setSaving(false); } };
  if (loading) return <Modal title="Loading..." onClose={onClose}><div style={{ padding: 32, textAlign: 'center' }}>Loading...</div></Modal>;
  return (
    <Modal title={id ? 'Edit Cryo Record' : 'New Cryopreservation'} onClose={onClose} width={900}>
      <div style={{ padding: '16px 24px', maxHeight: '75vh', overflowY: 'auto' }}>
        {error && <div style={{ padding: 12, background: '#fef2f2', color: '#dc2626', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Patient *"><input value={form.patientName} onChange={e => s('patientName', e.target.value)} style={inp} /></Field>
          <Field label="Partner"><input value={form.partnerName} onChange={e => s('partnerName', e.target.value)} style={inp} /></Field>
          <Field label="Specimen Type"><select value={form.specimenType} onChange={e => s('specimenType', e.target.value)} style={sel}>{SPECIMEN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Freeze Date"><input type="date" value={form.freezeDate} onChange={e => s('freezeDate', e.target.value)} style={inp} /></Field>
          <Field label="Method"><select value={form.freezeMethod} onChange={e => s('freezeMethod', e.target.value)} style={sel}>{FREEZE_METHODS.map(m => <option key={m} value={m}>{m}</option>)}</select></Field>
          <Field label="Straw Count"><input type="number" min={1} value={form.strawCount} onChange={e => s('strawCount', e.target.value)} style={inp} /></Field>
          <Field label="Straw ID"><input value={form.strawId} onChange={e => s('strawId', e.target.value)} style={inp} placeholder="Auto if blank" /></Field>
        </div>
        {form.specimenType === 'Embryo' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            <Field label="Embryo Day"><input type="number" value={form.embryoDay} onChange={e => s('embryoDay', e.target.value)} style={inp} /></Field>
            <Field label="Stage"><input value={form.embryoStage} onChange={e => s('embryoStage', e.target.value)} style={inp} placeholder="e.g. Blastocyst" /></Field>
            <Field label="Grade"><input value={form.embryoGrade} onChange={e => s('embryoGrade', e.target.value)} style={inp} placeholder="e.g. 4AA" /></Field>
          </div>
        )}
        <div style={{ fontSize: 13, fontWeight: 600, color: TEAL, marginBottom: 8 }}>STORAGE LOCATION</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Tank"><input value={form.tankId} onChange={e => s('tankId', e.target.value)} style={inp} /></Field>
          <Field label="Canister"><input value={form.canisterId} onChange={e => s('canisterId', e.target.value)} style={inp} /></Field>
          <Field label="Cane"><input value={form.caneId} onChange={e => s('caneId', e.target.value)} style={inp} /></Field>
          <Field label="Goblet"><input value={form.gobletId} onChange={e => s('gobletId', e.target.value)} style={inp} /></Field>
        </div>
        <div style={{ padding: 12, background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a', marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={form.consentCryoStorage as any} onChange={e => s('consentCryoStorage', e.target.checked)} />
            <span style={{ fontSize: 13, color: '#78350f', fontWeight: 500 }}>ART Act Form 15/16 consent for cryostorage obtained (mandatory)</span>
          </label>
          <Field label="Disposal Wish" style={{ marginTop: 8 }}><select value={form.consentDisposal} onChange={e => s('consentDisposal', e.target.value)} style={sel}><option value="">Select...</option><option value="destroy">Destroy after period</option><option value="donate-research">Donate for research</option><option value="extend">Extend storage</option><option value="donate-couple">Donate to another couple</option></select></Field>
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
