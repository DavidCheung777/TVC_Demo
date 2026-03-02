import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { Loader2, Plus, Box, Trash2, Edit2 } from 'lucide-react';

interface Model {
  row_id: string;
  id: string;
  provider: string;
  endpoint?: string;
  type: string;
  api_key: string;
}

interface Provider {
  id: string;
  name: string;
  code: string;
  endpoint: string;
  api_key: string;
}

const ModelManagement: React.FC = () => {
  const { t } = useTranslation();
  const { token } = useAuthStore();
  const [models, setModels] = useState<Model[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [deletingModel, setDeletingModel] = useState<Model | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [formData, setFormData] = useState({ 
    name: '', 
    provider: '', 
    model_ids: '', 
    type: 'text', 
    api_key: '' 
  });

  useEffect(() => {
    fetchModels();
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
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
    }
  };

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/admin/models', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setModels(data.models);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const selectedProvider = providers.find(p => p.code === value);
    if (selectedProvider) {
      setFormData(prev => ({
        ...prev,
        provider: selectedProvider.code,
        api_key: selectedProvider.api_key || '' 
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        provider: '',
        api_key: ''
      }));
    }
  };

  const handleCreateModel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingModel) {
        const response = await fetch(`/api/admin/models/${editingModel.row_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            id: formData.name,
            provider: formData.provider,
            type: formData.type,
            api_key: formData.api_key
          })
        });
        const data = await response.json();
        if (data.success) {
          setModels(models.map(m => m.row_id === editingModel.row_id ? data.model : m));
        }
      } else {
        const modelIds = formData.model_ids.split(';').map(id => id.trim()).filter(id => id);
        
        if (modelIds.length === 0) return;

        const requests = modelIds.map(id => ({
          id: id,
          provider: formData.provider,
          type: formData.type,
          api_key: formData.api_key
        }));

        for (const payload of requests) {
          const response = await fetch('/api/admin/models', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });
          const data = await response.json();
          if (data.success) {
            setModels(prev => [...prev, data.model]);
          }
        }
      }
      
      setShowModal(false);
      setEditingModel(null);
      setFormData({ name: '', provider: '', model_ids: '', type: 'text', api_key: '' });
    } catch (error) {
      console.error('Failed to save model:', error);
    }
  };

  const handleEditModel = (model: Model) => {
    setEditingModel(model);
    setFormData({
      name: model.id,
      provider: model.provider,
      model_ids: model.id,
      type: model.type,
      api_key: model.api_key || ''
    });
    setShowModal(true);
  };

  const handleDeleteModel = (model: Model) => {
    setDeletingModel(model);
    setDeleteConfirmName('');
    setDeleteError('');
  };

  const confirmDeleteModel = async () => {
    if (!deletingModel) return;
    if (deleteConfirmName !== deletingModel.id) {
      setDeleteError(t('admin.models.confirmNameMismatch'));
      return;
    }
    try {
      const response = await fetch(`/api/admin/models/${deletingModel.row_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setModels(models.filter(m => m.row_id !== deletingModel.row_id));
        setDeletingModel(null);
        setDeleteConfirmName('');
        setDeleteError('');
      }
    } catch (error) {
      console.error('Failed to delete model:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{t('admin.models.title')}</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {t('admin.models.add')}
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
                  {t('admin.models.name')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.models.provider')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.models.type')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.models.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {models.map((model) => (
                <tr key={model.row_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Box className="w-5 h-5 text-gray-400 mr-3" />
                      <div className="text-sm font-medium text-gray-900">{model.id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {model.provider}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {model.type === 'text' ? t('admin.models.typeText') : model.type === 'image' ? t('admin.models.typeImage') : t('admin.models.typeVideo')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleEditModel(model)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteModel(model)}
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
              {editingModel ? t('admin.models.edit') : t('admin.models.add')}
            </h3>
            <form onSubmit={handleCreateModel} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.models.name')}</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingModel ? formData.name : formData.model_ids}
                  onChange={(e) => editingModel 
                    ? setFormData({...formData, name: e.target.value})
                    : setFormData({...formData, model_ids: e.target.value})
                  }
                  placeholder={editingModel ? undefined : "e.g. doubao-pro-32k;doubao-lite-4k"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.models.provider')}</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.provider}
                  onChange={handleProviderChange}
                >
                  <option value="">{t('admin.models.selectProvider')}</option>
                  {providers.map(p => (
                    <option key={p.id} value={p.code}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.models.type')}</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option value="text">{t('admin.models.typeText')}</option>
                  <option value="image">{t('admin.models.typeImage')}</option>
                  <option value="video">{t('admin.models.typeVideo')}</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingModel(null);
                    setFormData({ name: '', provider: '', model_ids: '', type: 'text', api_key: '' });
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  {t('dashboard.modal.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingModel ? t('dashboard.modal.save') : t('dashboard.modal.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingModel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-6">
            <h3 className="text-xl font-bold text-gray-900">{t('admin.models.deleteTitle')}</h3>
            <p className="text-gray-600">
              {t('admin.models.deleteConfirmMessage', { name: deletingModel.id })}
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.models.enterNameConfirm')}
              </label>
              <input
                type="text"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  deleteError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'
                }`}
                value={deleteConfirmName}
                onChange={(e) => {
                  setDeleteConfirmName(e.target.value);
                  setDeleteError('');
                }}
                placeholder={deletingModel.id}
              />
              {deleteError && (
                <p className="mt-2 text-sm text-red-600">{deleteError}</p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeletingModel(null);
                  setDeleteConfirmName('');
                  setDeleteError('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                {t('dashboard.modal.cancel')}
              </button>
              <button
                type="button"
                onClick={confirmDeleteModel}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                {t('admin.models.confirmDeleteBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelManagement;