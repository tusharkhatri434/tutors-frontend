import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();

  return (
    <nav className="bg-white dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center text-xl font-bold text-primary">
              CMS Platform
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link to="/" className="border-transparent text-slate-500 dark:text-slate-300 hover:border-slate-300 hover:text-slate-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Home
              </Link>
              <Link to="/blogs" className="border-transparent text-slate-500 dark:text-slate-300 hover:border-slate-300 hover:text-slate-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Blogs
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-slate-700 dark:text-slate-300">Hello, {user.name}</span>
                {user.role === 'admin' && (
                  <Link to="/admin" className="text-sm font-medium text-primary hover:text-blue-700">
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="text-sm font-medium text-red-600 hover:text-red-500"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/admin/login" className="text-sm font-medium text-primary hover:text-blue-700">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
