'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export interface TierFromApi {
  id: string;
  scope: string;
  tierKey: 'small' | 'medium' | 'large' | 'enterprise';
  displayName: string;
  tagline: string;
  priceMonthly: number | null;   // paise
  priceAnnual: number | null;    // paise
  currency: string;
  color: string;
  badge: string | null;
  dailyVolumeMin: number | null;
  dailyVolumeMax: number | null;
  branchesAllowed: number;
  staffAllowed: number;
  waMessagesPerMonth: number;
  smsPerMonth: number;
  storageGB: number;
  sortOrder: number;
}

/**
 * useResolvedTiers — fetch the 4 tier rows that apply to the current
 * (family, subtype) selection.
 *
 * Order of precedence resolved server-side: subtype > family > default.
 *
 * Falls back to a hardcoded list (mirroring the seed defaults) if the
 * API is unreachable so the wizard keeps working during deploys.
 */
export function useResolvedTiers(params: { familySlug?: string; subtypeSlug?: string | null }) {
  const [tiers, setTiers] = useState<TierFromApi[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const q = new URLSearchParams();
        if (params.familySlug) q.set('family', params.familySlug);
        if (params.subtypeSlug) q.set('subtype', params.subtypeSlug);
        const res = await axios.get(`${API_URL}/portal/tier-configs?${q.toString()}`);
        const data = Array.isArray(res.data) ? res.data : [];
        if (!cancelled) setTiers(data.length > 0 ? data : HARDCODED_TIERS);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || 'Failed to load tiers');
          setTiers(HARDCODED_TIERS);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [params.familySlug, params.subtypeSlug]);

  return { tiers, loading: tiers === null, error };
}

/**
 * Hardcoded fallback for the 4 default tiers — identical shape + values
 * to what the seed creates in DB. Used only when the API is unreachable.
 */
const HARDCODED_TIERS: TierFromApi[] = [
  {
    id: 'fb-small', scope: 'default', tierKey: 'small',
    displayName: 'Small Lab',
    tagline: 'Perfect for solo-run labs and PSCs just getting started',
    priceMonthly: 99900, priceAnnual: 999000,
    currency: 'INR', color: '#0369A1', badge: null,
    dailyVolumeMin: 1, dailyVolumeMax: 50,
    branchesAllowed: 1, staffAllowed: 3,
    waMessagesPerMonth: 2000, smsPerMonth: 500, storageGB: 10,
    sortOrder: 1,
  },
  {
    id: 'fb-medium', scope: 'default', tierKey: 'medium',
    displayName: 'Medium Lab',
    tagline: 'For growing diagnostic centers handling 50–200 samples/day',
    priceMonthly: 299900, priceAnnual: 2999000,
    currency: 'INR', color: '#0D7C66', badge: 'Most Popular',
    dailyVolumeMin: 50, dailyVolumeMax: 200,
    branchesAllowed: 3, staffAllowed: 15,
    waMessagesPerMonth: 10000, smsPerMonth: 2000, storageGB: 50,
    sortOrder: 2,
  },
  {
    id: 'fb-large', scope: 'default', tierKey: 'large',
    displayName: 'Large Lab',
    tagline: 'For city-level chains with NABL accreditation needs',
    priceMonthly: 799900, priceAnnual: 7999000,
    currency: 'INR', color: '#7C3AED', badge: null,
    dailyVolumeMin: 200, dailyVolumeMax: 1000,
    branchesAllowed: 10, staffAllowed: 50,
    waMessagesPerMonth: 50000, smsPerMonth: 10000, storageGB: 500,
    sortOrder: 3,
  },
  {
    id: 'fb-enterprise', scope: 'default', tierKey: 'enterprise',
    displayName: 'Enterprise',
    tagline: 'For reference labs, hospital networks, and franchise chains',
    priceMonthly: null, priceAnnual: null,
    currency: 'INR', color: '#1E293B', badge: 'Contact Sales',
    dailyVolumeMin: 1000, dailyVolumeMax: null,
    branchesAllowed: 9999, staffAllowed: 9999,
    waMessagesPerMonth: 999999, smsPerMonth: 999999, storageGB: 9999,
    sortOrder: 4,
  },
];
