import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { User } from 'lucide-react';

const Profile: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">{t('profile.title')}</h1>
      
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
            <User className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-gray-500">{user.email}</p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('profile.accountDetails')}</h3>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('profile.userId')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.id}</dd>
            </div>
            {/* Add more fields as needed */}
          </dl>
        </div>
      </div>
    </div>
  );
};

export default Profile;
