'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export interface SubtypeGroup {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  sortOrder: number;
  subtypeCount: number;
}

export interface SubtypeCard {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  subtypeTagline: string | null;
  volumeHint: string | null;
  sortOrder: number;
}

/**
 * useDiagnosticGroups — fetch the 7 operational groups for the registration
 * group-picker step. If the API returns empty (e.g. brief window after a deploy
 * before the seed has run), we fall back to a hardcoded list so the wizard
 * still works — the UI never dead-ends on a transient backend state.
 */
export function useDiagnosticGroups() {
  const [groups, setGroups] = useState<SubtypeGroup[] | null>(HARDCODED_FALLBACK);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`${API_URL}/portal/families/diagnostic/groups`, { timeout: 3000 });
        const data = Array.isArray(res.data) ? res.data : [];
        if (!cancelled) setGroups(data.length > 0 ? data : HARDCODED_FALLBACK);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || 'Failed to load groups');
          setGroups(HARDCODED_FALLBACK);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { groups, loading: false, error };
}

/**
 * useDiagnosticSubtypes — fetch subtypes for a given group slug.
 * On API failure, falls back to the hardcoded catalog (mirrors the DB seed)
 * so the wizard never dead-ends on a transient backend issue.
 */
export function useDiagnosticSubtypes(groupSlug: string | null) {
  const [subtypes, setSubtypes] = useState<SubtypeCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupSlug) { setSubtypes([]); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await axios.get(`${API_URL}/portal/families/diagnostic/groups/${groupSlug}/subtypes`, { timeout: 3000 });
        const data = Array.isArray(res.data) ? res.data : [];
        if (!cancelled) {
          setSubtypes(data.length > 0 ? data : (SUBTYPE_FALLBACK[groupSlug] ?? []));
        }
      } catch (e: any) {
        // API didn't respond with a usable answer — fall back to the hardcoded
        // catalog so users can still complete registration. The final submit
        // to /auth/register validates the slug server-side anyway.
        if (!cancelled) {
          setSubtypes(SUBTYPE_FALLBACK[groupSlug] ?? []);
          // Only surface the error if we also have no fallback for this group
          if (!SUBTYPE_FALLBACK[groupSlug]) {
            setError(e?.message || 'Failed to load subtypes');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [groupSlug]);

  return { subtypes, loading, error };
}

/** Fallback list used only if the API returns empty. Kept identical to the seed. */
const HARDCODED_FALLBACK: SubtypeGroup[] = [
  { id: 'fb-1', slug: 'collection',    name: 'Collection & Logistics',
    description: 'Sample pickup centers, pickup points, and home collection services.',
    icon: 'Droplet', sortOrder: 1, subtypeCount: 3 },
  { id: 'fb-2', slug: 'pathology',     name: 'Pathology & Lab Testing',
    description: 'In-house blood tests, cultures, biopsies, PCR, genetics, blood banks.',
    icon: 'TestTube', sortOrder: 2, subtypeCount: 6 },
  { id: 'fb-3', slug: 'imaging',       name: 'Imaging & Scans',
    description: 'X-Ray, CT, MRI, USG, PET, nuclear medicine, mammography, DEXA, dental, ophthalmic.',
    icon: 'ScanLine', sortOrder: 3, subtypeCount: 8 },
  { id: 'fb-4', slug: 'physiological', name: 'Physiological Testing',
    description: 'Cardiac, pulmonary, neuro, sleep, audiology, endoscopy — body-function studies.',
    icon: 'Activity', sortOrder: 4, subtypeCount: 8 },
  { id: 'fb-5', slug: 'packages',      name: 'Health Packages',
    description: 'Preventive checkup packages and corporate wellness screening.',
    icon: 'ClipboardCheck', sortOrder: 5, subtypeCount: 2 },
  { id: 'fb-6', slug: 'specialty',     name: 'Specialty & Advanced',
    description: 'IVF, stem cell registry, forensic testing, AI-powered cancer screening.',
    icon: 'Sparkles', sortOrder: 6, subtypeCount: 4 },
  { id: 'fb-7', slug: 'hub-digital',   name: 'Hubs & Digital',
    description: 'Reference labs, tele-radiology reporting, direct-to-consumer genomics platforms.',
    icon: 'Network', sortOrder: 7, subtypeCount: 3 },
];

/**
 * SUBTYPE_FALLBACK — the complete 34-subtype catalog, keyed by group slug.
 *
 * Mirrors the DB seed exactly so the wizard can function even if:
 *   - Railway hasn't finished deploying the new /subtypes endpoint
 *   - `prisma db seed` hasn't run against Supabase yet
 *   - The API is temporarily unreachable
 *
 * Slugs here are the DB-canonical slugs. The final /auth/register call
 * validates them server-side, so a stale fallback would fail loudly rather
 * than silently create a broken tenant.
 */
const SUBTYPE_FALLBACK: Record<string, SubtypeCard[]> = {
  collection: [
    { id: 'c1', slug: 'sample-collection-center', name: 'Sample Collection Center (PSC)', icon: 'Droplet', sortOrder: 10,
      subtypeTagline: 'Walk-in collection center that dispatches samples to a parent lab for processing.',
      volumeHint: '30–500 samples/day' },
    { id: 'c2', slug: 'pickup-point', name: 'Pickup Point (PUP)', icon: 'MapPin', sortOrder: 11,
      subtypeTagline: 'Counter inside a pharmacy or clinic where patients hand over samples.',
      volumeHint: '5–50 samples/day' },
    { id: 'c3', slug: 'home-sample-collection', name: 'Home Sample Collection Service', icon: 'Home', sortOrder: 12,
      subtypeTagline: 'Phlebotomist teams visit patient homes at booked time slots with cold-chain transport.',
      volumeHint: '10–500 bookings/day' },
  ],
  pathology: [
    { id: 'p1', slug: 'pathology-lab', name: 'Clinical Pathology Lab', icon: 'TestTube', sortOrder: 20,
      subtypeTagline: 'Biochemistry, haematology, serology — CBC, LFT, KFT, thyroid, lipid, HbA1c.',
      volumeHint: '20–1000+ patients/day' },
    { id: 'p2', slug: 'histopathology-lab', name: 'Histopathology & Cytopathology Lab', icon: 'Microscope', sortOrder: 21,
      subtypeTagline: 'Tissue biopsies, IHC, FNAC, Pap smears, frozen sections for oncology.',
      volumeHint: '5–200 specimens/day' },
    { id: 'p3', slug: 'molecular-lab', name: 'Molecular Diagnostics / PCR Lab', icon: 'Dna', sortOrder: 22,
      subtypeTagline: 'RT-PCR, viral load quantification, HPV genotyping, NGS panels.',
      volumeHint: '20–500 samples/day' },
    { id: 'p4', slug: 'micro-lab', name: 'Microbiological Laboratory', icon: 'Bug', sortOrder: 23,
      subtypeTagline: 'Culture, sensitivity, antibiogram, AMR reporting.',
      volumeHint: '10–400 cultures/day' },
    { id: 'p5', slug: 'genetic-lab', name: 'Clinical Genetic Testing Laboratory', icon: 'Sparkles', sortOrder: 24,
      subtypeTagline: 'Karyotype, BRCA, NIPT, newborn screen, ACMG variant reporting with counselling.',
      volumeHint: '2–200 tests/day' },
    { id: 'p6', slug: 'blood-bank', name: 'Blood Bank & Transfusion Center', icon: 'Droplets', sortOrder: 25,
      subtypeTagline: 'Blood collection, component separation, cross-match, transfusion dispatch.',
      volumeHint: '10–500 units/day' },
  ],
  imaging: [
    { id: 'i1', slug: 'radiology-center', name: 'Radiology Center (X-Ray, CT, MRI)', icon: 'ScanLine', sortOrder: 30,
      subtypeTagline: 'X-Ray, CT, MRI, fluoroscopy with DICOM viewer and AERB dose register.',
      volumeHint: '20–300+ scans/day' },
    { id: 'i2', slug: 'ultrasound-center', name: 'Ultrasound Center', icon: 'Activity', sortOrder: 31,
      subtypeTagline: 'USG, Doppler, 3D/4D — includes mandatory PC-PNDT Form F compliance.',
      volumeHint: '15–200 scans/day' },
    { id: 'i3', slug: 'pet-scan-center', name: 'PET Scan Center', icon: 'Target', sortOrder: 32,
      subtypeTagline: 'PET-CT, PET-MRI oncology imaging with radiopharmacy tracer log.',
      volumeHint: '3–50 scans/day' },
    { id: 'i4', slug: 'nuclear-medicine-center', name: 'Nuclear Medicine Center', icon: 'Atom', sortOrder: 33,
      subtypeTagline: 'SPECT, gamma camera, thyroid uptake, radioisotope therapy.',
      volumeHint: '3–40 scans/day' },
    { id: 'i5', slug: 'mammography-center', name: 'Mammography Center', icon: 'Shield', sortOrder: 34,
      subtypeTagline: 'Screening and diagnostic mammography with BI-RADS reporting. Female radiographer mandatory.',
      volumeHint: '10–80 scans/day' },
    { id: 'i6', slug: 'dexa-center', name: 'DEXA / Bone Density Center', icon: 'Bone', sortOrder: 35,
      subtypeTagline: 'Bone mineral density scans, body composition, fracture-risk (FRAX) assessment.',
      volumeHint: '5–80 scans/day' },
    { id: 'i7', slug: 'dental-radiology-center', name: 'Dental Radiology Center', icon: 'Smile', sortOrder: 36,
      subtypeTagline: 'OPG panoramic, CBCT 3D, intraoral imaging with dentist collaboration tools.',
      volumeHint: '20–200 scans/day' },
    { id: 'i8', slug: 'ophthalmic-center', name: 'Ophthalmic Diagnostic Imaging Center', icon: 'Eye', sortOrder: 37,
      subtypeTagline: 'OCT, perimetry, fundus photography, ERG, IOLMaster for retina and glaucoma.',
      volumeHint: '10–120 patients/day' },
  ],
  physiological: [
    { id: 'ph1', slug: 'cardiac-diagnostics', name: 'Cardiac Diagnostics Center', icon: 'Heart', sortOrder: 40,
      subtypeTagline: 'ECG, 2D Echo, TMT, Holter, ABPM with cardiologist review workflow.',
      volumeHint: '25–300+ patients/day' },
    { id: 'ph2', slug: 'pft-center', name: 'Pulmonary Function Testing (PFT) Center', icon: 'Wind', sortOrder: 41,
      subtypeTagline: 'Spirometry, DLCO, FeNO, ABG, body plethysmography.',
      volumeHint: '5–80 patients/day' },
    { id: 'ph3', slug: 'neurophysiology-center', name: 'Neurophysiology (EEG/EMG) Center', icon: 'Brain', sortOrder: 42,
      subtypeTagline: 'EEG, EMG, NCS, evoked potentials with waveform capture and neurologist review.',
      volumeHint: '3–60 studies/day' },
    { id: 'ph4', slug: 'allergy-center', name: 'Allergy Testing Center', icon: 'Flower', sortOrder: 43,
      subtypeTagline: 'Skin prick, patch tests, challenge tests, allergen immunotherapy planning.',
      volumeHint: '5–80 patients/day' },
    { id: 'ph5', slug: 'sleep-lab', name: 'Sleep Lab / Polysomnography', icon: 'Moon', sortOrder: 44,
      subtypeTagline: 'Overnight polysomnography, CPAP titration, home sleep testing.',
      volumeHint: '2–30 studies/day' },
    { id: 'ph6', slug: 'audiology-center', name: 'Audiology & ENT Diagnostic Center', icon: 'Ear', sortOrder: 45,
      subtypeTagline: 'Audiometry, tympanometry, BERA, OAE, VNG for hearing and balance.',
      volumeHint: '10–120 patients/day' },
    { id: 'ph7', slug: 'urodynamics-center', name: 'Urodynamics Diagnostic Center', icon: 'Gauge', sortOrder: 46,
      subtypeTagline: 'Cystometry, uroflowmetry, pressure-flow studies for bladder dysfunction.',
      volumeHint: '2–30 studies/day' },
    { id: 'ph8', slug: 'endoscopy-center', name: 'Endoscopy Diagnostic Center', icon: 'Telescope', sortOrder: 47,
      subtypeTagline: 'Upper GI, colonoscopy, bronchoscopy with video capture and sedation tracking.',
      volumeHint: '5–60 procedures/day' },
  ],
  packages: [
    { id: 'pk1', slug: 'health-checkup', name: 'Health Checkup / Wellness Screening Center', icon: 'ClipboardCheck', sortOrder: 50,
      subtypeTagline: 'Comprehensive preventive checkup packages with annual recall and risk scoring.',
      volumeHint: '30–12,000 patients/month' },
    { id: 'pk2', slug: 'corporate-screening', name: 'Corporate Wellness Screening', icon: 'Briefcase', sortOrder: 51,
      subtypeTagline: 'B2B employee screening, camp management, employer dashboard, aggregate HR reports.',
      volumeHint: '50–15,000 employees/month' },
  ],
  specialty: [
    { id: 's1', slug: 'ivf-embryology', name: 'IVF / Embryology & Andrology Lab', icon: 'Baby', sortOrder: 60,
      subtypeTagline: 'Embryology, ICSI, cryopreservation, andrology — ART Act 2021 compliant.',
      volumeHint: '2–50 cycles/month' },
    { id: 's2', slug: 'stem-cell-registry', name: 'Stem Cell & HLA / Bone Marrow Registry', icon: 'Layers', sortOrder: 61,
      subtypeTagline: 'HLA typing, bone marrow donor registry, stem cell processing — WMDA workflow.',
      volumeHint: '5–100 specimens/day' },
    { id: 's3', slug: 'forensic-toxicology', name: 'Forensic / Drug Testing / Toxicology Lab', icon: 'Shield', sortOrder: 62,
      subtypeTagline: 'GC-MS/LC-MS based drug-of-abuse, doping, forensic samples with chain-of-custody.',
      volumeHint: '10–200 samples/day' },
    { id: 's4', slug: 'cancer-screening', name: 'Cancer Screening / Early Detection Center', icon: 'ShieldAlert', sortOrder: 63,
      subtypeTagline: 'AI-scored tumor marker panels + imaging + clinician review. NURA-style preventive model.',
      volumeHint: '10–200 screenings/day' },
  ],
  'hub-digital': [
    { id: 'h1', slug: 'reference-lab', name: 'Reference / Central Processing Lab', icon: 'Network', sortOrder: 70,
      subtypeTagline: 'Central hub processing samples from 20–100+ PSCs with franchise & revenue sharing.',
      volumeHint: '300–3,000+ samples/day' },
    { id: 'h2', slug: 'tele-radiology', name: 'Tele-Radiology Reporting Service', icon: 'Radio', sortOrder: 71,
      subtypeTagline: 'Remote DICOM reading for hospitals and centers with radiologist state-registration tracking.',
      volumeHint: '30–500 reports/day' },
    { id: 'h3', slug: 'dtc-genomics', name: 'Preventive Genomics / DTC Testing Platform', icon: 'Globe', sortOrder: 72,
      subtypeTagline: 'Direct-to-consumer saliva-kit genetic wellness, pharmacogenomics, ancestry.',
      volumeHint: '100–10,000 kits/month' },
  ],
};
