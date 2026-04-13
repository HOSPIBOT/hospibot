import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = __DEV__
  ? 'http://localhost:4000/api/v1'
  : 'https://api.hospibot.ai/api/v1';

let accessToken: string | null = null;
let refreshToken: string | null = null;

export const setTokens = (access: string, refresh: string) => {
  accessToken  = access;
  refreshToken = refresh;
};

export const clearTokens = () => {
  accessToken  = null;
  refreshToken = null;
};

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Auto-attach token
api.interceptors.request.use(config => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  res => res,
  async error => {
    if (error.response?.status === 401 && refreshToken) {
      try {
        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        accessToken = res.data.accessToken;
        error.config.headers.Authorization = `Bearer ${accessToken}`;
        return api.request(error.config);
      } catch { clearTokens(); }
    }
    return Promise.reject(error);
  }
);

// ── API methods ────────────────────────────────────────────────────────────

export const AuthAPI = {
  login:   (email: string, password: string) => api.post('/auth/login', { email, password }),
  profile: ()                                 => api.get('/auth/profile'),
};

export const PatientsAPI = {
  list:   (params?: any) => api.get('/patients', { params }),
  get:    (id: string)   => api.get(`/patients/${id}`),
  create: (data: any)    => api.post('/patients', data),
  update: (id: string, data: any) => api.patch(`/patients/${id}`, data),
  lookup: (phone: string) => api.get(`/patients/lookup/phone/${phone}`),
};

export const AppointmentsAPI = {
  list:       (params?: any) => api.get('/appointments', { params }),
  get:        (id: string)   => api.get(`/appointments/${id}`),
  create:     (data: any)    => api.post('/appointments', data),
  updateStatus: (id: string, status: string) => api.put(`/appointments/${id}/status`, { status }),
  reschedule: (id: string, data: any) => api.post(`/appointments/${id}/reschedule`, data),
  queue:      (params?: any) => api.get('/appointments/queue', { params }),
};

export const DoctorsAPI = {
  list:  (params?: any) => api.get('/doctors', { params }),
  get:   (id: string)   => api.get(`/doctors/${id}`),
  slots: (id: string, date?: string) => api.get(`/doctors/${id}/slots`, { params: { date } }),
};

export const BillingAPI = {
  invoices:    (params?: any) => api.get('/billing/invoices', { params }),
  getInvoice:  (id: string)   => api.get(`/billing/invoices/${id}`),
  paymentLink: (id: string)   => api.post(`/billing/invoices/${id}/payment-link`),
  sendInvoice: (id: string)   => api.post(`/billing/invoices/${id}/send`),
};

export const WhatsAppAPI = {
  conversations: (params?: any) => api.get('/whatsapp/conversations', { params }),
  messages:      (id: string)   => api.get(`/whatsapp/conversations/${id}/messages`),
  send:          (to: string, message: string) => api.post('/whatsapp/send', { to, message }),
};

export const LabAPI = {
  orders:   (params?: any) => api.get('/lab/orders', { params }),
  deliver:  (id: string)   => api.post(`/lab/orders/${id}/deliver`),
};

export const AnalyticsAPI = {
  dashboard:    () => api.get('/analytics/dashboard'),
  revenue:      (params?: any) => api.get('/analytics/revenue/trend', { params }),
  topDoctors:   (params?: any) => api.get('/analytics/doctors/top', { params }),
  demographics: () => api.get('/analytics/patients/demographics'),
  whatsapp:     (params?: any) => api.get('/analytics/whatsapp', { params }),
  notifications:() => api.get('/analytics/notifications'),
};

export const BedsAPI = {
  dashboard: (params?: any) => api.get('/beds/dashboard', { params }),
  list:      (params?: any) => api.get('/beds', { params }),
  admit:     (id: string, data: any) => api.post(`/beds/${id}/admit`, data),
  discharge: (id: string, data: any) => api.post(`/beds/${id}/discharge`, data),
};

export const VaultAPI = {
  lookup:    (phone: string) => api.get(`/vault/lookup?phone=${phone}`),
  requestAccess: (data: any) => api.post('/vault/request-access', data),
  records:   (uhrId: string) => api.get(`/vault/records/${uhrId}`),
};

export default api;

export const SubscriptionAPI = {
  plans:          ()                           => api.get('/subscriptions/plans'),
  current:        ()                           => api.get('/subscriptions/current'),
  paymentLink:    (plan: string, returnUrl: string) => api.post('/subscriptions/payment-link', { plan, returnUrl }),
  subscribe:      (plan: string, email: string)     => api.post('/subscriptions/subscribe',    { plan, email }),
  cancel:         ()                           => api.post('/subscriptions/cancel'),
};
