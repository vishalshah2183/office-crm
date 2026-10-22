import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../../features/auth/pages/LoginPage';
import { SignupPage } from '../../features/auth/pages/SignupPage';
import { DashboardPage } from '../../features/dashboard/pages/DashboardPage';
import { EmployeeListPage } from '../../features/employees/pages/EmployeeListPage';
import { RoleListPage } from '../../features/roles/pages/RoleListPage';
import { FileListPage } from '../../features/files/pages/FileListPage';
import { CreateFilePage } from '../../features/files/pages/CreateFilePage';
import { FileDetailPage } from '../../features/files/pages/FileDetailPage';
import { ExpenseListPage } from '../../features/expenses/pages/ExpenseListPage';
import { ProtectedRoute } from '../../components/layout/ProtectedRoute';
import { AppLayout } from '../../components/layout/AppLayout';
import { PermissionRoute } from '../../components/layout/PermissionRoute';

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route element={<PermissionRoute module="dashboard" />}><Route path="/dashboard" element={<DashboardPage />} /></Route>
          <Route element={<PermissionRoute module="files" />}>
            <Route path="/files" element={<FileListPage />} />
            <Route path="/files/:fileId" element={<FileDetailPage />} />
          </Route>
          <Route element={<PermissionRoute module="files" action="write" />}><Route path="/files/new" element={<CreateFilePage />} /></Route>
          <Route element={<PermissionRoute module="employees" adminOnly />}><Route path="/employees" element={<EmployeeListPage />} /></Route>
          <Route element={<PermissionRoute module="roles" />}><Route path="/roles" element={<RoleListPage />} /></Route>
          <Route element={<PermissionRoute module="expenses" />}><Route path="/expenses" element={<ExpenseListPage />} /></Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
