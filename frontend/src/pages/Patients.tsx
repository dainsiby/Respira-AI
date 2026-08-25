import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Patients() {
    const { role } = useAuth();
    switch (role) {
        case 'SYSTEM_ADMIN':
            return <Navigate to="/admin/dashboard" replace />;
        case 'HOSPITAL_ADMIN':
            return <Navigate to="/hospital/patients" replace />;
        case 'DOCTOR':
            return <Navigate to="/doctor/patients" replace />;
        case 'CLINICAL_TECHNICIAN':
            return <Navigate to="/clinical/patients" replace />;
        default:
            return <Navigate to="/login" replace />;
    }
}

export default Patients;