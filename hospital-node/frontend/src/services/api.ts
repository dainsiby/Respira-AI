import axios from 'axios';
import {
  AuthResponse,
  LoginPayload,
  User,
  UserCreatePayload,
  Patient,
  CreatePatientPayload,
  MedicalHistory,
  Appointment,
  XRayRequest,
  ImagingStudy,
  AuditLog
} from '../types';

export const AUTH_TOKEN_KEY = 'respira_hospital_auth_token';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
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
      localStorage.removeItem(AUTH_TOKEN_KEY);
      if (window.location.pathname !== '/login') {
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
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  },
  getCurrentUser: async (): Promise<User> => {
    const res = await api.get<{ user: User }>('/auth/me/');
    return res.data.user;
  },
};

export const userService = {
  getUsers: async (): Promise<User[]> => {
    const res = await api.get<User[]>('/users/');
    return res.data;
  },
  createUser: async (payload: UserCreatePayload): Promise<User> => {
    const res = await api.post<User>('/users/', payload);
    return res.data;
  },
  toggleActiveStatus: async (userId: number): Promise<{ message: string; user: User }> => {
    const res = await api.post<{ message: string; user: User }>(`/users/${userId}/toggle-active/`);
    return res.data;
  },
};

export const patientService = {
  getPatients: async (): Promise<Patient[]> => {
    const res = await api.get<Patient[]>('/patients/');
    return res.data;
  },
  getPatient: async (idOrPatientId: string | number): Promise<Patient> => {
    const res = await api.get<Patient>(`/patients/${idOrPatientId}/`);
    return res.data;
  },
  createPatient: async (payload: CreatePatientPayload): Promise<Patient> => {
    const res = await api.post<Patient>('/patients/', payload);
    return res.data;
  },
  updatePatient: async (idOrPatientId: string | number, payload: Partial<CreatePatientPayload>): Promise<Patient> => {
    const res = await api.patch<Patient>(`/patients/${idOrPatientId}/`, payload);
    return res.data;
  },
  deactivatePatient: async (idOrPatientId: string | number): Promise<void> => {
    await api.delete(`/patients/${idOrPatientId}/`);
  },
  getMedicalHistory: async (patientId: string | number): Promise<MedicalHistory[]> => {
    const res = await api.get<MedicalHistory[]>(`/patients/${patientId}/medical-history/`);
    return res.data;
  },
  addMedicalHistory: async (patientId: string | number, payload: { condition: string; notes?: string }): Promise<MedicalHistory> => {
    const res = await api.post<MedicalHistory>(`/patients/${patientId}/medical-history/`, payload);
    return res.data;
  },
};

export const appointmentService = {
  getAppointments: async (): Promise<Appointment[]> => {
    const res = await api.get<Appointment[]>('/appointments/');
    return res.data;
  },
  createAppointment: async (payload: { appointment_id?: string; patient: number; doctor: number; scheduled_at: string; reason: string; notes?: string }): Promise<Appointment> => {
    const res = await api.post<Appointment>('/appointments/', payload);
    return res.data;
  },
  updateAppointment: async (id: number, payload: Partial<Appointment>): Promise<Appointment> => {
    const res = await api.patch<Appointment>(`/appointments/${id}/`, payload);
    return res.data;
  },
};

export const xrayRequestService = {
  getXRayRequests: async (): Promise<XRayRequest[]> => {
    const res = await api.get<XRayRequest[]>('/xray-requests/');
    return res.data;
  },
  createXRayRequest: async (payload: { request_id?: string; patient: number; appointment?: number; clinical_indication: string; priority: 'ROUTINE' | 'URGENT' }): Promise<XRayRequest> => {
    const res = await api.post<XRayRequest>('/xray-requests/', payload);
    return res.data;
  },
  updateXRayRequest: async (id: number, payload: Partial<XRayRequest>): Promise<XRayRequest> => {
    const res = await api.patch<XRayRequest>(`/xray-requests/${id}/`, payload);
    return res.data;
  },
};

export const imagingStudyService = {
  getImagingStudies: async (params?: { patient?: string; status?: string }): Promise<ImagingStudy[]> => {
    const res = await api.get<ImagingStudy[]>('/imaging-studies/', { params });
    return res.data;
  },
  getImagingStudy: async (idOrStudyId: string | number): Promise<ImagingStudy> => {
    const res = await api.get<ImagingStudy>(`/imaging-studies/${idOrStudyId}/`);
    return res.data;
  },
};

export const auditService = {
  getAuditLogs: async (): Promise<AuditLog[]> => {
    const res = await api.get<AuditLog[]>('/audit-logs/');
    return res.data;
  },
};

export default api;
