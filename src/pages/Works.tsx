import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { Loader2, Video } from 'lucide-react';

const Works: React.FC = () => {
  const { t } = useTranslation();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [works, setWorks] = useState<any[]>([]);

  useEffect(() => {
    fetchWorks();
  }, []);

  const fetchWorks = async () => {
    try {
      const response = await fetch('/api/projects?status=completed', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setWorks(data.projects);
      }
    } catch (error) {
      console.error('Failed to fetch works:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">{t('works.title')}</h1>

      {works.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <Video className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">{t('works.noWorks.title')}</h3>
          <p className="text-gray-500">{t('works.noWorks.desc')}</p>
          <Link to="/dashboard" className="text-blue-600 font-medium hover:text-blue-700">{t('works.noWorks.button')}</Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {works.map((work) => (
            <div key={work.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
              <div className="aspect-video bg-gray-100 relative">
                {work.video_url ? (
                  <video src={work.video_url} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <Video className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{work.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{new Date(work.created_at).toLocaleDateString()}</p>
                <Link to={`/project/${work.id}`} className="block w-full text-center bg-gray-50 text-gray-700 py-2 rounded-lg hover:bg-gray-100 transition text-sm font-medium">
                  {t('works.viewDetails')}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Works;
