import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Users, Box, LogOut, LayoutDashboard, Activity, Server, Folder, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';

const AdminLayout: React.FC = () => {
  const { t } = useTranslation();
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-full">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-blue-600" />
            Admin Console
          </h1>
        </div>
        
        <nav className="px-4 space-y-1">
          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Users className="w-5 h-5" />
            {t('admin.nav.users')}
          </NavLink>
          
          <NavLink
            to="/admin/models"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Box className="w-5 h-5" />
            {t('admin.nav.models')}
          </NavLink>

          <NavLink
            to="/admin/providers"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Server className="w-5 h-5" />
            {t('admin.nav.providers')}
          </NavLink>

          <NavLink
            to="/admin/projects"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Folder className="w-5 h-5" />
            {t('admin.nav.projects')}
          </NavLink>

          <NavLink
            to="/admin/prompts"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <FileText className="w-5 h-5" />
            {t('admin.nav.prompts')}
          </NavLink>

          <NavLink
            to="/admin/analytics"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Activity className="w-5 h-5" />
            {t('admin.nav.analytics')}
          </NavLink>
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;