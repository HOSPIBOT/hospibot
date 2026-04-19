'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useFeatureGate, FeatureLockedBlock } from '@/lib/feature-gate';
import { RegulatoryGuidance } from '@/lib/regulatory-guidance';
import {
  PageHeader, Modal, Field, DataTable, StatusPill,
  useList, savePost, savePatch, fmtDate, fmtDateTime, today, errMsg, TEAL,
} from '../compliance/_components';

// ─── Constants ────────────────────────────────
const CYCLE_TYPES = [
  { value: 'fresh-ivf', label: 'Fresh IVF' },
  { value: 'fresh-icsi', label: 'Fresh ICSI' },
  { value: 'frozen-et', label: 'Frozen Embryo Transfer (FET)' },
  { value: 'donor-egg', label: 'Donor Egg Cycle' },
  { value: 'donor-sperm', label: 'Donor Sperm Cycle' },
  { value: 'donor-embryo', label: 'Donor Embryo' },
  { value: 'surrogacy', label: 'Surrogacy (Gestational Carrier)' },
];

const STIM_PROTOCOLS = [
  { value: 'long-agonist', label: 'Long Agonist (GnRH-a)' },
  { value: 'short-antagonist', label: 'Short Antagonist (GnRH-ant)' },
  { value: 'mini-ivf', label: 'Mini/Minimal Stimulation IVF' },
  { value: 'natural', label: 'Natural Cycle' },
  { value: 'modified-natural', label: 'Modified Natural Cycle' },
];

const INDICATIONS = [
  'Tubal Factor', 'Male Factor', 'Anovulation', 'Endometriosis',
  'Unexplained', 'Age-Related', 'PCOS', 'Diminished Ovarian Reserve',
  'Recurrent Implantation Failure', 'Genetic Indication (PGT)', 'Other',
];

const STATUS_MAP: Record<string, { bg: string; fg: string; label: string }> = {
  'initiated': { bg: '#f1f5f9', fg: '#475569', label: 'Initiated' },
  'stimulating': { bg: '#fef3c7', fg: '#92400e', label: 'Stimulating' },
  'triggered': { bg: '#fce7f3', fg: '#9d174d', label: 'Triggered' },
  'opu-done': { bg: '#dbeafe', fg: '#1e40af', label: 'OPU Done' },
  'fertilized': { bg: '#ede9fe', fg: '#6d28d9', label: 'Fertilized' },
  'culturing': { bg: '#fef3c7', fg: '#92400e', label: 'Culturing' },
  'transferred': { bg: '#d1fae5', fg: '#065f46', label: 'Transferred' },
  'frozen-all': { bg: '#e0e7ff', fg: '#3730a3', label: 'Freeze-All' },
  'outcome-pending': { bg: '#fff7ed', fg: '#9a3412', label: 'Awaiting Outcome' },
  'completed': { bg: '#ecfdf5', fg: '#059669', label: 'Completed' },
  'cancelled': { bg: '#fef2f2', fg: '#dc2626', label: 'Cancelled' },
};

const STAGES = ['initiated', 'stimulating', 'triggered', 'opu-done', 'fertilized', 'culturing', 'transferred', 'outcome-pending', 'completed'];
const STAGE_LABELS: Record<string, string> = {
  'initiated': 'Initiate', 'stimulating': 'Stimulation', 'triggered': 'Trigger',
  'opu-done': 'OPU', 'fertilized': 'Fertilization', 'culturing': 'Culture',
  'transferred': 'Transfer', 'outcome-pending': 'Outcome', 'completed': 'Complete',
};

type TabKey = 'list' | 'outcomes';

