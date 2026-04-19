'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useFeatureGate, FeatureLockedBlock } from '@/lib/feature-gate';
import { RegulatoryGuidance } from '@/lib/regulatory-guidance';
import {
  PageHeader, Modal, Field, DataTable, StatusPill,
  useList, savePost, savePatch, fmtDate, fmtDateTime, today, errMsg, TEAL,
} from '../compliance/_components';

// ─── Constants ────────────────────────────────
const CASE_TYPES = [
  { value: 'ndps', label: 'NDPS Act — Narcotic Seizure' },
  { value: 'workplace', label: 'Workplace Drug Testing' },
  { value: 'nada-doping', label: 'NADA / WADA Anti-Doping' },
  { value: 'court-ordered', label: 'Court-Ordered Testing' },
  { value: 'insurance', label: 'Insurance Medical Testing' },
  { value: 'clinical', label: 'Clinical Toxicology' },
];

const SPECIMEN_TYPES = [
  'Urine', 'Blood', 'Hair', 'Saliva/Oral Fluid', 'Nail Clippings',
  'Seized Substance', 'Tissue', 'Gastric Contents', 'Vitreous Humor', 'Other',
];

const CONTAINER_TYPES = [
  { value: 'tamper-evident', label: 'Tamper-Evident Container' },
  { value: 'BEREG-kit', label: 'BEREG Kit (WADA-approved)' },
  { value: 'standard-vial', label: 'Standard Specimen Vial' },
  { value: 'sealed-pouch', label: 'Sealed Evidence Pouch' },
  { value: 'nco-envelope', label: 'NCB Sealed Envelope' },
];

const ANALYSIS_METHODS = [
  'GC-MS (Gas Chromatography–Mass Spectrometry)',
  'LC-MS/MS (Liquid Chromatography–Tandem MS)',
  'HPLC (High-Performance Liquid Chromatography)',
  'Immunoassay (Screening)',
  'Colorimetric / Spot Test',
  'TLC (Thin Layer Chromatography)',
  'ICP-MS (Inductively Coupled Plasma MS)',
];

const TRANSPORT_MODES = [
  { value: 'hand-carry', label: 'Hand Carry' },
  { value: 'courier', label: 'Registered Courier' },
  { value: 'police-vehicle', label: 'Police Vehicle' },
  { value: 'cold-chain', label: 'Cold Chain Transport' },
  { value: 'dco-transport', label: 'DCO Transport (NADA)' },
];

const STATUS_COLORS: Record<string, { bg: string; fg: string; label: string }> = {
  'collected': { bg: '#f1f5f9', fg: '#475569', label: 'Collected' },
  'in-transit': { bg: '#fef3c7', fg: '#92400e', label: 'In Transit' },
  'received': { bg: '#dbeafe', fg: '#1e40af', label: 'Received at Lab' },
  'in-analysis': { bg: '#ede9fe', fg: '#6d28d9', label: 'Under Analysis' },
  'reported': { bg: '#ecfdf5', fg: '#059669', label: 'Reported' },
  'disposed': { bg: '#f3f4f6', fg: '#6b7280', label: 'Disposed' },
  'disputed': { bg: '#fef2f2', fg: '#dc2626', label: 'Disputed' },
};

type TabKey = 'list' | 'integrity';

