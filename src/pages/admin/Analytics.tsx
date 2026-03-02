import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { Loader2, TrendingUp, Users, Video, FileVideo } from 'lucide-react';

interface Stats {
  total_users: number;
  active_users: number;
  total_projects: number;
  user_growth: { date: string; count: number }[];
  project_distribution: { [key: string]: number };
}

const Analytics: React.FC = () => {
  const { t } = useTranslation();
  const { token } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/system/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
      </div>
    );
  }

  const maxGrowth = Math.max(...stats.user_growth.map(d => d.count));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">{t('admin.analytics.title')}</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-gray-500 text-sm font-medium">{t('admin.analytics.totalUsers')}</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.total_users}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-gray-500 text-sm font-medium">{t('admin.analytics.activeUsers')}</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.active_users}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FileVideo className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-gray-500 text-sm font-medium">{t('admin.analytics.totalProjects')}</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.total_projects}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                <Video className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                <h3 className="text-gray-500 text-sm font-medium">{t('admin.analytics.completedVideos')}</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.project_distribution.completed || 0}</p>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6">{t('admin.analytics.userGrowth')}</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {stats.user_growth.map((point) => (
              <div key={point.date} className="flex-1 flex flex-col items-center gap-2 group">
                <div 
                  className="w-full bg-blue-100 rounded-t-lg transition-all group-hover:bg-blue-200 relative"
                  style={{ height: `${(point.count / maxGrowth) * 100}%` }}
                >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {point.count}
                    </div>
                </div>
                <span className="text-xs text-gray-500 -rotate-45 origin-top-left translate-y-4">{point.date}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6">{t('admin.analytics.projectStatus')}</h3>
          <div className="space-y-4">
            {Object.entries(stats.project_distribution).map(([status, count]) => (
              <div key={status} className="flex items-center gap-4">
                <span className="w-24 text-sm font-medium text-gray-600 capitalize">{status}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${(count / stats.total_projects) * 100}%` }}
                  />
                </div>
                <span className="w-12 text-sm text-gray-500 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
