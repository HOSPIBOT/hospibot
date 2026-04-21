/**
 * portal-types.ts
 * Shared types and API helpers for the portal system.
 */

import { api } from '../api';

export interface PortalTheme {
  primaryColor: string;
  primaryDark: string;
  primaryLight: string;
  accentColor: string;
  sidebarBg: string;
  loginBg: string;
  loginGradient: string;
}

export interface TenantSubType {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  featureFlags: Record<string, boolean>;
  regFields: Record<string, boolean>;
  sortOrder: number;
}

export interface PortalFamily {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  theme?: PortalTheme;
  subTypes: TenantSubType[];
}

export interface PlatformAssets {
  logoUrl: string;
  logoAlt: string;
  faviconUrl?: string;
  tagline: string;
}

export interface RegistrationContext {
  families: PortalFamily[];
  assets: PlatformAssets;
}

// ── Fallback themes (used when DB is not yet seeded) ──────────────────────────
export const FALLBACK_THEMES: Record<string, PortalTheme> = {
  clinical:   { primaryColor: '#0D7C66', primaryDark: '#065F46', primaryLight: '#ECFDF5', accentColor: '#F59E0B', sidebarBg: '#063A31', loginBg: '#0D7C66', loginGradient: '#065F46' },
  diagnostic: { primaryColor: '#1E3A5F', primaryDark: '#152A47', primaryLight: '#EFF6FF', accentColor: '#06B6D4', sidebarBg: '#0F1E33', loginBg: '#1E3A5F', loginGradient: '#152A47' },
  pharmacy:   { primaryColor: '#15803D', primaryDark: '#14532D', primaryLight: '#F0FDF4', accentColor: '#84CC16', sidebarBg: '#0D3B20', loginBg: '#15803D', loginGradient: '#14532D' },
  homecare:   { primaryColor: '#B45309', primaryDark: '#92400E', primaryLight: '#FFFBEB', accentColor: '#FB923C', sidebarBg: '#78350F', loginBg: '#B45309', loginGradient: '#92400E' },
  equipment:  { primaryColor: '#6D28D9', primaryDark: '#5B21B6', primaryLight: '#F5F3FF', accentColor: '#94A3B8', sidebarBg: '#4C1D95', loginBg: '#6D28D9', loginGradient: '#5B21B6' },
  wellness:   { primaryColor: '#BE185D', primaryDark: '#9D174D', primaryLight: '#FFF1F2', accentColor: '#EAB308', sidebarBg: '#881337', loginBg: '#BE185D', loginGradient: '#9D174D' },
  services:   { primaryColor: '#0369A1', primaryDark: '#0C4A6E', primaryLight: '#F0F9FF', accentColor: '#14B8A6', sidebarBg: '#0C4A6E', loginBg: '#0369A1', loginGradient: '#0C4A6E' },
};

export const PORTAL_LABELS: Record<string, string> = {
  clinical: 'Clinical Portal', diagnostic: 'Diagnostic Portal', pharmacy: 'Pharmacy Portal',
  homecare: 'Home Care Portal', equipment: 'Equipment Portal', wellness: 'Wellness Portal',
  services: 'Services Portal',
};

// ── API Calls ──────────────────────────────────────────────────────────────────

export const getRegistrationContext = (): Promise<RegistrationContext> =>
  api.get('/portal/registration-context').then(r => r.data);

export const getFamilyBySlug = (slug: string): Promise<PortalFamily> =>
  api.get(`/portal/families/${slug}`).then(r => r.data);

export const getThemeBySlug = (slug: string): Promise<PortalTheme> =>
  api.get(`/portal/families/${slug}/theme`).then(r => r.data);

export const getPlatformAssets = (): Promise<PlatformAssets> =>
  api.get('/portal/assets').then(r => r.data);

export const getSubType = (familySlug: string, subTypeSlug: string): Promise<TenantSubType> =>
  api.get(`/portal/families/${familySlug}/subtypes/${subTypeSlug}`).then(r => r.data);
