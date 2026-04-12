import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  role: string;
  branchId?: string;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  type: string;
  status?: string;
  plan?: string;
}

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  setAuth: (user: User, tenant: Tenant, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tenant: null,
  isAuthenticated: false,

  setAuth: (user, tenant, accessToken, refreshToken) => {
    localStorage.setItem('hospibot_access_token', accessToken);
    localStorage.setItem('hospibot_refresh_token', refreshToken);
    localStorage.setItem('hospibot_user', JSON.stringify(user));
    localStorage.setItem('hospibot_tenant', JSON.stringify(tenant));
    set({ user, tenant, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('hospibot_access_token');
    localStorage.removeItem('hospibot_refresh_token');
    localStorage.removeItem('hospibot_user');
    localStorage.removeItem('hospibot_tenant');
    set({ user: null, tenant: null, isAuthenticated: false });
    window.location.href = '/auth/login';
  },

  loadFromStorage: () => {
    try {
      const token = localStorage.getItem('hospibot_access_token');
      const userStr = localStorage.getItem('hospibot_user');
      const tenantStr = localStorage.getItem('hospibot_tenant');

      if (token && userStr && tenantStr) {
        set({
          user: JSON.parse(userStr),
          tenant: JSON.parse(tenantStr),
          isAuthenticated: true,
        });
      }
    } catch {
      // Corrupted storage - clear everything
      localStorage.removeItem('hospibot_access_token');
      localStorage.removeItem('hospibot_refresh_token');
      localStorage.removeItem('hospibot_user');
      localStorage.removeItem('hospibot_tenant');
    }
  },
}));