// ─── Main Page ────────────────────────────────
export default function ChainOfCustodyPage() {
  const gate = useFeatureGate('chain-of-custody');
  const [activeTab, setActiveTab] = useState<TabKey>('list');

  if (gate.locked) return <FeatureLockedBlock gate={gate} />;

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader
        title="Chain of Custody"
        subtitle="Forensic specimen tracking per NDPS Act · ISO/IEC 17025 · NADA/WADA Code"
      />

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid #e2e8f0' }}>
        {([
          { key: 'list', label: 'Custody Records' },
          { key: 'integrity', label: 'Integrity Dashboard' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 20px', border: 'none',
              borderBottom: activeTab === tab.key ? `3px solid ${TEAL}` : '3px solid transparent',
              background: 'transparent',
              color: activeTab === tab.key ? TEAL : '#64748b',
              fontWeight: activeTab === tab.key ? 600 : 400,
              cursor: 'pointer', fontSize: 14,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'list' && <CustodyListTab />}
      {activeTab === 'integrity' && <IntegrityTab />}

      <RegulatoryGuidance
        title="Chain of Custody — Regulatory Requirements"
        items={[
          {
            body: 'NDPS Act 1985, Sections 52, 52A & 55',
            detail: 'The Narcotic Drugs & Psychotropic Substances Act mandates documented chain of custody for all seized substances. Section 55 requires deposit in malkhana with sealed packaging. Section 52A governs disposal only via magistrate order. Any break in the chain can lead to acquittal (State of Rajasthan v. Gurmail Singh, 2005).',
          },
          {
            body: 'NCB Standing Order No. 1/88',
            detail: 'Narcotics Control Bureau prescribes procedures for drawing samples, numbering, sealing, packing, and dispatch to FSL. Each transfer must record: person, date, time, seal condition, and signatures. Digital chain of custody forms are now accepted (e-Malkhana).',
          },
          {
            body: 'ISO/IEC 17025:2017 — Forensic Lab Accreditation',
            detail: 'NABL accredits forensic testing labs under ISO/IEC 17025. The standard requires documented sample handling procedures, unique specimen identification, storage condition monitoring, and complete traceability from receipt to disposal. GC-MS and HPLC are mandated as confirmatory methods.',
          },
          {
            body: 'WADA Code 2021 & NADA Anti-Doping Rules',
            detail: 'World Anti-Doping Agency requires: A/B sample split with tamper-evident BEREG kits, Doping Control Officer (DCO) documented collection, secure transport to WADA-accredited laboratory, and B-sample frozen storage. India\'s NADA implements these rules under the National Anti-Doping Act.',
          },
          {
            body: 'CrPC Section 293 / BNSS — Admissibility of FSL Reports',
            detail: 'Forensic Science Laboratory reports are admissible as evidence only when the process of collection and custody is legally sound. Courts have repeatedly held that FSL reports without proven chain of custody are inadmissible.',
          },
          {
            body: 'Indian Evidence Act / BSA 2023 — Digital Evidence',
            detail: 'Digital chain of custody records (barcoding, QR tracking, GPS logs) are legally valid under the Bharatiya Sakshya Adhiniyam 2023. HospiBot provides an immutable digital audit trail for every specimen transfer that meets evidentiary standards.',
          },
        ]}
      />
    </div>
  );
}

// ─── TAB 1: Custody Records List ──────────────
function CustodyListTab() {
  const { rows, total, loading, page, setPage, reload } = useList('/diagnostic/chain-of-custody');
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);

  const columns = useMemo(() => [
    { key: 'caseNumber', label: 'Case #', render: (r: any) => (
      <span style={{ fontWeight: 600, color: TEAL }}>{r.caseNumber}</span>
    )},
    { key: 'caseType', label: 'Type', render: (r: any) => {
      const t = CASE_TYPES.find(c => c.value === r.caseType);
      return <span style={{ fontSize: 12 }}>{t?.label || r.caseType}</span>;
    }},
    { key: 'specimenType', label: 'Specimen' },
    { key: 'subjectName', label: 'Subject', render: (r: any) => r.subjectName || '—' },
    { key: 'collectedBy', label: 'Collected By' },
    { key: 'collectionDate', label: 'Date', render: (r: any) => fmtDate(r.collectionDate) },
    { key: 'handovers', label: 'Transfers', render: (r: any) => (
      <span style={{
        display: 'inline-block', padding: '2px 10px', borderRadius: 12,
        background: '#f1f5f9', fontWeight: 600, fontSize: 12,
      }}>
        {r.handovers?.length || 0}
      </span>
    )},
    { key: 'integrity', label: 'Integrity', render: (r: any) => (
      r.integrityBreach ? (
        <span style={{ color: '#dc2626', fontWeight: 600, fontSize: 12 }}>⚠ BREACH</span>
      ) : (
        <span style={{ color: '#16a34a', fontSize: 12 }}>✓ Intact</span>
      )
    )},
    { key: 'status', label: 'Status', render: (r: any) => {
      const s = STATUS_COLORS[r.status] || STATUS_COLORS['collected'];
      return <StatusPill status={r.status} map={Object.fromEntries(
        Object.entries(STATUS_COLORS).map(([k, v]) => [k, v])
      )} />;
    }},
  ], []);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={() => setShowCreate(true)} style={primaryBtnStyle}>
          + New Custody Record
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        total={total}
        page={page}
        onPageChange={setPage}
        onRowClick={(r: any) => setShowDetail(r.id)}
        emptyMessage="No chain of custody records yet."
      />

      {showCreate && (
        <CreateCustodyModal
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); reload(); }}
        />
      )}

      {showDetail && (
        <CustodyDetailModal
          id={showDetail}
          onClose={() => setShowDetail(null)}
          onUpdate={reload}
        />
      )}
    </>
  );
}

