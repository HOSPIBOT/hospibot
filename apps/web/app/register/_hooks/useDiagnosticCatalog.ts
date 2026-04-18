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
  const [groups, setGroups] = useState<SubtypeGroup[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`${API_URL}/portal/families/diagnostic/groups`);
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

  return { groups, loading: groups === null, error };
}

/**
 * useDiagnosticSubtypes — fetch subtypes for a given group slug.
 * Returns an empty array on failure so the UI can show a clear empty state
 * rather than crashing.
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
        const res = await axios.get(`${API_URL}/portal/families/diagnostic/groups/${groupSlug}/subtypes`);
        const data = Array.isArray(res.data) ? res.data : [];
        if (!cancelled) setSubtypes(data);
      } catch (e: any) {
        if (!cancelled) { setSubtypes([]); setError(e?.message || 'Failed to load subtypes'); }
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
