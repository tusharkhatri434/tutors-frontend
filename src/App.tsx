import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Layouts
import { AdminLayout } from './components/layout/AdminLayout';

// Admin Pages
import { Login } from './pages/admin/Login';
import { Dashboard } from './pages/admin/Dashboard';
import { BlogsManager } from './pages/admin/BlogsManager';
import { CreateEditBlog } from './pages/admin/CreateEditBlog';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans transition-colors duration-200">
          <Routes>
            {/* Redirect Root to Admin */}
            <Route path="/" element={<Navigate to="/admin" replace />} />

            {/* Auth Route */}
            <Route path="/admin/login" element={<Login />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="blogs" element={<BlogsManager />} />
              <Route path="blogs/new" element={<CreateEditBlog />} />
              <Route path="blogs/edit/:id" element={<CreateEditBlog />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
