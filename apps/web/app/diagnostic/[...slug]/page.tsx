'use client';

/**
 * Subtype catch-all — renders a "Coming Soon" placeholder for any diagnostic
 * subtype nav href that hasn't been built yet. Next.js App Router only
 * matches this catch-all when no explicit folder exists for the requested
 * path, so this does NOT shadow any real pages.
 *
 * Why a catch-all instead of individual stub pages for each of the 31
 * missing features? Each feature (DICOM viewer, pedigree builder, variant
 * DB, etc.) is a significant product design exercise. Stubbing them
 * individually with light functional pages would look ready but do nothing
 * useful. A single well-designed placeholder is more truthful and easier to
 * maintain — when we build a real version, we simply create the matching
 * folder and the catch-all stops firing for it.
 *
 * This file also serves as the roadmap for what's next: every entry in
 * FEATURE_MAP below is a planned feature with its name and short blurb.
 */

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Sparkles, Clock } from 'lucide-react';

// Canonical feature metadata — keep in sync with DIAG_SUBTYPE_NAV in
// apps/web/lib/portal-feature-flags.ts. When a feature graduates from this
// map to a real implementation, delete its entry AND create the matching
// app/diagnostic/<slug>/page.tsx folder.
const FEATURE_MAP: Record<string, { label: string; blurb: string; category: string }> = {
  // ── Sample logistics ──────────────────────────────────────────────────
  // NOTE: 'dispatch' graduated to a real page at app/diagnostic/dispatch/page.tsx
  // NOTE: 'cold-chain' graduated to a real page at app/diagnostic/cold-chain/page.tsx
  'agents': {
    label: 'Field Agents',
    blurb: 'Manage field agent roster, schedules, and performance for home-sample-collection services.',
    category: 'Sample Logistics',
  },
  'routes': {
    label: 'Route Planning',
    blurb: 'Optimise daily home-collection routes — cluster bookings by pincode, minimise agent travel time.',
    category: 'Sample Logistics',
  },

  // ── Radiology / imaging ───────────────────────────────────────────────
  'dicom': {
    label: 'DICOM Viewer',
    blurb: 'Web-based DICOM viewer with OHIF for radiologist review of scan images inside the portal.',
    category: 'Radiology',
  },
  'radiologists': {
    label: 'Radiologist Panel',
    blurb: 'Manage your radiologist panel — schedule assignments, reading counts, tele-radiology handoff.',
    category: 'Radiology',
  },
  'ob-module': {
    label: 'OB / Growth Scan',
    blurb: 'Obstetric scan template with growth charts, EDD calculator, fetal biometry tracking.',
    category: 'Radiology',
  },
  'sonologists': {
    label: 'Sonologist Panel',
    blurb: 'Manage USG sonologist panel — scheduling, load balancing, per-sonologist reporting metrics.',
    category: 'Radiology',
  },
  'radiotracer': {
    label: 'Radiotracer Log',
    blurb: 'Track FDG and other radiotracer administration — batch numbers, half-life, patient dose tracking.',
    category: 'Nuclear Medicine',
  },
  'rso-dashboard': {
    label: 'RSO Dashboard',
    blurb: 'Radiation Safety Officer dashboard — aggregate dose tracking, shielding checks, incident reports.',
    category: 'Nuclear Medicine',
  },
  'worklist': {
    label: 'Reading Worklist',
    blurb: 'Tele-radiology reading queue with SLA timers, priority flagging, and radiologist assignment.',
    category: 'Radiology',
  },
  'client-centers': {
    label: 'Client Centers',
    blurb: 'Manage your client centers for tele-radiology — contracts, SLAs, volume tracking.',
    category: 'Radiology',
  },
  'sla-monitor': {
    label: 'SLA Monitor',
    blurb: 'Live SLA tracking for tele-radiology reads — time-to-read, breach alerts, monthly SLA reports.',
    category: 'Radiology',
  },

  // ── Cardiac diagnostics ───────────────────────────────────────────────
  'tmt-module': {
    label: 'TMT / Stress Test',
    blurb: 'Treadmill stress-test reporting with Bruce protocol support, ECG overlays, interpretation templates.',
    category: 'Cardiac',
  },
  'holter': {
    label: 'Holter Allocation',
    blurb: 'Holter monitor device allocation, tracking, and return management — 24 / 48 / 72-hour studies.',
    category: 'Cardiac',
  },
  'abpm': {
    label: 'ABPM Reports',
    blurb: 'Ambulatory blood-pressure monitoring reports with diurnal patterns, dipping profiles, BP loads.',
    category: 'Cardiac',
  },
  'cath-lab': {
    label: 'Cath Lab Schedule',
    blurb: 'Cardiac cath lab scheduling — procedure types, consumables, post-procedure reporting.',
    category: 'Cardiac',
  },

  // ── Molecular / genetic ───────────────────────────────────────────────
  'batch': {
    label: 'Batch Processing',
    blurb: 'Molecular lab batch runs — PCR plate layouts, NGS runs, multiplex panel processing.',
    category: 'Molecular',
  },
  'gov-reporting': {
    label: 'ICMR / NACO Reports',
    blurb: 'Auto-generated regulatory reports for ICMR (molecular surveillance) and NACO (HIV testing).',
    category: 'Molecular',
  },
  'counseling': {
    label: 'Genetic Counseling',
    blurb: 'Pre- and post-test genetic counseling scheduling with counselor panel and session notes.',
    category: 'Genetic',
  },
  'pedigree': {
    label: 'Pedigree Builder',
    blurb: 'Interactive family-tree builder following standard pedigree notation for hereditary disease risk.',
    category: 'Genetic',
  },
  'variants': {
    label: 'Variant Database (ACMG)',
    blurb: 'Variant classification database with ACMG criteria annotation, ClinVar lookups, literature links.',
    category: 'Genetic',
  },
  'ngs-workflow': {
    label: 'NGS Workflow',
    blurb: 'Next-generation sequencing workflow — sample QC, library prep, run tracking, bioinformatics pipelines.',
    category: 'Genetic',
  },

  // ── Health checkup / corporate ────────────────────────────────────────
  'hra': {
    label: 'Health Risk Assessment',
    blurb: 'Digital HRA questionnaires, risk scoring, personalised health recommendations.',
    category: 'Preventive Health',
  },
  'consult-schedule': {
    label: 'Consult Schedule',
    blurb: 'Post-checkup consultation scheduling — auto-book follow-ups based on abnormal findings.',
    category: 'Preventive Health',
  },
  'camps': {
    label: 'Health Camps',
    blurb: 'Organise corporate health camps — venue planning, test menus, on-site staffing, consolidated reports.',
    category: 'Corporate',
  },
  'employer-portal': {
    label: 'Employer Portal',
    blurb: 'Employer-facing portal for corporate clients — employee test results, population-level insights.',
    category: 'Corporate',
  },
  'population-health': {
    label: 'Population Health',
    blurb: 'Cohort analytics across employer and insurance populations — risk stratification, trend dashboards.',
    category: 'Corporate',
  },

  // ── Reference lab / hub-spoke ─────────────────────────────────────────
  'partner-labs': {
    label: 'Partner Labs',
    blurb: 'Manage partner lab relationships — rate agreements, TAT commitments, sample transit tracking.',
    category: 'Network',
  },
  'hub-spoke': {
    label: 'Hub & Spoke Routing',
    blurb: 'Route tests to the appropriate hub or spoke lab based on test type, capacity, and TAT.',
    category: 'Network',
  },
  'franchise': {
    label: 'Franchise Labs',
    blurb: 'Franchise lab onboarding, branding consistency, revenue sharing, performance benchmarking.',
    category: 'Network',
  },

  // ── Histopathology ────────────────────────────────────────────────────
  'slide-scanning': {
    label: 'Slide Scanning',
    blurb: 'Whole-slide image scanning with digital pathology viewer for remote consultation.',
    category: 'Histopathology',
  },
  'ihc': {
    label: 'IHC Workflow',
    blurb: 'Immunohistochemistry request tracking — antibody panels, turnaround monitoring, reagent usage.',
    category: 'Histopathology',
  },
  'frozen-section': {
    label: 'Frozen Section',
    blurb: 'Intra-operative frozen-section reporting with rapid turnaround targets and OT communication.',
    category: 'Histopathology',
  },

  // ── Microbiology ──────────────────────────────────────────────────────
  // NOTE: 'culture' graduated to a real page at app/diagnostic/culture/page.tsx
  // NOTE: 'antibiogram' graduated to a real page at app/diagnostic/antibiogram/page.tsx

  // ── Blood bank ────────────────────────────────────────────────────────
  // NOTE: 'donors' graduated to a real page at app/diagnostic/donors/page.tsx
  // NOTE: 'crossmatch' graduated to a real page at app/diagnostic/crossmatch/page.tsx
  'dghs-reporting': {
    label: 'DGHS Reporting',
    blurb: 'Mandatory Director General of Health Services reporting for blood bank operations.',
    category: 'Blood Bank',
  },

  // ── Nuclear medicine ──────────────────────────────────────────────────
  'barc': {
    label: 'BARC Reporting',
    blurb: 'Bhabha Atomic Research Centre compliance reporting — radioisotope inventory, waste disposal.',
    category: 'Nuclear Medicine',
  },

  // ── Mammography ───────────────────────────────────────────────────────
  'bi-rads': {
    label: 'BI-RADS Reports',
    blurb: 'Breast Imaging Reporting and Data System structured reporting (categories 0–6).',
    category: 'Mammography',
  },

  // ── DEXA ──────────────────────────────────────────────────────────────
  'frax': {
    label: 'FRAX Assessment',
    blurb: 'WHO fracture-risk algorithm — 10-year probability of hip and major osteoporotic fracture.',
    category: 'DEXA',
  },

  // ── Dental radiology ──────────────────────────────────────────────────
  'opg-cbct': {
    label: 'OPG / CBCT',
    blurb: 'Panoramic and cone-beam CT imaging workflow with dentist-ready report templates.',
    category: 'Dental',
  },

  // ── Ophthalmic imaging ────────────────────────────────────────────────
  'oct': {
    label: 'OCT Scans',
    blurb: 'Optical coherence tomography — retinal layer analysis for macula, glaucoma, anterior segment.',
    category: 'Ophthalmic',
  },
  'perimetry': {
    label: 'Perimetry',
    blurb: 'Visual field testing — Humphrey / Octopus integration, glaucoma progression tracking.',
    category: 'Ophthalmic',
  },
  'fundus-photo': {
    label: 'Fundus Photography',
    blurb: 'Retinal imaging with colour, red-free, FFA, ICG modes. DR / AMD screening support.',
    category: 'Ophthalmic',
  },

  // ── Physiological testing ─────────────────────────────────────────────
  'spirometry': {
    label: 'Spirometry',
    blurb: 'Spirometry with FEV1, FVC, FEV1/FVC ratio, bronchodilator reversibility, GOLD staging.',
    category: 'Pulmonary',
  },
  'waveforms': {
    label: 'Waveform Viewer',
    blurb: 'EEG / EMG / NCS waveform display with annotation, montage switching, frequency analysis.',
    category: 'Neurophysiology',
  },
  'allergen-panels': {
    label: 'Allergen Panels',
    blurb: 'Pre-built allergen panels (respiratory, food, drug) with result interpretation and patient summaries.',
    category: 'Allergy',
  },
  'immunotherapy': {
    label: 'Immunotherapy',
    blurb: 'Allergen-specific immunotherapy planning — dose escalation schedules, adherence tracking.',
    category: 'Allergy',
  },
  'psg': {
    label: 'Polysomnography',
    blurb: 'Overnight sleep study workflow — EEG / EOG / EMG / airflow / SpO2 capture and AASM scoring.',
    category: 'Sleep',
  },
  'cpap-titration': {
    label: 'CPAP Titration',
    blurb: 'CPAP pressure titration studies with leak tracking, AHI monitoring, therapy optimization.',
    category: 'Sleep',
  },
  'audiometry': {
    label: 'Audiometry',
    blurb: 'Pure-tone and speech audiometry with audiogram generation, hearing aid fitting support.',
    category: 'Audiology',
  },
  'bera': {
    label: 'BERA / OAE',
    blurb: 'Brainstem evoked response audiometry and otoacoustic emissions — newborn hearing screening.',
    category: 'Audiology',
  },
  'urodynamics': {
    label: 'Urodynamic Studies',
    blurb: 'Cystometrogram, pressure-flow studies, uroflowmetry, EMG with urogynecology report templates.',
    category: 'Urology',
  },
  'video-capture': {
    label: 'Video Capture',
    blurb: 'Endoscopy video capture with still-image annotation and DICOM-compatible archival.',
    category: 'Endoscopy',
  },
  'sedation-log': {
    label: 'Sedation Log',
    blurb: 'Pre / intra / post-procedure sedation monitoring — vitals, ASA class, recovery scoring.',
    category: 'Endoscopy',
  },

  // ── IVF / Embryology ──────────────────────────────────────────────────
  // NOTE: 'cycles' graduated to a real page at app/diagnostic/cycles/page.tsx
  'cryopreservation': {
    label: 'Cryopreservation',
    blurb: 'Embryo, oocyte, sperm cryobank — straw tracking, vitrification logs, thaw survival rates.',
    category: 'IVF',
  },
  'casa': {
    label: 'CASA (Andrology)',
    blurb: 'Computer-assisted semen analysis — motility, morphology, concentration per WHO guidelines.',
    category: 'IVF',
  },
  'art-act': {
    label: 'ART Act Register',
    blurb: 'Assisted Reproductive Technology Act 2021 mandatory national registry submissions.',
    category: 'IVF',
  },

  // ── Stem cell registry ────────────────────────────────────────────────
  'hla-typing': {
    label: 'HLA Typing',
    blurb: 'Human Leukocyte Antigen typing — high-resolution class I / II for transplant matching.',
    category: 'Stem Cell',
  },
  'wmda-sync': {
    label: 'WMDA Sync',
    blurb: 'World Marrow Donor Association registry synchronisation — search requests, match reports.',
    category: 'Stem Cell',
  },

  // ── Forensic / toxicology ─────────────────────────────────────────────
  // NOTE: 'chain-of-custody' graduated to a real page at app/diagnostic/chain-of-custody/page.tsx
  'gc-ms': {
    label: 'GC-MS / LC-MS',
    blurb: 'Gas / liquid chromatography-mass spectrometry workflow for drug-of-abuse and toxicology panels.',
    category: 'Forensic',
  },
  'cdsco-reports': {
    label: 'CDSCO Reports',
    blurb: 'Central Drugs Standard Control Organisation mandatory reporting for controlled substances.',
    category: 'Forensic',
  },

  // ── Cancer screening ──────────────────────────────────────────────────
  'tumor-markers': {
    label: 'Tumor Markers',
    blurb: 'Tumor marker panels (PSA, CA-125, CEA, AFP, CA-19-9) with trend charts and alert thresholds.',
    category: 'Cancer Screening',
  },
  'ai-scoring': {
    label: 'AI Risk Scoring',
    blurb: 'ML-based cancer risk stratification combining markers, imaging, family history, lifestyle.',
    category: 'Cancer Screening',
  },

  // ── DTC Genomics ──────────────────────────────────────────────────────
  'kits': {
    label: 'Kit Logistics',
    blurb: 'Saliva-kit ordering, shipping, tracking, return logistics for direct-to-consumer genomics.',
    category: 'DTC Genomics',
  },
  'dtc-portal': {
    label: 'DTC Consumer Portal',
    blurb: 'Customer-facing portal for DTC genomic results — ancestry, traits, pharmacogenomics, health risks.',
    category: 'DTC Genomics',
  },
};

