'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useFeatureGate, FeatureLockedBlock } from '@/lib/feature-gate';
import { RegulatoryGuidance } from '@/lib/regulatory-guidance';
import {
  PageHeader, Modal, Field, DataTable, StatusPill,
  useList, savePost, savePatch, fmtDate, fmtDateTime, today, errMsg, TEAL,
} from '../compliance/_components';

// ─── Constants ────────────────────────────────
const SPECIMEN_TYPES = [
  'Blood', 'Urine', 'Sputum', 'Pus', 'Wound Swab', 'CSF',
  'Stool', 'Body Fluid', 'Tissue', 'BAL', 'Catheter Tip',
  'Throat Swab', 'Nasal Swab', 'Vaginal Swab', 'Eye Swab', 'Ear Swab',
];

const AST_METHODS = [
  { value: 'disk-diffusion', label: 'Disk Diffusion (Kirby-Bauer)' },
  { value: 'mic-broth', label: 'MIC — Broth Dilution' },
  { value: 'mic-agar', label: 'MIC — Agar Dilution' },
  { value: 'vitek', label: 'VITEK 2 Automated' },
  { value: 'etest', label: 'E-test' },
];

const INTERPRETATIONS = [
  { value: 'S', label: 'S — Susceptible', color: '#16a34a' },
  { value: 'I', label: 'I — Intermediate', color: '#d97706' },
  { value: 'R', label: 'R — Resistant', color: '#dc2626' },
  { value: 'SDD', label: 'SDD — Susceptible Dose-Dependent', color: '#2563eb' },
];

const COMMON_ORGANISMS = [
  'Escherichia coli', 'Klebsiella pneumoniae', 'Klebsiella oxytoca',
  'Pseudomonas aeruginosa', 'Acinetobacter baumannii',
  'Staphylococcus aureus', 'Staphylococcus epidermidis',
  'Streptococcus pneumoniae', 'Streptococcus pyogenes',
  'Enterococcus faecalis', 'Enterococcus faecium',
  'Proteus mirabilis', 'Proteus vulgaris',
  'Enterobacter cloacae', 'Enterobacter aerogenes',
  'Citrobacter freundii', 'Serratia marcescens',
  'Salmonella typhi', 'Salmonella paratyphi A',
  'Shigella spp.', 'Haemophilus influenzae',
  'Moraxella catarrhalis', 'Neisseria meningitidis',
  'Candida albicans', 'Candida auris',
];

// WHONET antibiotic codes → names (common panels per ICMR guidelines)
const ANTIBIOTIC_PANELS: Record<string, Array<{ code: string; name: string; class: string }>> = {
  'Gram Negative': [
    { code: 'AMP', name: 'Ampicillin', class: 'Penicillins' },
    { code: 'AMC', name: 'Amoxicillin-Clavulanate', class: 'Penicillins' },
    { code: 'TZP', name: 'Piperacillin-Tazobactam', class: 'Penicillins' },
    { code: 'CXM', name: 'Cefuroxime', class: 'Cephalosporins' },
    { code: 'CTX', name: 'Cefotaxime', class: 'Cephalosporins' },
    { code: 'CRO', name: 'Ceftriaxone', class: 'Cephalosporins' },
    { code: 'CAZ', name: 'Ceftazidime', class: 'Cephalosporins' },
    { code: 'FEP', name: 'Cefepime', class: 'Cephalosporins' },
    { code: 'IPM', name: 'Imipenem', class: 'Carbapenems' },
    { code: 'MEM', name: 'Meropenem', class: 'Carbapenems' },
    { code: 'ETP', name: 'Ertapenem', class: 'Carbapenems' },
    { code: 'CIP', name: 'Ciprofloxacin', class: 'Fluoroquinolones' },
    { code: 'LVX', name: 'Levofloxacin', class: 'Fluoroquinolones' },
    { code: 'AMK', name: 'Amikacin', class: 'Aminoglycosides' },
    { code: 'GEN', name: 'Gentamicin', class: 'Aminoglycosides' },
    { code: 'SXT', name: 'Trimethoprim-Sulfamethoxazole', class: 'Sulfonamides' },
    { code: 'NIT', name: 'Nitrofurantoin', class: 'Nitrofurans' },
    { code: 'CST', name: 'Colistin', class: 'Polymyxins' },
    { code: 'TGC', name: 'Tigecycline', class: 'Tetracyclines' },
    { code: 'FOF', name: 'Fosfomycin', class: 'Fosfomycins' },
  ],
  'Gram Positive': [
    { code: 'PEN', name: 'Penicillin', class: 'Penicillins' },
    { code: 'AMP', name: 'Ampicillin', class: 'Penicillins' },
    { code: 'OXA', name: 'Oxacillin', class: 'Penicillins' },
    { code: 'FOX', name: 'Cefoxitin (MRSA screen)', class: 'Cephalosporins' },
    { code: 'ERY', name: 'Erythromycin', class: 'Macrolides' },
    { code: 'AZM', name: 'Azithromycin', class: 'Macrolides' },
    { code: 'CLI', name: 'Clindamycin', class: 'Lincosamides' },
    { code: 'VAN', name: 'Vancomycin', class: 'Glycopeptides' },
    { code: 'TEC', name: 'Teicoplanin', class: 'Glycopeptides' },
    { code: 'LZD', name: 'Linezolid', class: 'Oxazolidinones' },
    { code: 'CIP', name: 'Ciprofloxacin', class: 'Fluoroquinolones' },
    { code: 'LVX', name: 'Levofloxacin', class: 'Fluoroquinolones' },
    { code: 'GEN', name: 'Gentamicin (high-level)', class: 'Aminoglycosides' },
    { code: 'SXT', name: 'Trimethoprim-Sulfamethoxazole', class: 'Sulfonamides' },
    { code: 'DOX', name: 'Doxycycline', class: 'Tetracyclines' },
    { code: 'RIF', name: 'Rifampicin', class: 'Rifamycins' },
    { code: 'NIT', name: 'Nitrofurantoin', class: 'Nitrofurans' },
  ],
};

