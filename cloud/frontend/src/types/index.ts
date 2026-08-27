export type Role = 'SYSTEM_ADMIN' | 'HOSPITAL';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  role: Role;
  role_display: string;
  date_joined: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

export interface HospitalRegistry {
  id: number;
  hospital_code: string;
  name: string;
  city: string;
  country: string;
  is_active: boolean;
  node_count: number;
  registered_at: string;
  updated_at: string;
}

export interface CreateHospitalPayload {
  hospital_code: string;
  name: string;
  city?: string;
  country?: string;
}

export interface HospitalNode {
  id: number;
  node_id: string;
  hospital: number;
  hospital_code: string;
  hospital_name: string;
  status: 'ONLINE' | 'OFFLINE' | 'DISABLED';
  is_online_status: boolean;
  last_heartbeat: string | null;
  installed_version: string;
  registered_at: string;
  updated_at: string;
}

export interface CreateNodePayload {
  hospital: number;
  node_id: string;
  installed_version?: string;
  status?: 'ONLINE' | 'OFFLINE' | 'DISABLED';
}

export interface HospitalApplication {
  id: number;
  application_id: string;
  user: number;
  username: string;
  applicant_email: string;
  hospital_name: string;
  official_email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  contact_person: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: number | null;
  reviewed_by_username: string;
  rejection_reason: string;
  hospital_registry: number | null;
  hospital_code: string;
}

export interface RegisterHospitalPayload {
  username: string;
  password: string;
  hospital_name: string;
  official_email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  contact_person?: string;
}

export interface InstallerStatusResponse {
  eligible: boolean;
  available: boolean;
  message: string;
}

export interface HospitalProfileResponse {
  username: string;
  email: string;
  role: Role;
  has_application: boolean;
  application_status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NONE';
  hospital_code: string | null;
}

export interface CloudDashboardMetrics {
  registered_hospitals: number;
  active_hospitals: number;
  pending_applications?: number;
  total_nodes: number;
  online_nodes: number;
  offline_nodes: number;
  disabled_nodes: number;
  system_status: string;
}

export interface CloudAuditLog {
  id: number;
  actor: number | null;
  username: string;
  node: number | null;
  node_identifier: string;
  action: string;
  details: string;
  timestamp: string;
}
