import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '../context/AuthContext';

export function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: UserRole[] }) {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const location = useLocation();
  if (isLoading) return <div style={{ display:'flex', justifyContent:'center', marginTop:80 }}>Завантаження...</div>;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !hasRole(...roles)) return <Navigate to="/forbidden" replace />;
  return <>{children}</>;
}
