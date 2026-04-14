/**
 * super-admin-api.ts
 * Typed API client for all Super Admin endpoints.
 * Uses the shared JWT token (hospibot_access_token) — SUPER_ADMIN role is
 * enforced server-side by the RolesGuard.
 */

import { api } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TenantStatus = 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'CANCELLED';
export type PlanType     = 'STARTER' | 'GROWTH' | 'ENTERPRISE';
export type TenantType   =
  | 'HOSPITAL' | 'CLINIC' | 'DOCTOR' | 'DIAGNOSTIC_CENTER'
  | 'IVF_CENTER' | 'PHARMACY' | 'HOME_HEALTHCARE' | 'EQUIPMENT_VENDOR';

export type UserRole =
  | 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'BRANCH_ADMIN' | 'DOCTOR'
  | 'RECEPTIONIST' | 'BILLING_STAFF' | 'MARKETING_USER'
  | 'LAB_TECHNICIAN' | 'PHARMACIST' | 'NURSE';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  type: TenantType;
  status: TenantStatus;
  plan: PlanType;
  email: string;
  phone: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  pincode?: string;
  waPhoneNumberId?: string;
  waBusinessId?: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    branches: number;
    patients: number;
    appointments: number;
    invoices?: number;
  };
  branches?: Branch[];
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  city?: string;
  state?: string;
  isActive: boolean;
  _count?: { users: number };
}

export interface PlatformUser {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  tenant?: { name: string; slug: string; plan: PlanType; city?: string };
}

export interface PlatformStats {
  tenants: { total: number; active: number; trial: number; suspended: number };
  users: number;
  patients: number;
  appointments: number;
  planDistribution: { plan: PlanType; count: number }[];
  typeDistribution: { type: TenantType; count: number }[];
  recentOnboarding: { createdAt: string; plan: PlanType }[];
}

export interface SystemHealth {
  status: string;
  timestamp: string;
  database: { status: string; latencyMs: number };
  platform: { tenants: number; users: number; patients: number };
  uptime: number;
  memory: { rss: number; heapUsed: number; heapTotal: number };
  nodeVersion: string;
}

export interface Pagination<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface PlatformSettings {
  trialDays: number;
  autoSuspendAfterDays: number;
  allowNewRegistrations: boolean;
  requireEmailVerification: boolean;
  maintenanceMode: boolean;
  supportEmail: string;
  alertEmailRecipients: string;
}

// ─── Platform Analytics ───────────────────────────────────────────────────────

export const getPlatformStats = (): Promise<PlatformStats> =>
  api.get('/super-admin/stats').then(r => r.data);

// ─── Tenant Management ────────────────────────────────────────────────────────

export interface TenantQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: TenantStatus | 'ALL';
  plan?: PlanType | 'ALL';
}

export const getAllTenants = (query: TenantQuery = {}): Promise<Pagination<Tenant>> => {
  const params = new URLSearchParams();
  if (query.page)                          params.set('page',   String(query.page));
  if (query.limit)                         params.set('limit',  String(query.limit));
  if (query.search)                        params.set('search', query.search);
  if (query.status && query.status !== 'ALL') params.set('status', query.status);
  if (query.plan   && query.plan   !== 'ALL') params.set('plan',   query.plan);
  return api.get(`/super-admin/tenants?${params}`).then(r => r.data);
};

export const getTenantById = (id: string): Promise<Tenant> =>
  api.get(`/super-admin/tenants/${id}`).then(r => r.data);

export const updateTenantStatus = (
  id: string,
  action: 'ACTIVATE' | 'SUSPEND' | 'CANCEL',
  reason?: string,
): Promise<Tenant> =>
  api.patch(`/super-admin/tenants/${id}/status`, { action, reason }).then(r => r.data);

export const updateTenantPlan = (id: string, plan: PlanType): Promise<Tenant> =>
  api.patch(`/super-admin/tenants/${id}/plan`, { plan }).then(r => r.data);

export const deleteTenant = (id: string): Promise<{ message: string }> =>
  api.delete(`/super-admin/tenants/${id}`).then(r => r.data);

// ─── Users ────────────────────────────────────────────────────────────────────

export interface UserQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

export const getAllUsers = (query: UserQuery = {}): Promise<Pagination<PlatformUser>> => {
  const params = new URLSearchParams();
  if (query.page)                              params.set('page',   String(query.page));
  if (query.limit)                             params.set('limit',  String(query.limit));
  if (query.search)                            params.set('search', query.search);
  if (query.role   && query.role   !== 'ALL')  params.set('role',   query.role);
  if (query.status && query.status !== 'ALL')  params.set('status', query.status);
  return api.get(`/super-admin/users?${params}`).then(r => r.data);
};

// ─── Announcements ────────────────────────────────────────────────────────────

export interface AnnouncementPayload {
  title: string;
  body: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'MAINTENANCE';
  audience?: string;
  scheduledAt?: string;
}

export const createAnnouncement = (payload: AnnouncementPayload) =>
  api.post('/super-admin/announcements', payload).then(r => r.data);

// ─── Platform Settings ────────────────────────────────────────────────────────

export const getPlatformSettings = (): Promise<PlatformSettings> =>
  api.get('/super-admin/settings').then(r => r.data);

export const updatePlatformSettings = (settings: Partial<PlatformSettings>) =>
  api.patch('/super-admin/settings', settings).then(r => r.data);

// ─── System Health ────────────────────────────────────────────────────────────

export const getSystemHealth = (): Promise<SystemHealth> =>
  api.get('/super-admin/health').then(r => r.data);

// ── Portal Families & Sub-Types ──────────────────────────────────────────────

export const getPortalFamilies = () =>
  api.get('/portal/families?includeInactive=true').then(r => Array.isArray(r.data) ? r.data : (r.data?.data ?? []));

export const getPortalSubTypes = (familyId?: string) => {
  const url = familyId ? `/portal/subtypes?familyId=${familyId}` : '/portal/subtypes';
  return api.get(url).then(r => Array.isArray(r.data) ? r.data : (r.data?.data ?? []));
};

export const getPortalThemes = () =>
  api.get('/portal/themes').then(r => Array.isArray(r.data) ? r.data : (r.data?.data ?? []));

export const getAnnouncements = (page = 1, limit = 20) =>
  api.get(`/super-admin/announcements?page=${page}&limit=${limit}`).then(r => r.data);