export default function SubtypePlaceholderPage() {
  const params = useParams();
  const slugArr = (params?.slug as string[]) ?? [];
  const slug = slugArr.join('/');
  const topSlug = slugArr[0] ?? '';

  const feature = FEATURE_MAP[topSlug];

  // Not a known planned feature — likely a typo or deleted route.
  if (!feature) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mt-16 text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-slate-100 flex items-center justify-center">
            <span className="text-3xl text-slate-400">?</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Page not found</h1>
          <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
            We couldn&apos;t find anything at <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 text-xs">/diagnostic/{slug}</code>.
          </p>
          <Link
            href="/diagnostic/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D7C66] hover:bg-[#0A5E4F] text-white text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mt-8">
        {/* Category breadcrumb */}
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          {feature.category}
        </div>

        {/* Feature name + Coming Soon badge */}
        <div className="flex items-start gap-3 mb-4">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{feature.label}</h1>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wide">
            <Clock className="w-3 h-3" />
            Coming Soon
          </span>
        </div>

        {/* Blurb */}
        <p className="text-base text-slate-600 leading-relaxed mb-8 max-w-2xl">
          {feature.blurb}
        </p>

        {/* In-development panel */}
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#0D7C66]/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#0D7C66]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-2">We&apos;re building this</h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-3">
                This feature is part of the HospiBot roadmap for your subtype and will ship as a proper
                module soon. In the meantime, the core diagnostic portal (lab orders, results, billing,
                compliance, WhatsApp) is fully operational.
              </p>
              <p className="text-sm text-slate-500">
                Want this feature prioritised? Let us know — the loudest requests move to the top of the
                sprint plan.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link
            href="/diagnostic/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D7C66] hover:bg-[#0A5E4F] text-white text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </Link>
          <a
            href={`mailto:support@hospibot.com?subject=Feature request: ${feature.label}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-colors"
          >
            Request priority
          </a>
        </div>

        {/* Dev hint — show the slug for debugging. Hidden on production via opacity. */}
        <div className="mt-10 pt-5 border-t border-slate-100 text-xs text-slate-400 font-mono">
          Feature slug: {slug}
        </div>
      </div>
    </div>
  );
}
