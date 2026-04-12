import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const superAdminApi = axios.create({
  baseURL: `${API_URL}/super-admin`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach super admin JWT token
superAdminApi.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('hospibot_super_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401
superAdminApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('hospibot_super_token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(err);
  }
);

// ─── Typed API Methods ────────────────────────────────────────────────────────

export const superAdminService = {
  // Platform
  getStats: () => superAdminApi.get('/stats'),
  getHealth: () => superAdminApi.get('/health'),

  // Tenants
  getTenants: (params?: { page?: number; limit?: number; search?: string; status?: string; plan?: string }) =>
    superAdminApi.get('/tenants', { params }),
  getTenant: (id: string) => superAdminApi.get(`/tenants/${id}`),
  updateTenantStatus: (id: string, action: string, reason?: string) =>
    superAdminApi.patch(`/tenants/${id}/status`, { action, reason }),
  updateTenantPlan: (id: string, plan: string) =>
    superAdminApi.patch(`/tenants/${id}/plan`, { plan }),
  deleteTenant: (id: string) => superAdminApi.delete(`/tenants/${id}`),

  // Users
  getUsers: (params?: { page?: number; limit?: number; search?: string; role?: string; status?: string }) =>
    superAdminApi.get('/users', { params }),

  // Announcements
  createAnnouncement: (data: { title: string; body: string; type: string; audience?: string; scheduledAt?: Date }) =>
    superAdminApi.post('/announcements', data),

  // Settings
  getSettings: () => superAdminApi.get('/settings'),
  updateSettings: (data: Record<string, any>) => superAdminApi.patch('/settings', data),
};
