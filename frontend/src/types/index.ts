export interface TestApiResponse {
    message: string;
}

export interface Patient {
    id: number;
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
}
