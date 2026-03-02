import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { Loader2, Plus, Trash2, Edit2, Server, Eye, EyeOff } from 'lucide-react';

interface Provider {
  id: string;
  name: string;
  code: string;
  endpoint: string;
  api_key: string;
  is_active: boolean;
}

const ProviderManagement: React.FC = () => {
  const { t } = useTranslation();
  const { token } = useAuthStore();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [deletingProvider, setDeletingProvider] = useState<Provider | null>(null);
  const [deleteConfirmCode, setDeleteConfirmCode] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    code: '', 
    endpoint: '', 
    api_key: '' 
  });

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/providers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setProviders(data.providers);
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProvider) {
        const response = await fetch(`/api/admin/providers/${editingProvider.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
        const data = await response.json();
        if (data.success) {
          setShowModal(false);
          setEditingProvider(null);
          setFormData({ name: '', code: '', endpoint: '', api_key: '' });
          fetchProviders();
        }
      } else {
        const response = await fetch('/api/admin/providers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
        const data = await response.json();
        if (data.success) {
          setShowModal(false);
          setEditingProvider(null);
          setFormData({ name: '', code: '', endpoint: '', api_key: '' });
          fetchProviders();
        }
      }
    } catch (error) {
      console.error('Failed to save provider:', error);
    }
  };

  const handleEditProvider = (provider: Provider) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name,
      code: provider.code,
      endpoint: provider.endpoint,
      api_key: provider.api_key || ''
    });
    setShowModal(true);
  };

  const handleDeleteProvider = (provider: Provider) => {
    setDeletingProvider(provider);
    setDeleteConfirmCode('');
    setDeleteError('');
  };

  const confirmDeleteProvider = async () => {
    if (!deletingProvider) return;
    if (deleteConfirmCode !== deletingProvider.code) {
      setDeleteError(t('admin.providers.confirmCodeMismatch'));
      return;
    }
    try {
      const response = await fetch(`/api/admin/providers/${deletingProvider.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setProviders(providers.filter(p => p.id !== deletingProvider.id));
        setDeletingProvider(null);
        setDeleteConfirmCode('');
        setDeleteError('');
      }
    } catch (error) {
      console.error('Failed to delete provider:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{t('admin.providers.title')}</h2>
        <button
          onClick={() => {
            setEditingProvider(null);
            setFormData({ name: '', code: '', endpoint: '', api_key: '' });
            setShowApiKey(false);
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {t('admin.providers.add')}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.providers.name')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.providers.code')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.providers.endpoint')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.models.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {providers.map((provider) => (
                <tr key={provider.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Server className="w-5 h-5 text-gray-400 mr-3" />
                      <div className="text-sm font-medium text-gray-900">{provider.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {provider.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {provider.endpoint}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleEditProvider(provider)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteProvider(provider)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-6">
            <h3 className="text-xl font-bold text-gray-900">
              {editingProvider ? t('admin.providers.edit') : t('admin.providers.add')}
            </h3>
            <form onSubmit={handleCreateProvider} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.providers.name')}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Doubao, OpenAI"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.providers.code')}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. doubao, openai"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.providers.endpoint')}</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.endpoint}
                  onChange={(e) => setFormData({...formData, endpoint: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.models.apiKey')}</label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    required
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.api_key}
                    onChange={(e) => setFormData({...formData, api_key: e.target.value})}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProvider(null);
                    setFormData({ name: '', code: '', endpoint: '', api_key: '' });
                    setShowApiKey(false);
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  {t('dashboard.modal.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingProvider ? t('dashboard.modal.save') : t('dashboard.modal.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-6">
            <h3 className="text-xl font-bold text-gray-900">{t('admin.providers.deleteTitle')}</h3>
            <p className="text-gray-600">
              {t('admin.providers.deleteConfirmMessage', { name: deletingProvider.name, code: deletingProvider.code })}
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.providers.enterCodeConfirm')}
              </label>
              <input
                type="text"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  deleteError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'
                }`}
                value={deleteConfirmCode}
                onChange={(e) => {
                  setDeleteConfirmCode(e.target.value);
                  setDeleteError('');
                }}
                placeholder={deletingProvider.code}
              />
              {deleteError && (
                <p className="mt-2 text-sm text-red-600">{deleteError}</p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeletingProvider(null);
                  setDeleteConfirmCode('');
                  setDeleteError('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                {t('dashboard.modal.cancel')}
              </button>
              <button
                type="button"
                onClick={confirmDeleteProvider}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                {t('admin.providers.confirmDeleteBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderManagement;