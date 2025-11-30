import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();

  // Show loading while auth state is being determined
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // No user = redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Profile is complete if it has name AND (dni OR patient_main linked)
  const isProfileComplete = profile && profile.name && (profile.dni || profile.patient_main);
  
  // If profile incomplete, redirect to registration
  if (!isProfileComplete) {
    return <Navigate to="/register" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
