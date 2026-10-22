import React, { createContext, useContext, useState, useEffect } from 'react';
import { Employee } from '../../types';
import { authApi } from '../../services/authApi';

interface AuthContextType {
  user: Employee | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, employee: Employee) => void;
  logout: () => Promise<void>;
  isAdmin: boolean;
  hasRole: (roleName: string) => boolean;
  hasPermission: (module: string, action?: 'read' | 'write' | 'delete') => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<Employee | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const res = await authApi.getMe();
    if (res.success && res.data?.employee) {
      setUser(res.data.employee);
      localStorage.setItem('user', JSON.stringify(res.data.employee));
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await authApi.getMe();
          if (res.success && res.data?.employee) {
            setUser(res.data.employee);
            localStorage.setItem('user', JSON.stringify(res.data.employee));
          } else {
            // invalid token
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const handleLogin = (newToken: string, newEmployee: Employee) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newEmployee));
    setToken(newToken);
    setUser(newEmployee);
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // ignore network/logout failure
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      window.location.href = '/login';
    }
  };

  const isAdmin = ['ADMIN', 'SUPERADMIN', 'SUPER_ADMIN'].includes(user?.role?.name?.toUpperCase() ?? '') || user?.role_id === 1;

  const hasRole = (roleName: string) => {
    if (!user || !user.role) return false;
    return user.role.name.toUpperCase() === roleName.toUpperCase();
  };

  const hasPermission = (module: string, action: 'read' | 'write' | 'delete' = 'read') => {
    if (isAdmin) return true;
    let permissions = user?.role?.permissions;
    if (typeof permissions === 'string') {
      try {
        permissions = JSON.parse(permissions);
      } catch (error) {
        permissions = undefined;
      }
    }
    return Boolean((permissions as Record<string, any>)?.[module]?.[action]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login: handleLogin,
        logout: handleLogout,
        isAdmin,
        hasRole,
        hasPermission,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  };
  return context;
};
