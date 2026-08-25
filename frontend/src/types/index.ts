export type Role = 'SYSTEM_ADMIN' | 'HOSPITAL_ADMIN' | 'DOCTOR' | 'CLINICAL_TECHNICIAN';

export interface Hospital {
    id: number;
    hospital_id: string;
    name: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    phone?: string;
    email?: string;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
}

export interface User {
    id: number;
    username: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    is_active: boolean;
    is_active_status?: boolean;
    role: Role;
    role_display: string;
    hospital?: Hospital | null;
    date_joined?: string;
}

export interface AuthResponse {
    token: string;
    user: User;
    message?: string;
}

export interface LoginPayload {
    username: string;
    password: string;
}

export interface RegisterPayload {
    username: string;
    email?: string;
    password: string;
    first_name?: string;
    last_name?: string;
    role?: Role;
    hospital_id?: number | null;
}

export interface UserCreatePayload {
    username: string;
    email?: string;
    password: string;
    first_name?: string;
    last_name?: string;
    role: Role;
    hospital_id?: number | null;
}

export interface Patient {
    id: number;
    hospital?: number | null;
    hospital_name?: string;
    patient_id: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    gender: 'M' | 'F' | 'Other';
    created_at: string;
    updated_at: string;
}

export interface CreatePatientPayload {
    patient_id: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    gender: 'M' | 'F' | 'Other';
    hospital_id?: number | null;
}

export interface ImagingStudy {
    id: number;
    study_id: string;
    patient: number;
    patient_name: string;
    hospital: number;
    hospital_name: string;
    modality: string;
    body_part: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    findings_summary: string;
    confidence_score?: number | null;
    uploaded_by_username?: string;
    created_at: string;
    updated_at?: string;
}

export interface AuditLog {
    id: number;
    user?: number;
    username: string;
    hospital_name: string;
    action: string;
    details: string;
    timestamp: string;
}

export interface DashboardMetrics {
    role: Role;
    hospital_name?: string;
    // System Admin metrics
    total_hospitals?: number;
    active_hospitals?: number;
    total_users?: number;
    active_users?: number;
    total_patients?: number;
    system_status?: string;
    // Hospital Admin metrics
    doctors_count?: number;
    technicians_count?: number;
    pending_imaging?: number;
    completed_analyses?: number;
    // Doctor metrics
    assigned_patients?: number;
    pending_reviews?: number;
    completed_ai_analyses?: number;
    reports_ready?: number;
    clinical_alerts?: number;
    // Technician metrics
    pending_xray_requests?: number;
    processing_studies?: number;
    completed_studies?: number;
    total_hospital_patients?: number;
    recent_activity_count?: number;
}
