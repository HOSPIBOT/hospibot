import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  role: string;
  branchId?: string;
}

export interface PortalFamily {
  id: string;
  name: string;
  slug: string;
}

export interface SubType {
  id: string;
  name: string;
  slug: string;
  featureFlags: Record<string, boolean>;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  type: string;
  status?: string;
  plan?: string;
  logoUrl?: string;
  portalFamily?: PortalFamily | null;
  subType?: SubType | null;
  featureFlags?: Record<string, boolean>;
}

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  featureFlags: Record<string, boolean>;
  portalSlug: string;          // e.g. "clinical", "pharmacy"
  setAuth: (user: User, tenant: Tenant, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  loadFromStorage: () => void;
  hasFlag: (flag: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  tenant: null,
  isAuthenticated: false,
  featureFlags: {},
  portalSlug: 'clinical',

  setAuth: (user, tenant, accessToken, refreshToken) => {
    // tenant is null for SUPER_ADMIN — guard all tenant property access
    const flags = tenant?.featureFlags ?? tenant?.subType?.featureFlags ?? {};
    const portalSlug = tenant?.portalFamily?.slug ?? 'clinical';

    localStorage.setItem('hospibot_access_token', accessToken);
    localStorage.setItem('hospibot_refresh_token', refreshToken);
    localStorage.setItem('hospibot_user', JSON.stringify(user));
    localStorage.setItem('hospibot_tenant', JSON.stringify(tenant));
    // Also write to cookie so Next.js middleware can read it server-side
    if (typeof document !== 'undefined') {
      document.cookie = `hospibot_token=${accessToken}; path=/; max-age=3600; SameSite=Lax`;
    }

    set({ user, tenant, isAuthenticated: true, featureFlags: flags, portalSlug });
  },

  logout: () => {
    ['hospibot_access_token','hospibot_refresh_token','hospibot_user','hospibot_tenant'].forEach(k => localStorage.removeItem(k));
    set({ user: null, tenant: null, isAuthenticated: false, featureFlags: {}, portalSlug: 'clinical' });
    window.location.href = '/auth/login';
  },

  loadFromStorage: () => {
    try {
      const token   = localStorage.getItem('hospibot_access_token');
      const userStr = localStorage.getItem('hospibot_user');
      const tenantStr = localStorage.getItem('hospibot_tenant');
      if (token && userStr && tenantStr) {
        const tenant = JSON.parse(tenantStr) as Tenant | null;
        // tenant is null for SUPER_ADMIN — guard all property access
        const flags  = tenant?.featureFlags ?? tenant?.subType?.featureFlags ?? {};
        const slug   = tenant?.portalFamily?.slug ?? 'clinical';
        set({ user: JSON.parse(userStr), tenant, isAuthenticated: true, featureFlags: flags, portalSlug: slug });
      }
    } catch {
      ['hospibot_access_token','hospibot_refresh_token','hospibot_user','hospibot_tenant'].forEach(k => localStorage.removeItem(k));
    }
  },

  hasFlag: (flag: string) => {
    const flags = get().featureFlags;
    return flags[flag] === true;
  },
}));
