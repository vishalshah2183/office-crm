import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthContext';

interface PermissionRouteProps {
  module: string;
  action?: 'read' | 'write' | 'delete';
  adminOnly?: boolean;
}

export const PermissionRoute: React.FC<PermissionRouteProps> = ({ module, action = 'read', adminOnly = false }) => {
  const { hasPermission, isAdmin } = useAuth();
  return (!adminOnly || isAdmin) && hasPermission(module, action) ? <Outlet /> : <Navigate to="/dashboard" replace />;
};