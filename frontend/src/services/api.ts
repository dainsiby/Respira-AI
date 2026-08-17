import axios from "axios";
import type { Patient, CreatePatientPayload, TestApiResponse } from "../types";


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

export const getTestStatus = async (): Promise<TestApiResponse> => {
    const response = await api.get<TestApiResponse>("/test/");
    return response.data;
};

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

export default api;