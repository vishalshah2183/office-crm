import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../app/providers/AuthContext';

interface HeaderProps {
  onOpenSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSidebar }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getPageTitle = (path: string) => {
    if (path.startsWith('/dashboard')) return 'Dashboard Overview';
    if (path.startsWith('/files/new')) return 'Create New File';
    if (path.startsWith('/files/')) return 'File Workspace';
    if (path.startsWith('/files')) return 'Office Files Directory';
    if (path.startsWith('/employees')) return 'Employee Directory';
    if (path.startsWith('/roles')) return 'Roles & Access';
    if (path.startsWith('/expenses')) return 'Office Expenses';
    return 'DEEP DESIGNING STUDIO';
  };

  return (
    <header className="h-16 bg-slate-900/80 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 md:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-sm font-bold text-slate-100 tracking-tight">
            {getPageTitle(location.pathname)}
          </h2>
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <span>Deep Designing Studio</span>
            <span>/</span>
            <span className="text-cyan-400 capitalize">
              {location.pathname.split('/')[1] || 'dashboard'}
            </span>
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
          <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-200 font-semibold">{user?.name}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">{user?.role?.name || user?.designation}</span>
        </div>

        <button
          onClick={logout}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
