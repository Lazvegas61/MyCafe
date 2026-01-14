// admin-ui/src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, requireAuth = true }) {
    const { user, loading } = useAuth();
    
    if (loading) {
        return (
            <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                background: "#f5e7d0",
                color: "#4b2e05",
                fontSize: "20px",
                fontWeight: "bold"
            }}>
                🔄 Yükleniyor...
            </div>
        );
    }
    
    if (requireAuth && !user) {
        return <Navigate to="/login" replace />;
    }
    
    if (!requireAuth && user) {
        return <Navigate to="/ana" replace />;
    }
    
    return children;
}