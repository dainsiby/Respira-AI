import axios from "axios";
import type {
    Patient,
    CreatePatientPayload,
    User,
    AuthResponse,
    LoginPayload,
    RegisterPayload,
    UserCreatePayload,
    Hospital,
    ImagingStudy,
    AuditLog,
    DashboardMetrics,
} from "../types";


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

let authToken: string | null = localStorage.getItem("respira_auth_token");

export const setAuthToken = (token: string | null) => {
    authToken = token;
    if (token) {
        localStorage.setItem("respira_auth_token", token);
    } else {
        localStorage.removeItem("respira_auth_token");
    }
};

export const getStoredAuthToken = (): string | null => {
    return authToken || localStorage.getItem("respira_auth_token");
};

api.interceptors.request.use((config) => {
    const token = getStoredAuthToken();
    if (token) {
        config.headers.Authorization = `Token ${token}`;
    }
    return config;
});

// Authentication services
export const loginUser = async (payload: LoginPayload): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/login/", payload);
    if (response.data.token) {
        setAuthToken(response.data.token);
    }
    return response.data;
};

export const registerUser = async (payload: RegisterPayload): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/register/", payload);
    if (response.data.token) {
        setAuthToken(response.data.token);
    }
    return response.data;
};

export const logoutUser = async (): Promise<void> => {
    try {
        await api.post("/auth/logout/");
    } catch {
        // Continue clearing local state even if token invalid
    } finally {
        setAuthToken(null);
    }
};

export const getMe = async (): Promise<User> => {
    const response = await api.get<{ user: User }>("/auth/me/");
    return response.data.user;
};

// Dashboard metrics
export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
    const response = await api.get<DashboardMetrics>("/dashboard/");
    return response.data;
};

// Patient management
export const getPatients = async (): Promise<Patient[]> => {
    const response = await api.get<Patient[]>("/patients/");
    return response.data;
};

export const getPatientById = async (id: string | number): Promise<Patient> => {
    const response = await api.get<Patient>(`/patients/${id}/`);
    return response.data;
};

export const createPatient = async (payload: CreatePatientPayload): Promise<Patient> => {
    const response = await api.post<Patient>("/patients/", payload);
    return response.data;
};

// Hospital management (System Admin)
export const getHospitals = async (): Promise<Hospital[]> => {
    const response = await api.get<Hospital[]>("/hospitals/");
    return response.data;
};

export const createHospital = async (payload: Partial<Hospital>): Promise<Hospital> => {
    const response = await api.post<Hospital>("/hospitals/", payload);
    return response.data;
};

export const updateHospital = async (id: number, payload: Partial<Hospital>): Promise<Hospital> => {
    const response = await api.patch<Hospital>(`/hospitals/${id}/`, payload);
    return response.data;
};

// User / Staff management (System & Hospital Admin)
export const getUsers = async (): Promise<User[]> => {
    const response = await api.get<User[]>("/users/");
    return response.data;
};

export const createUser = async (payload: UserCreatePayload): Promise<User> => {
    const response = await api.post<User>("/users/", payload);
    return response.data;
};

export const toggleUserActive = async (userId: number): Promise<{ message: string; user: User }> => {
    const response = await api.post<{ message: string; user: User }>(`/users/${userId}/toggle-active/`);
    return response.data;
};

// Imaging study workflow
export const getImagingStudies = async (): Promise<ImagingStudy[]> => {
    const response = await api.get<ImagingStudy[]>("/imaging/");
    return response.data;
};

export const createImagingStudy = async (payload: { patient: number; modality?: string; body_part?: string }): Promise<ImagingStudy> => {
    const response = await api.post<ImagingStudy>("/imaging/", payload);
    return response.data;
};

export const processImagingStudy = async (studyId: number, action: 'process' | 'review'): Promise<ImagingStudy> => {
    const response = await api.post<ImagingStudy>(`/imaging/${studyId}/`, { action });
    return response.data;
};

// Audit logs
export const getAuditLogs = async (): Promise<AuditLog[]> => {
    const response = await api.get<AuditLog[]>("/audit-logs/");
    return response.data;
};

export default api;