// ─── TAB 2: Integrity Dashboard ──────────────
function IntegrityTab() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/v1/diagnostic/chain-of-custody/reports/integrity');
        setStats(await res.json());
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Records" value={stats?.total || 0} color={TEAL} />
        <StatCard label="Integrity Breaches" value={stats?.breaches || 0} color="#dc2626" />
        <StatCard label="Integrity Rate" value={`${stats?.integrityRate || 100}%`}
          color={stats?.integrityRate >= 95 ? '#16a34a' : stats?.integrityRate >= 80 ? '#d97706' : '#dc2626'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* By Case Type */}
        <div style={{ padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 16 }}>By Case Type</h3>
          {(stats?.byType || []).map((t: any) => (
            <div key={t.type} style={{
              display: 'flex', justifyContent: 'space-between', padding: '8px 0',
              borderBottom: '1px solid #f1f5f9',
            }}>
              <span style={{ fontSize: 13, color: '#475569' }}>
                {CASE_TYPES.find(c => c.value === t.type)?.label || t.type}
              </span>
              <span style={{ fontWeight: 600, color: TEAL }}>{t.count}</span>
            </div>
          ))}
          {(!stats?.byType || stats.byType.length === 0) && (
            <div style={{ color: '#94a3b8', fontSize: 13 }}>No data yet</div>
          )}
        </div>

        {/* By Status */}
        <div style={{ padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 16 }}>By Status</h3>
          {(stats?.byStatus || []).map((s: any) => (
            <div key={s.status} style={{
              display: 'flex', justifyContent: 'space-between', padding: '8px 0',
              borderBottom: '1px solid #f1f5f9',
            }}>
              <span style={{
                fontSize: 13,
                color: STATUS_COLORS[s.status]?.fg || '#475569',
                fontWeight: 500,
              }}>
                {STATUS_COLORS[s.status]?.label || s.status}
              </span>
              <span style={{ fontWeight: 600, color: TEAL }}>{s.count}</span>
            </div>
          ))}
          {(!stats?.byStatus || stats.byStatus.length === 0) && (
            <div style={{ color: '#94a3b8', fontSize: 13 }}>No data yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Create Custody Modal ─────────────────────
function CreateCustodyModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    caseNumber: '', externalCaseRef: '', caseType: 'workplace', priority: 'routine',
    specimenType: '', specimenDesc: '', containerType: '', sealNumberA: '', sealNumberB: '',
    quantity: '', specimenCount: 1,
    collectedBy: '', collectorRole: '', collectorId: '', collectionDate: today(),
    collectionTime: '', collectionLocation: '',
    subjectName: '', subjectId: '', subjectGender: '', subjectDob: '',
    witnessName: '', witnessId: '', witnessSignature: false,
    notes: '',
  });

  const setField = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const isNdps = form.caseType === 'ndps';
  const isDoping = form.caseType === 'nada-doping';

  const handleSave = async () => {
    setError(''); setSaving(true);
    try {
      await savePost('/diagnostic/chain-of-custody', { ...form, specimenCount: Number(form.specimenCount) });
      onSaved();
    } catch (err) { setError(errMsg(err)); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="New Chain of Custody Record" onClose={onClose} width={1000}>
      <div style={{ padding: '16px 24px', maxHeight: '75vh', overflowY: 'auto' }}>
        {error && <div style={{ padding: 12, background: '#fef2f2', color: '#dc2626', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}

        {/* Case Info */}
        <SectionTitle text="Case Information" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Case Number *">
            <input value={form.caseNumber} onChange={e => setField('caseNumber', e.target.value)} style={inputStyle} placeholder="COC-2026-001" />
          </Field>
          <Field label="Case Type *">
            <select value={form.caseType} onChange={e => setField('caseType', e.target.value)} style={selectStyle}>
              {CASE_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="External Ref (FIR/NADA #)">
            <input value={form.externalCaseRef} onChange={e => setField('externalCaseRef', e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Priority">
            <select value={form.priority} onChange={e => setField('priority', e.target.value)} style={selectStyle}>
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="stat">STAT</option>
              <option value="court-deadline">Court Deadline</option>
            </select>
          </Field>
        </div>

        {/* NDPS Warning */}
        {isNdps && (
          <div style={{ padding: 12, background: '#fef3c7', borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#92400e', border: '1px solid #fde68a' }}>
            ⚠ <strong>NDPS Act Case</strong> — Witness details are mandatory per Section 50/55. Any gap in the chain of custody can lead to acquittal.
          </div>
        )}

        {/* WADA Warning */}
        {isDoping && (
          <div style={{ padding: 12, background: '#dbeafe', borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#1e40af', border: '1px solid #93c5fd' }}>
            ℹ <strong>NADA/WADA Doping Control</strong> — A-sample and B-sample seal numbers are mandatory. Use BEREG tamper-evident kits.
          </div>
        )}

        {/* Specimen */}
        <SectionTitle text="Specimen Details" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Specimen Type *">
            <select value={form.specimenType} onChange={e => setField('specimenType', e.target.value)} style={selectStyle}>
              <option value="">Select...</option>
              {SPECIMEN_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Container Type">
            <select value={form.containerType} onChange={e => setField('containerType', e.target.value)} style={selectStyle}>
              <option value="">Select...</option>
              {CONTAINER_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Field>
          <Field label={isDoping ? 'A-Sample Seal # *' : 'Seal Number'}>
            <input value={form.sealNumberA} onChange={e => setField('sealNumberA', e.target.value)} style={inputStyle} />
          </Field>
          {isDoping && (
            <Field label="B-Sample Seal # *">
              <input value={form.sealNumberB} onChange={e => setField('sealNumberB', e.target.value)} style={inputStyle} />
            </Field>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 12, marginBottom: 16 }}>
          <Field label="Quantity / Volume">
            <input value={form.quantity} onChange={e => setField('quantity', e.target.value)} style={inputStyle} placeholder="e.g. 90 mL" />
          </Field>
          <Field label="Container Count">
            <input type="number" min={1} value={form.specimenCount} onChange={e => setField('specimenCount', e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Description">
            <input value={form.specimenDesc} onChange={e => setField('specimenDesc', e.target.value)} style={inputStyle} placeholder="Free text description of specimen" />
          </Field>
        </div>

        {/* Collection */}
        <SectionTitle text="Collection Details" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Collected By *">
            <input value={form.collectedBy} onChange={e => setField('collectedBy', e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Collector Role">
            <select value={form.collectorRole} onChange={e => setField('collectorRole', e.target.value)} style={selectStyle}>
              <option value="">Select...</option>
              <option value="IO">Investigating Officer</option>
              <option value="DCO">Doping Control Officer</option>
              <option value="phlebotomist">Phlebotomist</option>
              <option value="lab-tech">Lab Technician</option>
              <option value="police">Police Officer</option>
            </select>
          </Field>
          <Field label="Collection Date *">
            <input type="date" value={form.collectionDate} onChange={e => setField('collectionDate', e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Time">
            <input type="time" value={form.collectionTime} onChange={e => setField('collectionTime', e.target.value)} style={inputStyle} />
          </Field>
        </div>
        <Field label="Collection Location" style={{ marginBottom: 16 }}>
          <input value={form.collectionLocation} onChange={e => setField('collectionLocation', e.target.value)} style={inputStyle} placeholder="Address / venue name" />
        </Field>

        {/* Subject */}
        <SectionTitle text="Subject / Source" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Subject Name">
            <input value={form.subjectName} onChange={e => setField('subjectName', e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Subject ID">
            <input value={form.subjectId} onChange={e => setField('subjectId', e.target.value)} style={inputStyle} placeholder="ID / Athlete ID" />
          </Field>
          <Field label="Gender">
            <select value={form.subjectGender} onChange={e => setField('subjectGender', e.target.value)} style={selectStyle}>
              <option value="">—</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="DOB">
            <input type="date" value={form.subjectDob} onChange={e => setField('subjectDob', e.target.value)} style={inputStyle} />
          </Field>
        </div>

        {/* Witness (mandatory for NDPS) */}
        <SectionTitle text={isNdps ? 'Witness (MANDATORY per NDPS S.50/55)' : 'Witness'} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label={isNdps ? 'Witness Name *' : 'Witness Name'}>
            <input value={form.witnessName} onChange={e => setField('witnessName', e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Witness ID">
            <input value={form.witnessId} onChange={e => setField('witnessId', e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Witness Confirmed">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
              <input type="checkbox" checked={form.witnessSignature} onChange={e => setField('witnessSignature', e.target.checked)} />
              <span style={{ fontSize: 13 }}>Digital confirmation received</span>
            </label>
          </Field>
        </div>

        <Field label="Notes" style={{ marginBottom: 16 }}>
          <textarea value={form.notes} onChange={e => setField('notes', e.target.value)} style={{ ...inputStyle, height: 60 }} />
        </Field>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
          <button onClick={onClose} style={secondaryBtnStyle}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={primaryBtnStyle}>
            {saving ? 'Saving...' : 'Create Custody Record'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Custody Detail Modal (Timeline + Handover) ──
function CustodyDetailModal({ id, onClose, onUpdate }: { id: string; onClose: () => void; onUpdate: () => void }) {
  const [chain, setChain] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddHandover, setShowAddHandover] = useState(false);

  const loadChain = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/diagnostic/chain-of-custody/${id}`);
      setChain(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { loadChain(); }, [loadChain]);

  if (loading) return <Modal title="Loading..." onClose={onClose}><div style={{ padding: 32, textAlign: 'center' }}>Loading...</div></Modal>;
  if (!chain) return <Modal title="Not Found" onClose={onClose}><div style={{ padding: 32 }}>Record not found.</div></Modal>;

  const statusInfo = STATUS_COLORS[chain.status] || STATUS_COLORS['collected'];

  return (
    <Modal title={`Custody Chain — ${chain.caseNumber}`} onClose={onClose} width={900}>
      <div style={{ padding: '16px 24px', maxHeight: '75vh', overflowY: 'auto' }}>
        {/* Header Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              {CASE_TYPES.find(c => c.value === chain.caseType)?.label} · {chain.specimenType}
            </span>
            {chain.externalCaseRef && (
              <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 12 }}>
                Ext. Ref: {chain.externalCaseRef}
              </span>
            )}
          </div>
          <span style={{
            padding: '4px 16px', borderRadius: 16, fontSize: 12, fontWeight: 600,
            background: statusInfo.bg, color: statusInfo.fg,
          }}>
            {statusInfo.label}
          </span>
        </div>

        {/* Integrity Warning */}
        {chain.integrityBreach && (
          <div style={{
            padding: 12, background: '#fef2f2', borderRadius: 8, marginBottom: 16,
            border: '1px solid #fecaca', fontSize: 13, color: '#991b1b',
          }}>
            ⚠ <strong>INTEGRITY BREACH DETECTED</strong> — {chain.breachNotes || 'Seal was found broken or tampered during a transfer.'}
            <br /><span style={{ fontSize: 12 }}>Per NDPS Act & ISO 17025, this specimen's evidentiary value may be compromised.</span>
          </div>
        )}

        {/* Seal Info */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 20,
          padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0',
        }}>
          <InfoItem label="Seal A" value={chain.sealNumberA || '—'} />
          <InfoItem label="Seal B" value={chain.sealNumberB || '—'} />
          <InfoItem label="Container" value={CONTAINER_TYPES.find(c => c.value === chain.containerType)?.label || chain.containerType || '—'} />
          <InfoItem label="Quantity" value={chain.quantity || '—'} />
        </div>

        {/* Chain Timeline */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', margin: 0 }}>
              Custody Timeline
            </h3>
            <button onClick={() => setShowAddHandover(true)} style={secondaryBtnStyle}>
              + Add Transfer
            </button>
          </div>

          {/* Collection event */}
          <TimelineStep
            step={0}
            title="Specimen Collected"
            date={fmtDateTime(chain.collectionDate)}
            from={chain.collectedBy}
            fromRole={chain.collectorRole}
            location={chain.collectionLocation}
            sealIntact={true}
            isFirst={true}
          />

          {/* Handover steps */}
          {(chain.handovers || []).map((h: any, idx: number) => (
            <TimelineStep
              key={h.id}
              step={h.stepNumber}
              title={`Transfer #${h.stepNumber}`}
              date={fmtDateTime(h.handoverDate)}
              from={h.fromName}
              fromRole={h.fromRole}
              to={h.toName}
              toRole={h.toRole}
              location={h.location}
              transportMode={h.transportMode}
              sealIntact={h.sealIntact}
              conditionNotes={h.conditionNotes}
              tempRecorded={h.tempRecorded}
              isFirst={false}
            />
          ))}

          {/* Lab receipt event */}
          {chain.receivedAt && (
            <TimelineStep
              step={-1}
              title="Received at Laboratory"
              date={fmtDateTime(chain.receivedAt)}
              from={chain.receivedBy || 'Lab Staff'}
              sealIntact={chain.sealIntactOnReceipt !== false}
              location={chain.storageLocation ? `Storage: ${chain.storageLocation}` : undefined}
              isFirst={false}
            />
          )}

          {(chain.handovers || []).length === 0 && !chain.receivedAt && (
            <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13, borderLeft: '2px dashed #cbd5e1', marginLeft: 16 }}>
              No transfers recorded yet. Add a transfer when the specimen changes hands.
            </div>
          )}
        </div>

        {/* Analysis Info (if exists) */}
        {chain.analysisMethod && (
          <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16 }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Analysis Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 13 }}>
              <InfoItem label="Method" value={chain.analysisMethod} />
              <InfoItem label="Analyst" value={chain.analysisByName || '—'} />
              <InfoItem label="Result" value={chain.resultSummary || '—'} />
            </div>
          </div>
        )}
      </div>

      {showAddHandover && (
        <AddHandoverModal
          chainId={id}
          onClose={() => setShowAddHandover(false)}
          onSaved={() => { setShowAddHandover(false); loadChain(); onUpdate(); }}
        />
      )}
    </Modal>
  );
}

// ─── Add Handover Modal ───────────────────────
function AddHandoverModal({ chainId, onClose, onSaved }: { chainId: string; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    fromName: '', fromRole: '', fromId: '',
    toName: '', toRole: '', toId: '',
    handoverDate: today(), handoverTime: '',
    location: '', sealIntact: true, conditionNotes: '',
    transportMode: '', tempRecorded: '',
    fromConfirmed: false, toConfirmed: false,
  });

  const setField = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setError(''); setSaving(true);
    try {
      await savePost(`/diagnostic/chain-of-custody/${chainId}/handover`, form);
      onSaved();
    } catch (err) { setError(errMsg(err)); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="Record Specimen Transfer" onClose={onClose} width={700}>
      <div style={{ padding: '16px 24px' }}>
        {error && <div style={{ padding: 12, background: '#fef2f2', color: '#dc2626', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <SectionTitle text="Releasing Party" />
            <Field label="Name *"><input value={form.fromName} onChange={e => setField('fromName', e.target.value)} style={inputStyle} /></Field>
            <Field label="Role" style={{ marginTop: 8 }}>
              <input value={form.fromRole} onChange={e => setField('fromRole', e.target.value)} style={inputStyle} placeholder="IO / courier / lab-tech" />
            </Field>
          </div>
          <div>
            <SectionTitle text="Receiving Party" />
            <Field label="Name *"><input value={form.toName} onChange={e => setField('toName', e.target.value)} style={inputStyle} /></Field>
            <Field label="Role" style={{ marginTop: 8 }}>
              <input value={form.toRole} onChange={e => setField('toRole', e.target.value)} style={inputStyle} />
            </Field>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Date *">
            <input type="date" value={form.handoverDate} onChange={e => setField('handoverDate', e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Time">
            <input type="time" value={form.handoverTime} onChange={e => setField('handoverTime', e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Transport Mode">
            <select value={form.transportMode} onChange={e => setField('transportMode', e.target.value)} style={selectStyle}>
              <option value="">Select...</option>
              {TRANSPORT_MODES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Location" style={{ marginBottom: 12 }}>
          <input value={form.location} onChange={e => setField('location', e.target.value)} style={inputStyle} />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Seal Condition">
            <select value={form.sealIntact ? 'true' : 'false'} onChange={e => setField('sealIntact', e.target.value === 'true')} style={selectStyle}>
              <option value="true">✓ Seal Intact</option>
              <option value="false">⚠ Seal Broken / Tampered</option>
            </select>
          </Field>
          <Field label="Temperature (°C)">
            <input value={form.tempRecorded} onChange={e => setField('tempRecorded', e.target.value)} style={inputStyle} placeholder="e.g. 4°C" />
          </Field>
        </div>

        {!form.sealIntact && (
          <div style={{ padding: 12, background: '#fef2f2', borderRadius: 8, marginBottom: 12, border: '1px solid #fecaca' }}>
            <strong style={{ color: '#dc2626', fontSize: 13 }}>⚠ SEAL BREACH</strong>
            <p style={{ fontSize: 12, color: '#7f1d1d', margin: '4px 0 0' }}>
              This will flag the entire custody chain as having an integrity breach.
              Per NDPS Act and ISO 17025, this may affect the evidentiary value of the specimen.
            </p>
          </div>
        )}

        <Field label="Condition Notes" style={{ marginBottom: 16 }}>
          <textarea value={form.conditionNotes} onChange={e => setField('conditionNotes', e.target.value)} style={{ ...inputStyle, height: 50 }} placeholder="Any damage, temperature excursion, delays..." />
        </Field>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
          <button onClick={onClose} style={secondaryBtnStyle}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={primaryBtnStyle}>
            {saving ? 'Saving...' : 'Record Transfer'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Sub-Components ───────────────────────────
function SectionTitle({ text }: { text: string }) {
  return <div style={{ fontSize: 13, fontWeight: 600, color: TEAL, marginBottom: 8, marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{text}</div>;
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 13, color: '#1e293b', fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ padding: 16, borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function TimelineStep({ step, title, date, from, fromRole, to, toRole, location, transportMode, sealIntact, conditionNotes, tempRecorded, isFirst }: {
  step: number; title: string; date: string;
  from?: string; fromRole?: string; to?: string; toRole?: string;
  location?: string; transportMode?: string;
  sealIntact: boolean; conditionNotes?: string; tempRecorded?: string;
  isFirst: boolean;
}) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
      {/* Timeline line */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32 }}>
        <div style={{
          width: 12, height: 12, borderRadius: '50%',
          background: sealIntact ? TEAL : '#dc2626',
          border: `2px solid ${sealIntact ? TEAL : '#dc2626'}`,
          flexShrink: 0,
        }} />
        <div style={{ width: 2, flex: 1, background: '#e2e8f0' }} />
      </div>
      {/* Content */}
      <div style={{
        flex: 1, paddingBottom: 16,
        borderLeft: 'none',
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{title}</div>
        <div style={{ fontSize: 12, color: '#64748b' }}>{date}</div>
        {from && (
          <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
            {to ? `${from}${fromRole ? ` (${fromRole})` : ''} → ${to}${toRole ? ` (${toRole})` : ''}` : `By: ${from}${fromRole ? ` (${fromRole})` : ''}`}
          </div>
        )}
        {location && <div style={{ fontSize: 12, color: '#94a3b8' }}>📍 {location}</div>}
        {transportMode && <div style={{ fontSize: 12, color: '#94a3b8' }}>🚗 {TRANSPORT_MODES.find(t => t.value === transportMode)?.label || transportMode}</div>}
        {tempRecorded && <div style={{ fontSize: 12, color: '#94a3b8' }}>🌡 {tempRecorded}</div>}
        {!sealIntact && (
          <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 600, marginTop: 4 }}>
            ⚠ SEAL BREACH{conditionNotes ? `: ${conditionNotes}` : ''}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 6,
  border: '1px solid #cbd5e1', fontSize: 13, outline: 'none',
};
const selectStyle: React.CSSProperties = { ...inputStyle, appearance: 'auto' as any };
const primaryBtnStyle: React.CSSProperties = {
  padding: '8px 20px', borderRadius: 6, border: 'none',
  background: TEAL, color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer',
};
const secondaryBtnStyle: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 6, border: '1px solid #cbd5e1',
  background: 'white', color: '#475569', fontWeight: 500, fontSize: 13, cursor: 'pointer',
};
