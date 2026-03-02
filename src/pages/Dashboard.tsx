import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Video, Calendar, Clock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from 'react-i18next';

interface Project {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // New project state
  const [newProjectName, setNewProjectName] = useState('');
  const [productInfo, setProductInfo] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [budget, setBudget] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newProjectName,
          product_info: { description: productInfo },
          target_audience: targetAudience,
          budget
        })
      });

      const data = await response.json();
      if (data.success) {
        navigate(`/project/${data.project.id}/script`);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
        <button
          onClick={() => setShowNewProjectModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {t('dashboard.newProject')}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <Video className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">{t('dashboard.noProjects.title')}</h3>
          <p className="text-gray-500">{t('dashboard.noProjects.desc')}</p>
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="text-blue-600 font-medium hover:text-blue-700"
          >
            {t('dashboard.noProjects.button')}
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/project/${project.id}/script`}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition">
                  <Video className="w-6 h-6 text-blue-600" />
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  project.status === 'completed' ? 'bg-green-100 text-green-700' :
                  project.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {t(`dashboard.status.${project.status}` as any)}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.name}</h3>
              <div className="flex items-center text-sm text-gray-500 gap-4">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(project.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {new Date(project.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">{t('dashboard.modal.title')}</h2>
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('dashboard.modal.projectName')}</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder={t('dashboard.modal.placeholders.projectName')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('dashboard.modal.productDesc')}</label>
                <textarea
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                  value={productInfo}
                  onChange={(e) => setProductInfo(e.target.value)}
                  placeholder={t('dashboard.modal.placeholders.productDesc')}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('dashboard.modal.targetAudience')}</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder={t('dashboard.modal.placeholders.targetAudience')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('dashboard.modal.budgetRange')}</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                  >
                    <option value="">{t('dashboard.modal.budgetOptions.default')}</option>
                    <option value="low">{t('dashboard.modal.budgetOptions.low')}</option>
                    <option value="medium">{t('dashboard.modal.budgetOptions.medium')}</option>
                    <option value="high">{t('dashboard.modal.budgetOptions.high')}</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  {t('dashboard.modal.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? t('dashboard.modal.creating') : t('dashboard.modal.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
