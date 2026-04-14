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
    // Persist portalSlug so logout can redirect correctly even after state reset
    localStorage.setItem('hospibot_portal_slug', portalSlug);
    // Also write to cookie so Next.js middleware can read it server-side
    if (typeof document !== 'undefined') {
      document.cookie = `hospibot_token=${accessToken}; path=/; max-age=3600; SameSite=Lax`;
    }

    set({ user, tenant, isAuthenticated: true, featureFlags: flags, portalSlug });
  },

  logout: () => {
    // Read role and portalSlug BEFORE clearing — determines where to redirect
    const { user, portalSlug } = get();
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';
    // Fallback: read from localStorage in case Zustand state was already wiped
    const storedSlug = typeof window !== 'undefined'
      ? localStorage.getItem('hospibot_portal_slug') ?? 'clinical'
      : 'clinical';
    const redirectSlug = portalSlug !== 'clinical' ? portalSlug : storedSlug;

    ['hospibot_access_token','hospibot_refresh_token','hospibot_user',
     'hospibot_tenant','hospibot_portal_slug'].forEach(k => localStorage.removeItem(k));
    // Clear auth cookie
    if (typeof document !== 'undefined') {
      document.cookie = 'hospibot_token=; path=/; max-age=0';
    }
    set({ user: null, tenant: null, isAuthenticated: false, featureFlags: {}, portalSlug: 'clinical' });

    // Redirect to the correct portal login page
    window.location.href = isSuperAdmin ? '/auth/login' : `/${redirectSlug}/login`;
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
        const slug   = tenant?.portalFamily?.slug
          ?? localStorage.getItem('hospibot_portal_slug')
          ?? 'clinical';
        // Keep stored slug in sync for logout redirect
        localStorage.setItem('hospibot_portal_slug', slug);
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
