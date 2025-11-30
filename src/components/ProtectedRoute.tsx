import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const [isReady, setIsReady] = useState(false);

  // Wait a bit after loading completes to ensure profile state is fully updated
  useEffect(() => {
    if (!loading) {
      // Small delay to ensure profile state has propagated
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setIsReady(false);
    }
  }, [loading]);

  if (loading || !isReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is authenticated but profile is incomplete (no name or no dni), redirect to register
  if (!profile || !profile.name || !profile.dni) {
    return <Navigate to="/register" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
