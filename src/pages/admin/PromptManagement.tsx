import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { Loader2, Plus, FileText, Trash2, Edit2, Search, Copy, Check } from 'lucide-react';

interface Prompt {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string;
  is_public: number;
  created_at: string;
}

interface Category {
  value: string;
  label: string;
}

const PromptManagement: React.FC = () => {
  const { t } = useTranslation();
  const { token } = useAuthStore();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [deletingPrompt, setDeletingPrompt] = useState<Prompt | null>(null);
  const [deleteConfirmTitle, setDeleteConfirmTitle] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: '',
    is_public: true
  });

  useEffect(() => {
    fetchPrompts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/prompts/categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchPrompts = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      const response = await fetch(`/api/prompts?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPrompts(data.prompts);
      }
    } catch (error) {
      console.error('Failed to fetch prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPrompts();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingPrompt 
        ? `/api/prompts/${editingPrompt.id}`
        : '/api/prompts';
      
      const response = await fetch(url, {
        method: editingPrompt ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      if (data.success) {
        setShowModal(false);
        setEditingPrompt(null);
        setFormData({ title: '', content: '', category: 'general', tags: '', is_public: true });
        fetchPrompts();
      }
    } catch (error) {
      console.error('Failed to save prompt:', error);
    }
  };

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setFormData({
      title: prompt.title,
      content: prompt.content,
      category: prompt.category,
      tags: prompt.tags,
      is_public: !!prompt.is_public
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deletingPrompt) return;
    
    if (deleteConfirmTitle !== deletingPrompt.title) {
      setDeleteError(t('admin.prompts.confirmTitleMismatch'));
      return;
    }
    
    try {
      const response = await fetch(`/api/prompts/${deletingPrompt.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (data.success) {
        setDeletingPrompt(null);
        setDeleteConfirmTitle('');
        setDeleteError('');
        fetchPrompts();
      }
    } catch (error) {
      console.error('Failed to delete prompt:', error);
    }
  };

  const handleCopy = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getCategoryLabel = (value: string) => {
    const cat = categories.find(c => c.value === value);
    return cat ? cat.label : value;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.prompts.title')}</h1>
        <button
          onClick={() => {
            setEditingPrompt(null);
            setFormData({ title: '', content: '', category: 'general', tags: '', is_public: true });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          {t('admin.prompts.add')}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t('admin.prompts.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setTimeout(fetchPrompts, 0);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('admin.prompts.allCategories')}</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              {t('common.search')}
            </button>
          </form>
        </div>

        {prompts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {t('admin.prompts.noPrompts')}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {prompts.map(prompt => (
              <div key={prompt.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h3 className="font-medium text-gray-900">{prompt.title}</h3>
                    <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                      {getCategoryLabel(prompt.category)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(prompt.content, prompt.id)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title={t('admin.prompts.copy')}
                    >
                      {copiedId === prompt.id ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(prompt)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingPrompt(prompt)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">{prompt.content}</p>
                {prompt.tags && (
                  <div className="flex flex-wrap gap-1">
                    {prompt.tags.split(',').map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-bold">
              {editingPrompt ? t('admin.prompts.edit') : t('admin.prompts.add')}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.prompts.title_label')}
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.prompts.content')}
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.prompts.category')}
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.prompts.tags')}
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder={t('admin.prompts.tagsPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_public" className="text-sm text-gray-700">
                  {t('admin.prompts.isPublic')}
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPrompt(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingPrompt ? t('common.save') : t('common.add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-red-600">{t('admin.prompts.deleteTitle')}</h3>
            <p className="text-gray-600">
              {t('admin.prompts.deleteConfirmMessage', { name: deletingPrompt.title })}
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.prompts.enterTitleConfirm')}
              </label>
              <input
                type="text"
                value={deleteConfirmTitle}
                onChange={(e) => {
                  setDeleteConfirmTitle(e.target.value);
                  setDeleteError('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              {deleteError && (
                <p className="mt-1 text-sm text-red-600">{deleteError}</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeletingPrompt(null);
                  setDeleteConfirmTitle('');
                  setDeleteError('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                {t('admin.prompts.confirmDeleteBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptManagement;
