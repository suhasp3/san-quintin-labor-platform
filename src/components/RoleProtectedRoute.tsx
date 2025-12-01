import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: ('worker' | 'grower' | 'admin')[];
}

export default function RoleProtectedRoute({ children, allowedRoles }: RoleProtectedRouteProps) {
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    console.error('Error getting auth context:', error);
    // Return a safe fallback instead of crashing
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <div className="text-red-600 text-lg font-semibold">⚠️ Authentication Error</div>
          <p className="text-muted-foreground">
            There was an issue loading your authentication. Please refresh the page.
          </p>
        </div>
      </div>
    );
  }
  
  const { user, userRole, loading } = authContext;
  const location = useLocation();

  // If Supabase is not configured, allow access but show a warning
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <div className="text-yellow-600 text-lg font-semibold">⚠️ Authentication Not Configured</div>
          <p className="text-muted-foreground">
            Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file to use this feature.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Save the current location so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!userRole || !allowedRoles.includes(userRole)) {
    // User doesn't have the required role, redirect to their default page
    let defaultPath = '/jobs';
    if (userRole === 'grower') {
      defaultPath = '/dashboard';
    } else if (userRole === 'admin') {
      defaultPath = '/admin';
    }
    
    return <Navigate to={defaultPath} replace />;
  }

  return <>{children}</>;
}

