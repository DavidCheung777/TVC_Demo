import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Video, Home, PlusSquare, FolderOpen, User, LogOut, Globe, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from 'react-i18next';

const MainLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'zh' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="w-8 h-8 text-blue-600" />
            <Link to="/" className="text-xl font-bold text-gray-900">{t('app.title')}</Link>
          </div>

          <nav className="flex items-center gap-6">
            {user?.role === 'admin' && (
              <Link to="/admin" className="text-gray-600 hover:text-blue-600 flex items-center gap-1 font-medium">
                <LayoutDashboard className="w-4 h-4" />
                {t('nav.admin')}
              </Link>
            )}
            <Link to="/dashboard" className="text-gray-600 hover:text-blue-600 flex items-center gap-1 font-medium">
              <PlusSquare className="w-4 h-4" />
              {t('nav.creation')}
            </Link>
            <Link to="/works" className="text-gray-600 hover:text-blue-600 flex items-center gap-1 font-medium">
              <FolderOpen className="w-4 h-4" />
              {t('nav.myWorks')}
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleLanguage}
              className="text-gray-500 hover:text-blue-600 flex items-center gap-1"
              title={i18n.language === 'en' ? 'Switch to Chinese' : 'Switch to English'}
            >
              <Globe className="w-5 h-5" />
              <span className="text-sm font-medium">{i18n.language === 'en' ? 'EN' : '中'}</span>
            </button>

            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/profile" className="text-gray-600 hover:text-blue-600 flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {user.name}
                </Link>
                <button 
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-red-600"
                  title={t('nav.logout')}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium">{t('nav.login')}</Link>
                <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium">
                  {t('nav.signUp')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} {t('app.title')}. Powered by Doubao Large Model.
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