// ─── Tabs ─────────────────────────────────────
type TabKey = 'list' | 'cumulative' | 'alerts';

// ─── Main Page Component ──────────────────────
export default function AntibiogramPage() {
  const gate = useFeatureGate('antibiogram');
  const [activeTab, setActiveTab] = useState<TabKey>('list');

  if (gate.locked) return <FeatureLockedBlock gate={gate} />;

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader
        title="Antibiogram — AST Results"
        subtitle="Antimicrobial Susceptibility Testing per CLSI M100 · ICMR AMR Surveillance"
      />

      {/* Tab Bar */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 24,
        borderBottom: '2px solid #e2e8f0', paddingBottom: 0,
      }}>
        {([
          { key: 'list', label: 'AST Records' },
          { key: 'cumulative', label: 'Cumulative Antibiogram' },
          { key: 'alerts', label: 'AMR Alerts' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderBottom: activeTab === tab.key ? `3px solid ${TEAL}` : '3px solid transparent',
              background: 'transparent',
              color: activeTab === tab.key ? TEAL : '#64748b',
              fontWeight: activeTab === tab.key ? 600 : 400,
              cursor: 'pointer',
              fontSize: 14,
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'list' && <AstRecordsTab />}
      {activeTab === 'cumulative' && <CumulativeTab />}
      {activeTab === 'alerts' && <AlertsTab />}

      {/* Regulatory Guidance Panel — MANDATORY */}
      <RegulatoryGuidance
        title="Antibiogram — Regulatory Requirements"
        items={[
          {
            body: 'CLSI M100 (Ed. 36, 2026)',
            detail: 'All AST interpretations (S/I/R) must follow CLSI M100 breakpoint tables. Zone diameters and MIC values are interpreted against organism-specific breakpoints published annually. Labs must update breakpoints each calendar year.',
          },
          {
            body: 'CLSI M39 — Cumulative Antibiogram Construction',
            detail: 'Institutional antibiograms must: (1) include only verified results, (2) use first isolate per patient per species per analysis period, (3) report only organisms with ≥30 isolates, (4) be updated at least annually. HospiBot auto-applies these deduplication rules.',
          },
          {
            body: 'ICMR AMRSN (Antimicrobial Resistance Surveillance Network)',
            detail: 'India\'s National Action Plan on AMR (2017) mandates institutional AMR surveillance. ICMR AMRSN nodal centers require labs to report unusual resistance patterns including MRSA, VRE, ESBL, CRE, CRPA, CRAB, and Candida auris. HospiBot auto-flags these organisms.',
          },
          {
            body: 'NABL ISO 15189 Clause 5.5 — Technical Competence',
            detail: 'NABL-accredited microbiology labs must demonstrate AST proficiency, maintain QC records for AST media and discs, and participate in EQA/PT programs. AST results must be verified by a qualified microbiologist before release.',
          },
          {
            body: 'ICMR Treatment Guidelines for Antimicrobial Use (2022)',
            detail: 'Empirical therapy must be guided by local antibiogram data. The ICMR recommends institutions maintain and circulate their cumulative antibiogram to all clinicians annually. The "Access, Watch, Reserve" AWaRe classification guides antibiotic stewardship.',
          },
          {
            body: 'WHONET Export — WHO AMR Surveillance',
            detail: 'WHONET (WHO Collaborating Centre, Boston) is the global standard for AMR data management. HospiBot supports WHONET-compatible CSV export with standard field mapping (PATIENT_ID, SPEC_TYPE, ORGANISM, ORG_CODE, antibiotic codes) for national/global reporting.',
          },
        ]}
      />
    </div>
  );
}

// ─── TAB 1: AST Records List ──────────────────
function AstRecordsTab() {
  const { rows, total, loading, page, setPage, reload } = useList('/diagnostic/antibiogram');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterOrganism, setFilterOrganism] = useState('');

  const columns = useMemo(() => [
    { key: 'specimenDate', label: 'Date', render: (r: any) => fmtDate(r.specimenDate) },
    { key: 'patientName', label: 'Patient' },
    { key: 'patientUhid', label: 'UHID' },
    { key: 'organism', label: 'Organism', render: (r: any) => (
      <span style={{ fontStyle: 'italic' }}>{r.organism}</span>
    )},
    { key: 'specimenType', label: 'Specimen' },
    { key: 'method', label: 'Method', render: (r: any) => {
      const m = AST_METHODS.find(m => m.value === r.method);
      return m?.label || r.method;
    }},
    { key: 'results', label: 'Antibiotics', render: (r: any) => (
      <span>{r.results?.length || 0} tested</span>
    )},
    { key: 'alerts', label: 'Alerts', render: (r: any) => {
      const alerts = [];
      if (r.mrsaDetected) alerts.push('MRSA');
      if (r.esblDetected) alerts.push('ESBL');
      if (r.crbDetected) alerts.push('CRE');
      if (r.vrDetected) alerts.push('VRE');
      return alerts.length > 0 ? (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {alerts.map(a => (
            <span key={a} style={{
              padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
              background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
            }}>{a}</span>
          ))}
        </div>
      ) : <span style={{ color: '#94a3b8' }}>—</span>;
    }},
    { key: 'status', label: 'Status', render: (r: any) => (
      <StatusPill status={r.status} map={{
        draft: { label: 'Draft', bg: '#f1f5f9', fg: '#475569' },
        verified: { label: 'Verified', bg: '#ecfdf5', fg: '#059669' },
        reported: { label: 'Reported', bg: '#eff6ff', fg: '#2563eb' },
      }} />
    )},
  ], []);

  return (
    <>
      {/* Actions Bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 16, flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={selectStyle}
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="verified">Verified</option>
            <option value="reported">Reported</option>
          </select>
          <input
            placeholder="Filter organism..."
            value={filterOrganism}
            onChange={e => setFilterOrganism(e.target.value)}
            style={{ ...selectStyle, width: 180 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => exportWhonet()} style={secondaryBtnStyle}>
            ⬇ WHONET Export
          </button>
          <button
            onClick={() => { setEditId(null); setShowModal(true); }}
            style={primaryBtnStyle}
          >
            + New AST Record
          </button>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        total={total}
        page={page}
        onPageChange={setPage}
        onRowClick={(r: any) => { setEditId(r.id); setShowModal(true); }}
        emptyMessage="No antibiogram records yet. Create your first AST record."
      />

      {/* Create/Edit Modal */}
      {showModal && (
        <AntibiogramModal
          id={editId}
          onClose={() => { setShowModal(false); setEditId(null); }}
          onSaved={() => { setShowModal(false); setEditId(null); reload(); }}
        />
      )}
    </>
  );
}

