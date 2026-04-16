import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach JWT token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('hospibot_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor - handle 401 and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('hospibot_refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = res.data;

        localStorage.setItem('hospibot_access_token', accessToken);
        localStorage.setItem('hospibot_refresh_token', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch {
        // Refresh failed - force logout to the correct portal login page
        const TYPE_TO_SLUG: Record<string,string> = {
          HOSPITAL:'clinical', CLINIC:'clinical', DOCTOR:'clinical',
          DIAGNOSTIC_CENTER:'diagnostic', IVF_CENTER:'clinical',
          PHARMACY:'pharmacy', HOME_HEALTHCARE:'homecare', EQUIPMENT_VENDOR:'equipment',
        };
        const userStr = localStorage.getItem('hospibot_user');
        const tenantStr = localStorage.getItem('hospibot_tenant');
        const isSuperAdmin = userStr ? JSON.parse(userStr)?.role === 'SUPER_ADMIN' : false;
        const storedTenant = tenantStr ? JSON.parse(tenantStr) : null;
        const slug = storedTenant?.portalFamily?.slug
          ?? (storedTenant?.type ? TYPE_TO_SLUG[storedTenant.type] : null)
          ?? localStorage.getItem('hospibot_portal_slug')
          ?? 'diagnostic';
        ['hospibot_access_token','hospibot_refresh_token','hospibot_user',
         'hospibot_tenant','hospibot_portal_slug'].forEach(k => localStorage.removeItem(k));
        if (typeof document !== 'undefined') {
          document.cookie = 'hospibot_token=; path=/; max-age=0';
        }
        window.location.href = isSuperAdmin ? '/auth/login' : `/${slug}/login`;
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
