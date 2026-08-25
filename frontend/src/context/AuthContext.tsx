import React, { createContext, useContext, useEffect, useState } from "react";
import type { User, Role, Hospital, LoginPayload, RegisterPayload } from "../types";
import { loginUser, registerUser, logoutUser, getMe, getStoredAuthToken, setAuthToken } from "../services/api";

interface AuthContextType {
    user: User | null;
    token: string | null;
    role: Role | null;
    hospital: Hospital | null;
    loading: boolean;
    login: (payload: LoginPayload) => Promise<User>;
    register: (payload: RegisterPayload) => Promise<User>;
    logout: () => Promise<void>;
    isSystemAdmin: boolean;
    isHospitalAdmin: boolean;
    isDoctor: boolean;
    isTechnician: boolean;
    hasRole: (allowedRoles: Role[]) => boolean;
    getRoleDefaultRoute: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(getStoredAuthToken());
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const initAuth = async () => {
            const storedToken = getStoredAuthToken();
            if (storedToken) {
                try {
                    const userData = await getMe();
                    setUser(userData);
                    setToken(storedToken);
                } catch {
                    setAuthToken(null);
                    setToken(null);
                    setUser(null);
                }
            } else {
                setToken(null);
                setUser(null);
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (payload: LoginPayload): Promise<User> => {
        const response = await loginUser(payload);
        setToken(response.token);
        setUser(response.user);
        return response.user;
    };

    const register = async (payload: RegisterPayload): Promise<User> => {
        const response = await registerUser(payload);
        setToken(response.token);
        setUser(response.user);
        return response.user;
    };

    const logout = async () => {
        await logoutUser();
        setToken(null);
        setUser(null);
    };

    const role = user?.role || null;
    const hospital = user?.hospital || null;

    const isSystemAdmin = role === 'SYSTEM_ADMIN';
    const isHospitalAdmin = role === 'HOSPITAL_ADMIN';
    const isDoctor = role === 'DOCTOR';
    const isTechnician = role === 'CLINICAL_TECHNICIAN';

    const hasRole = (allowedRoles: Role[]): boolean => {
        if (!role) return false;
        return allowedRoles.includes(role);
    };

    const getRoleDefaultRoute = (): string => {
        switch (role) {
            case 'SYSTEM_ADMIN':
                return '/admin/dashboard';
            case 'HOSPITAL_ADMIN':
                return '/hospital/dashboard';
            case 'DOCTOR':
                return '/doctor/dashboard';
            case 'CLINICAL_TECHNICIAN':
                return '/clinical/dashboard';
            default:
                return '/login';
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                role,
                hospital,
                loading,
                login,
                register,
                logout,
                isSystemAdmin,
                isHospitalAdmin,
                isDoctor,
                isTechnician,
                hasRole,
                getRoleDefaultRoute,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
