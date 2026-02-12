import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';

interface ProtectedRouteByPermissionProps {
  children: ReactNode;
  permission: string;
}

export function ProtectedRouteByPermission({ children, permission }: ProtectedRouteByPermissionProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.role?.permissions.includes(permission)) {
    // Redirect to dashboard or show unauthorized page
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg max-w-md">
          <h2 className="text-xl font-bold text-red-800 mb-2">Akses Ditolak</h2>
          <p className="text-red-600">Anda tidak memiliki izin untuk mengakses halaman ini</p>
          <button 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => window.history.back()}
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}