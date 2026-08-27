export type Role = 'HOSPITAL_ADMIN' | 'DOCTOR' | 'CLINICAL_TECHNICIAN';

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

export interface UserCreatePayload {
    username: string;
    email?: string;
    password: string;
    first_name?: string;
    last_name?: string;
    role: Role;
}

export interface Patient {
    id: number;
    patient_id: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    gender: 'M' | 'F' | 'Other';
    phone?: string;
    email?: string;
    address?: string;
    is_active: boolean;
    created_by_username?: string;
    created_at: string;
    updated_at?: string;
}

export interface CreatePatientPayload {
    patient_id: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    gender: 'M' | 'F' | 'Other';
    phone?: string;
    email?: string;
    address?: string;
}

export interface MedicalHistory {
    id: number;
    patient: number;
    condition: string;
    notes?: string;
    recorded_by_username?: string;
    recorded_at: string;
    updated_at?: string;
}

export interface Appointment {
    id: number;
    appointment_id: string;
    patient: number;
    patient_name?: string;
    doctor: number;
    doctor_username?: string;
    scheduled_at: string;
    reason: string;
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    notes?: string;
    created_at: string;
    updated_at?: string;
}

export interface XRayRequest {
    id: number;
    request_id: string;
    patient: number;
    patient_name?: string;
    appointment?: number | null;
    requested_by_username?: string;
    assigned_technician?: number | null;
    assigned_technician_username?: string;
    clinical_indication: string;
    priority: 'ROUTINE' | 'URGENT';
    status: 'REQUESTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'ACQUIRED' | 'CANCELLED';
    requested_at: string;
    updated_at?: string;
}

export interface ImagingStudy {
    id: number;
    study_id: string;
    patient: number;
    patient_name?: string;
    xray_request?: number | null;
    xray_request_id?: string;
    file_path: string;
    original_filename: string;
    file_format: string;
    study_instance_uid?: string;
    series_instance_uid?: string;
    sop_instance_uid?: string;
    modality: string;
    body_part: string;
    status: 'INGESTING' | 'READY_FOR_AI' | 'AI_PROCESSING' | 'AI_COMPLETED' | 'AI_FAILED' | 'QUARANTINED';
    acquired_at?: string;
    ingested_at: string;
    created_at: string;
    updated_at?: string;
}

export interface AuditLog {
    id: number;
    user?: number | null;
    username: string;
    action: string;
    target_repr?: string;
    details: string;
    timestamp: string;
}
