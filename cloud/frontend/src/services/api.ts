import axios from 'axios';
import {
  AuthResponse,
  LoginPayload,
  User,
  HospitalRegistry,
  CreateHospitalPayload,
  HospitalNode,
  CreateNodePayload,
  HospitalApplication,
  RegisterHospitalPayload,
  InstallerStatusResponse,
  HospitalProfileResponse,
  CloudDashboardMetrics,
  CloudAuditLog
} from '../types';

export const CLOUD_AUTH_TOKEN_KEY = 'respira_cloud_auth_token';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8002/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(CLOUD_AUTH_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem(CLOUD_AUTH_TOKEN_KEY);
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register-hospital') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/login/', payload);
    return res.data;
  },
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout/');
    } finally {
      localStorage.removeItem(CLOUD_AUTH_TOKEN_KEY);
    }
  },
  getCurrentUser: async (): Promise<User> => {
    const res = await api.get<{ user: User }>('/auth/me/');
    return res.data.user;
  },
};

export const hospitalOnboardingService = {
  registerHospital: async (payload: RegisterHospitalPayload): Promise<{ message: string; application_id: string; status: string; username: string }> => {
    const res = await api.post<{ message: string; application_id: string; status: string; username: string }>('/hospital-registration/', payload);
    return res.data;
  },
};

export const hospitalApplicationAdminService = {
  getApplications: async (): Promise<HospitalApplication[]> => {
    const res = await api.get<HospitalApplication[]>('/hospital-applications/');
    return res.data;
  },
  getApplicationDetail: async (id: number): Promise<HospitalApplication> => {
    const res = await api.get<HospitalApplication>(`/hospital-applications/${id}/`);
    return res.data;
  },
  approveApplication: async (id: number): Promise<{ message: string; hospital_code: string; application: HospitalApplication }> => {
    const res = await api.post<{ message: string; hospital_code: string; application: HospitalApplication }>(`/hospital-applications/${id}/approve/`);
    return res.data;
  },
  rejectApplication: async (id: number, rejection_reason: string): Promise<{ message: string; application: HospitalApplication }> => {
    const res = await api.post<{ message: string; application: HospitalApplication }>(`/hospital-applications/${id}/reject/`, { rejection_reason });
    return res.data;
  },
};

export const hospitalPortalService = {
  getProfile: async (): Promise<HospitalProfileResponse> => {
    const res = await api.get<HospitalProfileResponse>('/hospital-portal/profile/');
    return res.data;
  },
  getApplication: async (): Promise<HospitalApplication> => {
    const res = await api.get<HospitalApplication>('/hospital-portal/application/');
    return res.data;
  },
  getNodes: async (): Promise<HospitalNode[]> => {
    const res = await api.get<HospitalNode[]>('/hospital-portal/nodes/');
    return res.data;
  },
  getInstallerStatus: async (): Promise<InstallerStatusResponse> => {
    const res = await api.get<InstallerStatusResponse>('/hospital-portal/installer/');
    return res.data;
  },
};

export const dashboardService = {
  getMetrics: async (): Promise<CloudDashboardMetrics> => {
    const res = await api.get<CloudDashboardMetrics>('/dashboard/');
    return res.data;
  },
};

export const hospitalService = {
  getHospitals: async (): Promise<HospitalRegistry[]> => {
    const res = await api.get<HospitalRegistry[]>('/hospitals/');
    return res.data;
  },
  createHospital: async (payload: CreateHospitalPayload): Promise<HospitalRegistry> => {
    const res = await api.post<HospitalRegistry>('/hospitals/', payload);
    return res.data;
  },
  updateHospital: async (id: number, payload: Partial<HospitalRegistry>): Promise<HospitalRegistry> => {
    const res = await api.patch<HospitalRegistry>(`/hospitals/${id}/`, payload);
    return res.data;
  },
};

export const nodeService = {
  getNodes: async (): Promise<HospitalNode[]> => {
    const res = await api.get<HospitalNode[]>('/nodes/');
    return res.data;
  },
  createNode: async (payload: CreateNodePayload): Promise<HospitalNode> => {
    const res = await api.post<HospitalNode>('/nodes/', payload);
    return res.data;
  },
  updateNodeStatus: async (id: number, status: 'ONLINE' | 'OFFLINE' | 'DISABLED'): Promise<HospitalNode> => {
    const res = await api.patch<HospitalNode>(`/nodes/${id}/`, { status });
    return res.data;
  },
};

export const auditService = {
  getAuditLogs: async (): Promise<CloudAuditLog[]> => {
    const res = await api.get<CloudAuditLog[]>('/audit-logs/');
    return res.data;
  },
};

export default api;