// ─── TAB 2: Cumulative Antibiogram ────────────
function CumulativeTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    to: today(),
  });

  const loadCumulative = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ from: dateRange.from, to: dateRange.to });
      const res = await fetch(`/api/v1/diagnostic/antibiogram/reports/cumulative?${params}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to load cumulative data', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => { loadCumulative(); }, [loadCumulative]);

  // Collect all unique antibiotics across all organisms
  const allAntibiotics = useMemo(() => {
    if (!data?.data) return [];
    const set = new Set<string>();
    data.data.forEach((org: any) =>
      org.antibiotics.forEach((a: any) => set.add(a.antibiotic))
    );
    return Array.from(set).sort();
  }, [data]);

  return (
    <div>
      {/* Date Range Filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <Field label="From" style={{ flex: 'none' }}>
          <input
            type="date"
            value={dateRange.from}
            onChange={e => setDateRange(p => ({ ...p, from: e.target.value }))}
            style={inputStyle}
          />
        </Field>
        <Field label="To" style={{ flex: 'none' }}>
          <input
            type="date"
            value={dateRange.to}
            onChange={e => setDateRange(p => ({ ...p, to: e.target.value }))}
            style={inputStyle}
          />
        </Field>
        <div style={{ marginTop: 20 }}>
          <button onClick={loadCumulative} style={primaryBtnStyle}>Generate</button>
        </div>
      </div>

      {/* Summary Cards */}
      {data && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <SummaryCard label="Total Isolates (deduplicated)" value={data.totalIsolates} />
          <SummaryCard label="Raw Records" value={data.totalRawRecords} />
          <SummaryCard label="Organisms" value={data.data?.length || 0} />
          <div style={{
            flex: '1 1 300px', padding: 16, borderRadius: 8,
            background: '#fffbeb', border: '1px solid #fde68a',
          }}>
            <div style={{ fontSize: 12, color: '#92400e', fontWeight: 500 }}>
              Deduplication Method
            </div>
            <div style={{ fontSize: 13, color: '#78350f', marginTop: 4 }}>
              {data.deduplicationMethod}
            </div>
          </div>
        </div>
      )}

      {/* Cumulative Antibiogram Matrix */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>Loading...</div>
      ) : data?.data?.length > 0 ? (
        <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={thStyle}>Organism</th>
                <th style={thStyle}>n</th>
                <th style={{ ...thStyle, fontSize: 10 }}>≥30?</th>
                {allAntibiotics.map(abx => (
                  <th key={abx} style={{ ...thStyle, writingMode: 'vertical-rl', textOrientation: 'mixed', height: 120 }}>
                    {abx}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.data.map((org: any) => (
                <tr key={org.organism} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ ...tdStyle, fontStyle: 'italic', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {org.organism}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>
                    {org.isolateCount}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    {org.meetsClsiM39 ? (
                      <span style={{ color: '#16a34a' }}>✓</span>
                    ) : (
                      <span style={{ color: '#dc2626', fontSize: 10 }}>✗</span>
                    )}
                  </td>
                  {allAntibiotics.map(abx => {
                    const match = org.antibiotics.find((a: any) => a.antibiotic === abx);
                    if (!match) return <td key={abx} style={{ ...tdStyle, textAlign: 'center', color: '#cbd5e1' }}>—</td>;
                    const pct = match.percentSusceptible;
                    return (
                      <td
                        key={abx}
                        style={{
                          ...tdStyle, textAlign: 'center', fontWeight: 600, fontSize: 12,
                          background: pct >= 80 ? '#f0fdf4' : pct >= 50 ? '#fffbeb' : '#fef2f2',
                          color: pct >= 80 ? '#166534' : pct >= 50 ? '#92400e' : '#991b1b',
                        }}
                        title={`${match.tested} tested | ${match.susceptible}S ${match.intermediate}I ${match.resistant}R`}
                      >
                        {pct}%
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{
          textAlign: 'center', padding: 48, color: '#94a3b8',
          background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0',
        }}>
          No verified AST data available for the selected period.
          <br />
          <span style={{ fontSize: 13 }}>
            Per CLSI M39, a minimum of 30 isolates per organism is required for a valid antibiogram.
          </span>
        </div>
      )}

      {/* Color Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 12, color: '#64748b' }}>
        <span><span style={{ display: 'inline-block', width: 14, height: 14, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 3, verticalAlign: 'middle', marginRight: 4 }} /> ≥80% Susceptible</span>
        <span><span style={{ display: 'inline-block', width: 14, height: 14, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 3, verticalAlign: 'middle', marginRight: 4 }} /> 50–79% Susceptible</span>
        <span><span style={{ display: 'inline-block', width: 14, height: 14, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 3, verticalAlign: 'middle', marginRight: 4 }} /> &lt;50% Susceptible</span>
      </div>
    </div>
  );
}

// ─── TAB 3: AMR Alerts ────────────────────────
function AlertsTab() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [alertRecords, setAlertRecords] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, recordsRes] = await Promise.all([
          fetch('/api/v1/diagnostic/antibiogram/reports/alert-stats'),
          fetch('/api/v1/diagnostic/antibiogram?mrsaDetected=true&esblDetected=true&crbDetected=true&vrDetected=true&limit=50'),
        ]);
        setStats(await statsRes.json());
        const rData = await recordsRes.json();
        // Filter to only alert records
        setAlertRecords(
          (rData.data || []).filter((r: any) =>
            r.mrsaDetected || r.esblDetected || r.crbDetected || r.vrDetected
          )
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>Loading AMR alerts...</div>;

  return (
    <div>
      {/* Alert Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <AlertCard label="MRSA" count={stats?.alerts?.mrsa || 0} total={stats?.total || 0}
          desc="Methicillin-resistant S. aureus" color="#dc2626" />
        <AlertCard label="ESBL" count={stats?.alerts?.esbl || 0} total={stats?.total || 0}
          desc="Extended-Spectrum β-Lactamase" color="#ea580c" />
        <AlertCard label="CRE" count={stats?.alerts?.carbapenemResistant || 0} total={stats?.total || 0}
          desc="Carbapenem-Resistant Enterobacterales" color="#9333ea" />
        <AlertCard label="VRE" count={stats?.alerts?.vancomycinResistant || 0} total={stats?.total || 0}
          desc="Vancomycin-Resistant Enterococcus" color="#be123c" />
      </div>

      {/* ICMR Notification Guidance */}
      <div style={{
        padding: 16, marginBottom: 24, borderRadius: 8,
        background: '#fef2f2', border: '1px solid #fecaca',
      }}>
        <div style={{ fontWeight: 600, color: '#991b1b', marginBottom: 8 }}>
          ⚠ ICMR AMR Surveillance Reporting Obligation
        </div>
        <div style={{ fontSize: 13, color: '#7f1d1d', lineHeight: 1.6 }}>
          Per India&apos;s National Action Plan on AMR (NAP-AMR 2017) and ICMR AMRSN protocols,
          labs must report unusual antimicrobial resistance patterns to the nearest ICMR AMR nodal center.
          Critical alert organisms include: MRSA, VRE, ESBL-producing Enterobacterales,
          Carbapenem-resistant organisms (CRE/CRPA/CRAB), Colistin-resistant organisms, and Candida auris.
          Use the WHONET Export on the AST Records tab to prepare data for ICMR submission.
        </div>
      </div>

      {/* Recent Alert Records */}
      {alertRecords.length > 0 && (
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', marginBottom: 12 }}>
            Recent Alert Isolates
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#fef2f2' }}>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Patient</th>
                  <th style={thStyle}>Organism</th>
                  <th style={thStyle}>Specimen</th>
                  <th style={thStyle}>Alert Type</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {alertRecords.map((r: any) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={tdStyle}>{fmtDate(r.specimenDate)}</td>
                    <td style={tdStyle}>{r.patientName || '—'}</td>
                    <td style={{ ...tdStyle, fontStyle: 'italic' }}>{r.organism}</td>
                    <td style={tdStyle}>{r.specimenType}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {r.mrsaDetected && <AlertBadge text="MRSA" />}
                        {r.esblDetected && <AlertBadge text="ESBL" />}
                        {r.crbDetected && <AlertBadge text="CRE" />}
                        {r.vrDetected && <AlertBadge text="VRE" />}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      {r.icmrReported ? (
                        <span style={{ color: '#059669', fontWeight: 500 }}>Reported</span>
                      ) : (
                        <span style={{ color: '#dc2626', fontWeight: 500 }}>Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Modal: Create/Edit Antibiogram ───────────
function AntibiogramModal({
  id, onClose, onSaved,
}: { id: string | null; onClose: () => void; onSaved: () => void }) {
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    patientName: '', patientUhid: '', patientId: '',
    specimenType: '', specimenDate: today(), organism: '',
    organismCode: '', method: 'disk-diffusion', breakpointStd: 'CLSI',
    breakpointYear: '', notes: '', isolateNumber: 1,
    cultureId: '', labOrderId: '', sampleId: '',
  });

  const [results, setResults] = useState<Array<{
    antibiotic: string; antibioticCode: string; drugClass: string;
    testMethod: string; zoneDiameter: string; micValue: string;
    micSign: string; interpretation: string;
    breakpointS: string; breakpointR: string;
  }>>([]);

  const [selectedPanel, setSelectedPanel] = useState<string>('Gram Negative');

  // Load existing record
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/v1/diagnostic/antibiogram/${id}`);
        const data = await res.json();
        if (data) {
          setForm({
            patientName: data.patientName || '',
            patientUhid: data.patientUhid || '',
            patientId: data.patientId || '',
            specimenType: data.specimenType || '',
            specimenDate: data.specimenDate?.split('T')[0] || today(),
            organism: data.organism || '',
            organismCode: data.organismCode || '',
            method: data.method || 'disk-diffusion',
            breakpointStd: data.breakpointStd || 'CLSI',
            breakpointYear: data.breakpointYear || '',
            notes: data.notes || '',
            isolateNumber: data.isolateNumber || 1,
            cultureId: data.cultureId || '',
            labOrderId: data.labOrderId || '',
            sampleId: data.sampleId || '',
          });
          setResults(
            (data.results || []).map((r: any) => ({
              antibiotic: r.antibiotic || '',
              antibioticCode: r.antibioticCode || '',
              drugClass: r.drugClass || '',
              testMethod: r.testMethod || '',
              zoneDiameter: r.zoneDiameter?.toString() || '',
              micValue: r.micValue?.toString() || '',
              micSign: r.micSign || '',
              interpretation: r.interpretation || '',
              breakpointS: r.breakpointS || '',
              breakpointR: r.breakpointR || '',
            }))
          );
        }
      } catch (err) {
        setError('Failed to load record');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const setField = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));

  const addPanelAntibiotics = () => {
    const panel = ANTIBIOTIC_PANELS[selectedPanel] || [];
    const existing = new Set(results.map(r => r.antibioticCode));
    const newResults = panel
      .filter(p => !existing.has(p.code))
      .map(p => ({
        antibiotic: p.name,
        antibioticCode: p.code,
        drugClass: p.class,
        testMethod: form.method === 'disk-diffusion' ? 'disk' : 'mic',
        zoneDiameter: '', micValue: '', micSign: '',
        interpretation: '', breakpointS: '', breakpointR: '',
      }));
    setResults(prev => [...prev, ...newResults]);
  };

  const updateResult = (idx: number, key: string, val: string) => {
    setResults(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [key]: val };
      return copy;
    });
  };

  const removeResult = (idx: number) => {
    setResults(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      const payload = {
        ...form,
        isolateNumber: Number(form.isolateNumber),
        results: results.filter(r => r.interpretation), // only include rows with interpretation
      };

      if (id) {
        await savePatch(`/diagnostic/antibiogram/${id}`, payload);
      } else {
        await savePost('/diagnostic/antibiogram', payload);
      }
      onSaved();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Modal title="Loading..." onClose={onClose}><div style={{ padding: 32, textAlign: 'center' }}>Loading...</div></Modal>;

  return (
    <Modal
      title={id ? 'Edit AST Record' : 'New Antibiogram — AST Entry'}
      onClose={onClose}
      width={1100}
    >
      <div style={{ padding: '16px 24px', maxHeight: '75vh', overflowY: 'auto' }}>
        {error && (
          <div style={{ padding: 12, background: '#fef2f2', color: '#dc2626', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* ── Patient & Specimen Info ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
          <Field label="Patient Name">
            <input value={form.patientName} onChange={e => setField('patientName', e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Patient UHID">
            <input value={form.patientUhid} onChange={e => setField('patientUhid', e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Lab Order / Sample ID">
            <input value={form.sampleId} onChange={e => setField('sampleId', e.target.value)} style={inputStyle} />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
          <Field label="Specimen Type *">
            <select value={form.specimenType} onChange={e => setField('specimenType', e.target.value)} style={selectStyle}>
              <option value="">Select...</option>
              {SPECIMEN_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Specimen Date *">
            <input type="date" value={form.specimenDate} onChange={e => setField('specimenDate', e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Organism *">
            <input
              list="organisms-list"
              value={form.organism}
              onChange={e => setField('organism', e.target.value)}
              style={inputStyle}
              placeholder="Type or select..."
            />
            <datalist id="organisms-list">
              {COMMON_ORGANISMS.map(o => <option key={o} value={o} />)}
            </datalist>
          </Field>
          <Field label="Isolate #">
            <input type="number" min={1} value={form.isolateNumber} onChange={e => setField('isolateNumber', e.target.value)} style={inputStyle} />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
          <Field label="AST Method">
            <select value={form.method} onChange={e => setField('method', e.target.value)} style={selectStyle}>
              {AST_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </Field>
          <Field label="Breakpoint Standard">
            <select value={form.breakpointStd} onChange={e => setField('breakpointStd', e.target.value)} style={selectStyle}>
              <option value="CLSI">CLSI (M100)</option>
              <option value="EUCAST">EUCAST</option>
            </select>
          </Field>
          <Field label="Breakpoint Edition">
            <input
              value={form.breakpointYear}
              onChange={e => setField('breakpointYear', e.target.value)}
              placeholder="e.g. M100-Ed36"
              style={inputStyle}
            />
          </Field>
        </div>

        {/* ── Antibiotic Results Panel ── */}
        <div style={{
          borderTop: '1px solid #e2e8f0', paddingTop: 16, marginTop: 8,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', margin: 0 }}>
              Antibiotic Susceptibility Results
            </h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={selectedPanel} onChange={e => setSelectedPanel(e.target.value)} style={selectStyle}>
                {Object.keys(ANTIBIOTIC_PANELS).map(p => (
                  <option key={p} value={p}>{p} Panel</option>
                ))}
              </select>
              <button onClick={addPanelAntibiotics} style={secondaryBtnStyle}>
                + Load Panel
              </button>
              <button
                onClick={() => setResults(prev => [...prev, {
                  antibiotic: '', antibioticCode: '', drugClass: '',
                  testMethod: '', zoneDiameter: '', micValue: '', micSign: '',
                  interpretation: '', breakpointS: '', breakpointR: '',
                }])}
                style={secondaryBtnStyle}
              >
                + Add Row
              </button>
            </div>
          </div>

          {results.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={thStyle}>Antibiotic</th>
                    <th style={thStyle}>Code</th>
                    <th style={thStyle}>Class</th>
                    <th style={thStyle}>Zone (mm)</th>
                    <th style={thStyle}>MIC (µg/mL)</th>
                    <th style={thStyle}>Interpretation</th>
                    <th style={{ ...thStyle, width: 36 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, idx) => (
                    <tr key={idx} style={{
                      borderBottom: '1px solid #e2e8f0',
                      background: r.interpretation === 'R' ? '#fef2f2' :
                                   r.interpretation === 'I' || r.interpretation === 'SDD' ? '#fffbeb' :
                                   r.interpretation === 'S' ? '#f0fdf4' : 'white',
                    }}>
                      <td style={tdStyle}>
                        <input
                          value={r.antibiotic}
                          onChange={e => updateResult(idx, 'antibiotic', e.target.value)}
                          style={{ ...inputStyle, fontSize: 12, padding: '4px 6px' }}
                          placeholder="Antibiotic name"
                        />
                      </td>
                      <td style={tdStyle}>
                        <input
                          value={r.antibioticCode}
                          onChange={e => updateResult(idx, 'antibioticCode', e.target.value)}
                          style={{ ...inputStyle, fontSize: 12, padding: '4px 6px', width: 60 }}
                          placeholder="AMP"
                        />
                      </td>
                      <td style={{ ...tdStyle, fontSize: 11, color: '#64748b' }}>
                        {r.drugClass || '—'}
                      </td>
                      <td style={tdStyle}>
                        <input
                          type="number"
                          value={r.zoneDiameter}
                          onChange={e => updateResult(idx, 'zoneDiameter', e.target.value)}
                          style={{ ...inputStyle, fontSize: 12, padding: '4px 6px', width: 70 }}
                          placeholder="mm"
                        />
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <select
                            value={r.micSign}
                            onChange={e => updateResult(idx, 'micSign', e.target.value)}
                            style={{ ...selectStyle, fontSize: 12, padding: '4px', width: 48 }}
                          >
                            <option value="">—</option>
                            <option value="<=">≤</option>
                            <option value="=">=</option>
                            <option value=">=">≥</option>
                          </select>
                          <input
                            type="number"
                            step="0.01"
                            value={r.micValue}
                            onChange={e => updateResult(idx, 'micValue', e.target.value)}
                            style={{ ...inputStyle, fontSize: 12, padding: '4px 6px', width: 70 }}
                            placeholder="µg/mL"
                          />
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <select
                          value={r.interpretation}
                          onChange={e => updateResult(idx, 'interpretation', e.target.value)}
                          style={{
                            ...selectStyle, fontSize: 12, padding: '4px 6px', fontWeight: 700,
                            color: r.interpretation === 'S' ? '#16a34a' :
                                   r.interpretation === 'R' ? '#dc2626' :
                                   r.interpretation === 'I' || r.interpretation === 'SDD' ? '#d97706' : '#1e293b',
                          }}
                        >
                          <option value="">Select</option>
                          {INTERPRETATIONS.map(i => (
                            <option key={i.value} value={i.value}>{i.value} — {i.label.split('—')[1]?.trim()}</option>
                          ))}
                        </select>
                      </td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => removeResult(idx)}
                          style={{
                            border: 'none', background: 'none', cursor: 'pointer',
                            color: '#dc2626', fontSize: 16,
                          }}
                          title="Remove"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{
              padding: 32, textAlign: 'center', color: '#94a3b8',
              background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1',
            }}>
              Load an antibiotic panel or add individual rows to enter AST results.
            </div>
          )}
        </div>

        {/* Notes */}
        <Field label="Notes" style={{ marginTop: 16 }}>
          <textarea
            value={form.notes}
            onChange={e => setField('notes', e.target.value)}
            style={{ ...inputStyle, height: 60, resize: 'vertical' }}
            placeholder="Additional observations, special resistance mechanisms noted..."
          />
        </Field>

        {/* Save Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
          <button onClick={onClose} style={secondaryBtnStyle}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={primaryBtnStyle}>
            {saving ? 'Saving...' : id ? 'Update' : 'Save AST Record'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Utility Components ───────────────────────
function SummaryCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{
      flex: '1 1 160px', padding: 16, borderRadius: 8,
      background: '#f8fafc', border: '1px solid #e2e8f0',
    }}>
      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: TEAL, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function AlertCard({ label, count, total, desc, color }: {
  label: string; count: number; total: number; desc: string; color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{
      padding: 16, borderRadius: 8, border: `1px solid ${color}22`,
      background: `${color}08`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 16, fontWeight: 700, color }}>{label}</span>
        <span style={{ fontSize: 28, fontWeight: 800, color }}>{count}</span>
      </div>
      <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{desc}</div>
      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{pct}% of {total} isolates</div>
    </div>
  );
}

function AlertBadge({ text }: { text: string }) {
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
      background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
    }}>
      {text}
    </span>
  );
}

// ─── WHONET Export Helper ─────────────────────
async function exportWhonet() {
  try {
    const res = await fetch('/api/v1/diagnostic/antibiogram/reports/whonet-export');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whonet_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('WHONET export failed', err);
    alert('Export failed. Please try again.');
  }
}

// ─── Styles ───────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 6,
  border: '1px solid #cbd5e1', fontSize: 13, outline: 'none',
  transition: 'border-color 0.2s',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle, appearance: 'auto' as any,
};

const primaryBtnStyle: React.CSSProperties = {
  padding: '8px 20px', borderRadius: 6, border: 'none',
  background: TEAL, color: 'white', fontWeight: 600,
  fontSize: 13, cursor: 'pointer',
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 6,
  border: '1px solid #cbd5e1', background: 'white',
  color: '#475569', fontWeight: 500, fontSize: 13, cursor: 'pointer',
};

const thStyle: React.CSSProperties = {
  padding: '8px 10px', textAlign: 'left', fontWeight: 600,
  color: '#475569', fontSize: 12, borderBottom: '2px solid #e2e8f0',
};

const tdStyle: React.CSSProperties = {
  padding: '8px 10px', fontSize: 13, color: '#1e293b',
};
