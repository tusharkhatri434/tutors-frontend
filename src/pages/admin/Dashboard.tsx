import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Loader } from '../../components/ui/Loader';
import { FileText, Users, Eye } from 'lucide-react';

const fetchStats = async () => {
  const { data } = await api.get('/blogs?limit=1'); // just to get total count
  return data;
};

export const Dashboard: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: fetchStats,
  });

  if (isLoading) return <Loader />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full dark:bg-blue-900/50 dark:text-blue-400">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Blogs</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{data?.total || 0}</p>
          </div>
        </Card>
        
        {/* Placeholder stats */}
        <Card className="p-6 flex items-center space-x-4 opacity-75">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full dark:bg-emerald-900/50 dark:text-emerald-400">
            <Eye size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Views</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">--</p>
          </div>
        </Card>
        
        <Card className="p-6 flex items-center space-x-4 opacity-75">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-full dark:bg-purple-900/50 dark:text-purple-400">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Users</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">1</p>
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="flex space-x-4">
          <Link
            to="/admin/blogs/new"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Create New Blog
          </Link>
          <Link
            to="/admin/blogs"
            className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700"
          >
            Manage Blogs
          </Link>
        </div>
      </div>
    </div>
  );
};
