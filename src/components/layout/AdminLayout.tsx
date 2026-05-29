import React from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LayoutDashboard, FileText, PlusCircle, LogOut } from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  if (!user || user.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Blogs', href: '/admin/blogs', icon: FileText },
    { name: 'Create Blog', href: '/admin/blogs/new', icon: PlusCircle },
  ];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-700">
          <Link to="/" className="text-xl font-bold text-primary">CMS Admin</Link>
        </div>
        <div className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  isActive
                    ? 'bg-blue-50 text-primary dark:bg-slate-700 dark:text-blue-400'
                    : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700'
                } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={logout}
            className="flex w-full items-center px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Admin Dashboard</h1>
          <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
            {user.email}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