// ─── Main Page ────────────────────────────────
export default function IvfCyclesPage() {
  const gate = useFeatureGate('cycles');
  const [activeTab, setActiveTab] = useState<TabKey>('list');

  if (gate.locked) return <FeatureLockedBlock gate={gate} />;

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader
        title="IVF Cycle Management"
        subtitle="ART (Regulation) Act 2021 · ICMR ART Guidelines · ISAR Consensus"
      />

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid #e2e8f0' }}>
        {([
          { key: 'list', label: 'Cycles' },
          { key: 'outcomes', label: 'Outcome Analytics' },
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

      {activeTab === 'list' && <CycleListTab />}
      {activeTab === 'outcomes' && <OutcomesTab />}

      <RegulatoryGuidance
        title="IVF Cycles — Regulatory Requirements"
        items={[
          {
            body: 'ART (Regulation) Act 2021, Sections 14-27',
            detail: 'All ART clinics must be registered with the National Registry. ICMR Form D consent is mandatory before starting any IVF cycle. Clinics must report all ART procedures to authorities. Non-commercialization of gametes and embryos is enforced. The Act mandates counselling services for all commissioning parties.',
          },
          {
            body: 'ICMR National Guidelines for ART Clinics (2005/2021)',
            detail: 'ICMR categorizes IVF clinics into Level 1 (IUI only) and Level 2 (IVF/ICSI). Guidelines cover staff qualifications, lab standards, daily logbook requirements, gamete/embryo handling protocols, and double-witnessing at every critical step (OPU, insemination, transfer).',
          },
          {
            body: 'ISAR Consensus Guidelines — Lab Safety & Ethics',
            detail: 'Indian Society for Assisted Reproduction mandates: double witnessing for patient ID at semen collection, OPU, and embryo transfer; embryo culture grade media with QC documentation; batch tracking for all consumables; and daily embryology lab logbook maintenance.',
          },
          {
            body: 'ART Rules 2022 — Form D Consent & Reporting',
            detail: 'Couples must sign Form D consent covering: chances of success, risks of OHSS, multiple pregnancy, what happens to cryopreserved embryos on death/divorce/incapacity. Consent must be bilingual. Clinics must maintain records for 25 years per ART Act Section 26.',
          },
          {
            body: 'Embryo Transfer Limits — ICMR/ISAR',
            detail: 'To reduce multiple pregnancies: max 2 embryos for women under 35, max 3 for women 35-39 and 40+. Single embryo transfer (SET) is encouraged when possible. HospiBot enforces these limits as hard blocks during transfer recording.',
          },
          {
            body: 'Surrogacy (Regulation) Act 2021',
            detail: 'Only altruistic surrogacy is permitted in India. Commercial surrogacy is banned. The surrogate must be a married woman (25-35 years) with at least one child. HospiBot flags surrogacy cycles for additional consent and legal documentation requirements.',
          },
        ]}
      />
    </div>
  );
}

// ─── TAB 1: Cycle List ────────────────────────
function CycleListTab() {
  const { rows, total, loading, page, setPage, reload } = useList('/diagnostic/ivf-cycles');
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);

  const columns = useMemo(() => [
    { key: 'cycleNumber', label: 'Cycle #', render: (r: any) => (
      <span style={{ fontWeight: 600, color: TEAL }}>{r.cycleNumber}</span>
    )},
    { key: 'patientName', label: 'Patient' },
    { key: 'cycleType', label: 'Type', render: (r: any) => {
      const t = CYCLE_TYPES.find(c => c.value === r.cycleType);
      return <span style={{ fontSize: 12 }}>{t?.label || r.cycleType}</span>;
    }},
    { key: 'oocytesTotal', label: 'Oocytes', render: (r: any) =>
      r.oocytesTotal != null ? `${r.oocytesMature || 0}M / ${r.oocytesTotal}` : '—'
    },
    { key: 'fertRate', label: 'Fert %', render: (r: any) =>
      r.fertRate != null ? `${r.fertRate}%` : '—'
    },
    { key: 'embryosTransferred', label: 'ET', render: (r: any) =>
      r.embryosTransferred != null ? `${r.embryosTransferred} (D${r.transferDay || '?'})` : '—'
    },
    { key: 'outcome', label: 'Outcome', render: (r: any) => {
      if (!r.outcome) return <span style={{ color: '#94a3b8' }}>—</span>;
      const colors: Record<string, string> = {
        'live-birth': '#16a34a', 'ongoing': '#2563eb', 'not-pregnant': '#94a3b8',
        'miscarriage': '#dc2626', 'ectopic': '#dc2626', 'biochemical': '#d97706',
      };
      return <span style={{ color: colors[r.outcome] || '#475569', fontWeight: 500, fontSize: 12 }}>{r.outcome}</span>;
    }},
    { key: 'status', label: 'Status', render: (r: any) => (
      <StatusPill status={r.status} map={STATUS_MAP} />
    )},
  ], []);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={() => setShowCreate(true)} style={primaryBtnStyle}>+ New IVF Cycle</button>
      </div>

      <DataTable
        columns={columns} rows={rows} loading={loading} total={total}
        page={page} onPageChange={setPage}
        onRowClick={(r: any) => setShowDetail(r.id)}
        emptyMessage="No IVF cycles recorded yet."
      />

      {showCreate && <CreateCycleModal onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); reload(); }} />}
      {showDetail && <CycleDetailModal id={showDetail} onClose={() => setShowDetail(null)} onUpdate={reload} />}
    </>
  );
}

// ─── TAB 2: Outcome Analytics ─────────────────
function OutcomesTab() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/v1/diagnostic/ivf-cycles/reports/outcomes');
        setStats(await res.json());
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>Loading...</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
      <StatCard label="Completed Cycles" value={stats?.totalCompleted || 0} color={TEAL} />
      <StatCard label="Cancelled" value={stats?.totalCancelled || 0} color="#dc2626" />
      <StatCard label="Transfers" value={stats?.transferred || 0} color="#2563eb" />
      <StatCard label="βhCG+ Rate" value={`${stats?.bhcgPositiveRate || 0}%`} color="#d97706" />
      <StatCard label="Clinical Pregnancy Rate" value={`${stats?.clinicalPregnancyRate || 0}%`} color="#7c3aed" />
      <StatCard label="Live Birth Rate" value={`${stats?.liveBirthRate || 0}%`} color="#16a34a" />
      <StatCard label="Avg Oocytes/Cycle" value={stats?.avgOocytes || 0} color={TEAL} />
      <StatCard label="Avg Fert Rate" value={`${stats?.avgFertRate || 0}%`} color="#0284c7" />
    </div>
  );
}

// ─── Create Cycle Modal ───────────────────────
function CreateCycleModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    cycleNumber: '', patientName: '', patientAge: '', partnerName: '', partnerAge: '',
    cycleType: 'fresh-icsi', stimProtocol: 'short-antagonist', indication: '',
    consentFormD: false, consentDate: today(), consentCryoDisposal: '',
    notes: '',
  });
  const setField = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setError(''); setSaving(true);
    try {
      await savePost('/diagnostic/ivf-cycles', form);
      onSaved();
    } catch (err) { setError(errMsg(err)); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="New IVF Cycle" onClose={onClose} width={800}>
      <div style={{ padding: '16px 24px', maxHeight: '75vh', overflowY: 'auto' }}>
        {error && <div style={{ padding: 12, background: '#fef2f2', color: '#dc2626', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Patient Name *"><input value={form.patientName} onChange={e => setField('patientName', e.target.value)} style={inputStyle} /></Field>
          <Field label="Age"><input type="number" value={form.patientAge} onChange={e => setField('patientAge', e.target.value)} style={inputStyle} /></Field>
          <Field label="Cycle # (auto if blank)"><input value={form.cycleNumber} onChange={e => setField('cycleNumber', e.target.value)} style={inputStyle} placeholder="IVF-2026-001" /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Partner Name"><input value={form.partnerName} onChange={e => setField('partnerName', e.target.value)} style={inputStyle} /></Field>
          <Field label="Partner Age"><input type="number" value={form.partnerAge} onChange={e => setField('partnerAge', e.target.value)} style={inputStyle} /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="Cycle Type *">
            <select value={form.cycleType} onChange={e => setField('cycleType', e.target.value)} style={selectStyle}>
              {CYCLE_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="Stimulation Protocol">
            <select value={form.stimProtocol} onChange={e => setField('stimProtocol', e.target.value)} style={selectStyle}>
              <option value="">Select...</option>
              {STIM_PROTOCOLS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Indication">
            <select value={form.indication} onChange={e => setField('indication', e.target.value)} style={selectStyle}>
              <option value="">Select...</option>
              {INDICATIONS.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </Field>
        </div>

        {/* ART Act Consent — MANDATORY */}
        <div style={{
          padding: 16, background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a', marginBottom: 16,
        }}>
          <div style={{ fontWeight: 600, color: '#92400e', marginBottom: 8, fontSize: 14 }}>
            ⚠ ART Act 2021 — Form D Consent (Mandatory)
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={form.consentFormD} onChange={e => setField('consentFormD', e.target.checked)} />
            <span style={{ fontSize: 13, color: '#78350f' }}>
              Patient & partner have signed ICMR Form D consent covering: procedure risks, OHSS, multiple pregnancy, cryopreservation disposal wishes, and counselling completed.
            </span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <Field label="Consent Date">
              <input type="date" value={form.consentDate} onChange={e => setField('consentDate', e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Cryo Disposal Wish">
              <select value={form.consentCryoDisposal} onChange={e => setField('consentCryoDisposal', e.target.value)} style={selectStyle}>
                <option value="">Select...</option>
                <option value="destroy">Destroy after storage period</option>
                <option value="donate">Donate for research</option>
                <option value="extend-storage">Extend storage</option>
              </select>
            </Field>
          </div>
        </div>

        <Field label="Notes" style={{ marginBottom: 16 }}>
          <textarea value={form.notes} onChange={e => setField('notes', e.target.value)} style={{ ...inputStyle, height: 50 }} />
        </Field>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
          <button onClick={onClose} style={secondaryBtnStyle}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={primaryBtnStyle}>
            {saving ? 'Saving...' : 'Create Cycle'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Cycle Detail Modal (Stepper View) ────────
function CycleDetailModal({ id, onClose, onUpdate }: { id: string; onClose: () => void; onUpdate: () => void }) {
  const [cycle, setCycle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadCycle = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/diagnostic/ivf-cycles/${id}`);
      setCycle(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { loadCycle(); }, [loadCycle]);

  const saveField = async (fields: any) => {
    setError(''); setSaving(true);
    try {
      await savePatch(`/diagnostic/ivf-cycles/${id}`, fields);
      await loadCycle();
      onUpdate();
    } catch (err) { setError(errMsg(err)); }
    finally { setSaving(false); }
  };

  const advanceStatus = async (newStatus: string) => {
    try {
      await savePatch(`/diagnostic/ivf-cycles/${id}/status`, { status: newStatus });
      await loadCycle();
      onUpdate();
    } catch (err) { setError(errMsg(err)); }
  };

  if (loading) return <Modal title="Loading..." onClose={onClose}><div style={{ padding: 32, textAlign: 'center' }}>Loading...</div></Modal>;
  if (!cycle) return <Modal title="Not Found" onClose={onClose}><div style={{ padding: 32 }}>Cycle not found.</div></Modal>;

  const currentIdx = STAGES.indexOf(cycle.status);
  const statusInfo = STATUS_MAP[cycle.status] || STATUS_MAP['initiated'];

  return (
    <Modal title={`Cycle ${cycle.cycleNumber} — ${cycle.patientName}`} onClose={onClose} width={1000}>
      <div style={{ padding: '16px 24px', maxHeight: '78vh', overflowY: 'auto' }}>
        {error && <div style={{ padding: 8, background: '#fef2f2', color: '#dc2626', borderRadius: 6, marginBottom: 12, fontSize: 12 }}>{error}</div>}

        {/* Stage Progress Bar */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 24 }}>
          {STAGES.map((stage, idx) => {
            const isActive = idx === currentIdx;
            const isDone = idx < currentIdx;
            const isCancelled = cycle.status === 'cancelled';
            return (
              <div key={stage} style={{
                flex: 1, textAlign: 'center', padding: '6px 4px', borderRadius: 4,
                background: isCancelled ? '#fef2f2' : isActive ? TEAL : isDone ? '#d1fae5' : '#f1f5f9',
                color: isCancelled ? '#dc2626' : isActive ? 'white' : isDone ? '#065f46' : '#94a3b8',
                fontSize: 10, fontWeight: isActive ? 700 : 500,
                transition: 'all 0.2s',
              }}>
                {STAGE_LABELS[stage] || stage}
              </div>
            );
          })}
        </div>

        {/* Quick Info */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20,
          padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0',
        }}>
          <InfoItem label="Type" value={CYCLE_TYPES.find(c => c.value === cycle.cycleType)?.label || cycle.cycleType} />
          <InfoItem label="Age" value={cycle.patientAge ? `${cycle.patientAge}y` : '—'} />
          <InfoItem label="Protocol" value={STIM_PROTOCOLS.find(s => s.value === cycle.stimProtocol)?.label || cycle.stimProtocol || '—'} />
          <InfoItem label="Indication" value={cycle.indication || '—'} />
          <InfoItem label="Status" value={statusInfo.label} />
        </div>

        {/* Stage-specific editable sections */}
        {/* OPU Section */}
        <CollapsibleSection title="Oocyte Retrieval (OPU)" defaultOpen={cycle.status === 'opu-done' || cycle.status === 'fertilized'}>
          <EditableRow label="OPU Date" value={cycle.opuDate?.split('T')[0] || ''} type="date" onSave={v => saveField({ opuDate: v })} />
          <EditableRow label="Total Oocytes" value={cycle.oocytesTotal?.toString() || ''} type="number" onSave={v => saveField({ oocytesTotal: v })} />
          <EditableRow label="Mature (MII)" value={cycle.oocytesMature?.toString() || ''} type="number" onSave={v => saveField({ oocytesMature: v })} />
          <EditableRow label="Immature (MI+GV)" value={cycle.oocytesImmature?.toString() || ''} type="number" onSave={v => saveField({ oocytesImmature: v })} />
          <EditableRow label="Embryologist" value={cycle.opuEmbryologist || ''} onSave={v => saveField({ opuEmbryologist: v })} />
        </CollapsibleSection>

        {/* Fertilization */}
        <CollapsibleSection title="Fertilization Check" defaultOpen={cycle.status === 'fertilized'}>
          <EditableRow label="Check Date" value={cycle.fertCheckDate?.split('T')[0] || ''} type="date" onSave={v => saveField({ fertCheckDate: v })} />
          <EditableRow label="Normal 2PN" value={cycle.fertNormal2pn?.toString() || ''} type="number" onSave={v => saveField({ fertNormal2pn: v })} />
          <EditableRow label="Abnormal (1PN/3PN)" value={cycle.fertAbnormal?.toString() || ''} type="number" onSave={v => saveField({ fertAbnormal: v })} />
          <EditableRow label="Unfertilized" value={cycle.fertUnfert?.toString() || ''} type="number" onSave={v => saveField({ fertUnfert: v })} />
          {cycle.fertRate != null && (
            <div style={{ padding: '8px 0', fontSize: 13, color: '#475569' }}>
              <strong>Fertilization Rate:</strong> <span style={{ color: TEAL, fontWeight: 700 }}>{cycle.fertRate}%</span>
            </div>
          )}
        </CollapsibleSection>

        {/* Transfer */}
        <CollapsibleSection title="Embryo Transfer" defaultOpen={cycle.status === 'transferred' || cycle.status === 'outcome-pending'}>
          <EditableRow label="Transfer Date" value={cycle.transferDate?.split('T')[0] || ''} type="date" onSave={v => saveField({ transferDate: v })} />
          <EditableRow label="Transfer Day" value={cycle.transferDay?.toString() || ''} type="number" onSave={v => saveField({ transferDay: v })} />
          <EditableRow label="Embryos Transferred" value={cycle.embryosTransferred?.toString() || ''} type="number" onSave={v => saveField({ embryosTransferred: v })} />
          <EditableRow label="Grades Transferred" value={cycle.transferGrades || ''} onSave={v => saveField({ transferGrades: v })} />
          <EditableRow label="Embryos Frozen" value={cycle.embryosFrozen?.toString() || ''} type="number" onSave={v => saveField({ embryosFrozen: v })} />
        </CollapsibleSection>

        {/* Outcome */}
        <CollapsibleSection title="Outcome" defaultOpen={cycle.status === 'outcome-pending' || cycle.status === 'completed'}>
          <EditableRow label="βhCG Date" value={cycle.bhcgDate?.split('T')[0] || ''} type="date" onSave={v => saveField({ bhcgDate: v })} />
          <EditableRow label="βhCG Value (mIU/mL)" value={cycle.bhcgValue?.toString() || ''} type="number" onSave={v => saveField({ bhcgValue: v })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <label style={{ fontSize: 12, display: 'flex', gap: 6, alignItems: 'center', padding: '4px 0' }}>
              <input type="checkbox" checked={cycle.bhcgPositive || false} onChange={e => saveField({ bhcgPositive: e.target.checked })} /> βhCG Positive
            </label>
            <label style={{ fontSize: 12, display: 'flex', gap: 6, alignItems: 'center', padding: '4px 0' }}>
              <input type="checkbox" checked={cycle.clinicalPregnancy || false} onChange={e => saveField({ clinicalPregnancy: e.target.checked })} /> Clinical Pregnancy
            </label>
            <label style={{ fontSize: 12, display: 'flex', gap: 6, alignItems: 'center', padding: '4px 0' }}>
              <input type="checkbox" checked={cycle.fetalHeartbeat || false} onChange={e => saveField({ fetalHeartbeat: e.target.checked })} /> Fetal Heartbeat
            </label>
          </div>
          <EditableRow label="Outcome" value={cycle.outcome || ''} onSave={v => saveField({ outcome: v })} type="select"
            options={['ongoing', 'live-birth', 'not-pregnant', 'biochemical', 'miscarriage', 'ectopic', 'stillbirth']} />
        </CollapsibleSection>

        {/* Status Actions */}
        {cycle.status !== 'completed' && cycle.status !== 'cancelled' && (
          <div style={{
            display: 'flex', gap: 8, marginTop: 20, paddingTop: 16, borderTop: '1px solid #e2e8f0',
            justifyContent: 'flex-end', flexWrap: 'wrap',
          }}>
            <button onClick={() => advanceStatus('cancelled')} style={{ ...secondaryBtnStyle, color: '#dc2626', borderColor: '#fecaca' }}>
              Cancel Cycle
            </button>
            {currentIdx < STAGES.length - 1 && STAGES[currentIdx + 1] && (
              <button onClick={() => advanceStatus(STAGES[currentIdx + 1])} style={primaryBtnStyle}>
                Advance → {STAGE_LABELS[STAGES[currentIdx + 1]] || STAGES[currentIdx + 1]}
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── Sub-Components ───────────────────────────
function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ padding: 16, borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 13, color: '#1e293b', fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function CollapsibleSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 12, border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', padding: '10px 16px', border: 'none', background: '#f8fafc',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#1e293b',
        }}
      >
        {title}
        <span style={{ fontSize: 12, color: '#94a3b8' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div style={{ padding: 16 }}>{children}</div>}
    </div>
  );
}

function EditableRow({ label, value, type = 'text', onSave, options }: {
  label: string; value: string; type?: string; onSave: (v: string) => void; options?: string[];
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);

  useEffect(() => { setVal(value); }, [value]);

  const save = () => { onSave(val); setEditing(false); };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ fontSize: 13, color: '#475569', fontWeight: 500, minWidth: 160 }}>{label}</span>
      {editing ? (
        <div style={{ display: 'flex', gap: 4 }}>
          {type === 'select' ? (
            <select value={val} onChange={e => setVal(e.target.value)} style={{ ...inputStyle, width: 180, padding: '4px 6px', fontSize: 12 }}>
              <option value="">—</option>
              {options?.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input type={type} value={val} onChange={e => setVal(e.target.value)}
              style={{ ...inputStyle, width: 140, padding: '4px 6px', fontSize: 12 }}
              onKeyDown={e => e.key === 'Enter' && save()} />
          )}
          <button onClick={save} style={{ ...primaryBtnStyle, padding: '4px 10px', fontSize: 11 }}>✓</button>
          <button onClick={() => setEditing(false)} style={{ ...secondaryBtnStyle, padding: '4px 10px', fontSize: 11 }}>✕</button>
        </div>
      ) : (
        <span
          onClick={() => setEditing(true)}
          style={{ fontSize: 13, color: value ? '#1e293b' : '#cbd5e1', cursor: 'pointer', fontWeight: value ? 500 : 400 }}
          title="Click to edit"
        >
          {value || 'Click to set'}
        </span>
      )}
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
