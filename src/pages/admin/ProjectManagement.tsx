import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { Folder, Search, Eye, Trash2, X, FileText, Image, Video, Archive, Loader2, ChevronRight } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  product_info: any;
  budget_range: string;
  status: string;
  created_at: string;
}

interface ProjectMetadata {
  scripts: any[];
  scripts_count: number;
  storyboards: any[];
  storyboards_count: number;
  videos: any[];
  videos_count: number;
  library_items: any[];
  library_count: number;
}

const ProjectManagement: React.FC = () => {
  const { t } = useTranslation();
  const { token } = useAuthStore();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [total, setTotal] = useState(0);
  
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectMetadata, setProjectMetadata] = useState<ProjectMetadata | null>(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [selectedScript, setSelectedScript] = useState<any>(null);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [loadingScript, setLoadingScript] = useState(false);
  const [selectedStoryboard, setSelectedStoryboard] = useState<any>(null);
  const [showStoryboardModal, setShowStoryboardModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [statusFilter]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);
      
      const response = await fetch(`/api/admin/projects?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setProjects(data.projects);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProjects();
  };

  const viewProjectDetails = async (project: Project) => {
    setSelectedProject(project);
    setShowDetailModal(true);
    setLoadingMetadata(true);
    
    try {
      const response = await fetch(`/api/admin/projects/${project.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setProjectMetadata(data.metadata);
      }
    } catch (error) {
      console.error('Failed to fetch project details:', error);
    } finally {
      setLoadingMetadata(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (deleteConfirmName !== selectedProject?.name) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setProjects(projects.filter(p => p.id !== projectId));
        setShowDetailModal(false);
        setShowDeleteConfirm(false);
        setSelectedProject(null);
        setProjectMetadata(null);
        setDeleteConfirmName('');
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
    } finally {
      setDeleting(false);
    }
  };

  const viewScriptDetails = async (scriptId: string) => {
    setLoadingScript(true);
    setShowScriptModal(true);
    try {
      const response = await fetch(`/api/scripts/${scriptId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSelectedScript(data.script);
      }
    } catch (error) {
      console.error('Failed to fetch script details:', error);
    } finally {
      setLoadingScript(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      scripting: 'bg-blue-100 text-blue-700',
      storyboard: 'bg-yellow-100 text-yellow-700',
      video: 'bg-purple-100 text-purple-700',
      completed: 'bg-green-100 text-green-700'
    };
    return statusStyles[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.projects.title')}</h1>
        <div className="text-sm text-gray-500">
          {t('admin.projects.total')}: {total}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('admin.projects.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap sm:w-auto w-full"
            >
              {t('common.search')}
            </button>
          </form>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 sm:min-w-[140px] w-full sm:w-auto"
          >
            <option value="">{t('admin.projects.allStatus')}</option>
            <option value="draft">{t('admin.projects.status.draft')}</option>
            <option value="scripting">{t('admin.projects.status.scripting')}</option>
            <option value="storyboard">{t('admin.projects.status.storyboard')}</option>
            <option value="video">{t('admin.projects.status.video')}</option>
            <option value="completed">{t('admin.projects.status.completed')}</option>
          </select>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{t('admin.projects.noProjects')}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.projects.table.name')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.projects.table.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.projects.table.user')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.projects.table.createdAt')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.projects.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => viewProjectDetails(project)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900 hover:text-blue-600">{project.name}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {typeof project.product_info === 'string' 
                        ? project.product_info 
                        : (project.product_info as any)?.description || JSON.stringify(project.product_info || {})}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(project.status)}`}>
                      {t(`admin.projects.status.${project.status}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{project.user_name || project.user_id}</div>
                    {project.user_email && (
                      <div className="text-xs text-gray-400">{project.user_email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(project.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => viewProjectDetails(project)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Eye className="w-4 h-4 inline mr-1" />
                      {t('common.view')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Project Detail Modal */}
      {showDetailModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedProject.name}</h2>
                <p className="text-sm text-gray-500">{selectedProject.id}</p>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedProject(null);
                  setProjectMetadata(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {loadingMetadata ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : projectMetadata ? (
                <div className="space-y-6">
                  {/* Project Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">{t('admin.projects.detail.status')}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(selectedProject.status)}`}>
                        {t(`admin.projects.status.${selectedProject.status}`)}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">{t('admin.projects.detail.createdAt')}</h3>
                      <p className="text-gray-900">{new Date(selectedProject.created_at).toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg col-span-2">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">{t('admin.projects.detail.productInfo')}</h3>
                      <p className="text-gray-900">
                        {typeof selectedProject.product_info === 'string' 
                          ? selectedProject.product_info 
                          : (selectedProject.product_info as any)?.description || JSON.stringify(selectedProject.product_info || {}) || '-'}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">{t('admin.projects.detail.budget')}</h3>
                      <p className="text-gray-900">{selectedProject.budget_range || '-'}</p>
                    </div>
                  </div>

                  {/* Metadata Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <div 
                      className={`bg-blue-50 p-4 rounded-lg text-center cursor-pointer transition-all hover:shadow-md ${activeSection === 'scripts' ? 'ring-2 ring-blue-400' : ''}`}
                      onClick={() => setActiveSection(activeSection === 'scripts' ? null : 'scripts')}
                    >
                      <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-600">{projectMetadata.scripts_count}</p>
                      <p className="text-sm text-blue-700">{t('admin.projects.detail.scripts')}</p>
                    </div>
                    <div 
                      className={`bg-green-50 p-4 rounded-lg text-center cursor-pointer transition-all hover:shadow-md ${activeSection === 'storyboards' ? 'ring-2 ring-green-400' : ''}`}
                      onClick={() => setActiveSection(activeSection === 'storyboards' ? null : 'storyboards')}
                    >
                      <Image className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-600">{projectMetadata.storyboards_count}</p>
                      <p className="text-sm text-green-700">{t('admin.projects.detail.storyboards')}</p>
                    </div>
                    <div 
                      className={`bg-purple-50 p-4 rounded-lg text-center cursor-pointer transition-all hover:shadow-md ${activeSection === 'videos' ? 'ring-2 ring-purple-400' : ''}`}
                      onClick={() => setActiveSection(activeSection === 'videos' ? null : 'videos')}
                    >
                      <Video className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-purple-600">{projectMetadata.videos_count}</p>
                      <p className="text-sm text-purple-700">{t('admin.projects.detail.videos')}</p>
                    </div>
                    <div 
                      className={`bg-orange-50 p-4 rounded-lg text-center cursor-pointer transition-all hover:shadow-md ${activeSection === 'library' ? 'ring-2 ring-orange-400' : ''}`}
                      onClick={() => setActiveSection(activeSection === 'library' ? null : 'library')}
                    >
                      <Archive className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-orange-600">{projectMetadata.library_count}</p>
                      <p className="text-sm text-orange-700">{t('admin.projects.detail.library')}</p>
                    </div>
                  </div>

                  {/* Scripts List */}
                  {activeSection === 'scripts' && projectMetadata.scripts.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('admin.projects.detail.scriptVersions')}</h3>
                      <div className="space-y-2">
                        {projectMetadata.scripts.map((script: any) => (
                          <div 
                            key={script.id} 
                            className="bg-white border border-gray-200 p-3 rounded-lg flex justify-between items-center cursor-pointer hover:border-blue-400 hover:shadow-sm transition group"
                            onClick={() => viewScriptDetails(script.id)}
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-500" />
                              <span className="font-medium text-gray-900 group-hover:text-blue-600">{t('script.version')} {script.version}</span>
                              {script.model_name && (
                                <span className="text-sm text-gray-400">({script.model_name})</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">
                                {new Date(script.created_at).toLocaleString()}
                              </span>
                              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Storyboards List */}
                  {activeSection === 'storyboards' && projectMetadata.storyboards.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('admin.projects.detail.storyboardList')}</h3>
                      <div className="space-y-2">
                        {projectMetadata.storyboards.map((sb: any) => (
                          <div 
                            key={sb.id} 
                            className="bg-white border border-gray-200 p-3 rounded-lg flex justify-between items-center cursor-pointer hover:border-blue-400 hover:shadow-sm transition group"
                            onClick={() => {
                              setSelectedStoryboard(sb);
                              setShowStoryboardModal(true);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <Image className="w-4 h-4 text-green-500" />
                              <span className="font-medium text-gray-900 group-hover:text-blue-600">{t('script.scene')} {sb.sequence_number}</span>
                              {sb.visual_description && (
                                <span className="text-sm text-gray-400 truncate max-w-xs">- {sb.visual_description}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">
                                {new Date(sb.created_at).toLocaleString()}
                              </span>
                              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Videos List */}
                  {activeSection === 'videos' && projectMetadata.videos.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('admin.projects.detail.videoList')}</h3>
                      <div className="space-y-2">
                        {projectMetadata.videos.map((video: any) => (
                          <div 
                            key={video.id} 
                            className="bg-white border border-gray-200 p-3 rounded-lg flex justify-between items-center cursor-pointer hover:border-blue-400 hover:shadow-sm transition group"
                            onClick={() => {
                              setSelectedVideo(video);
                              setShowVideoModal(true);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <Video className="w-4 h-4 text-purple-500" />
                              <span className="font-medium text-gray-900 group-hover:text-blue-600">{video.status}</span>
                              <span className="text-sm text-gray-400">({video.duration_seconds}s)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">
                                {new Date(video.created_at).toLocaleString()}
                              </span>
                              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Library List */}
                  {activeSection === 'library' && projectMetadata.library_items.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('admin.projects.detail.library')}</h3>
                      <div className="space-y-2">
                        {projectMetadata.library_items.map((item: any) => (
                          <div key={item.id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              {item.thumbnail_url && (
                                <img src={item.thumbnail_url} alt="" className="w-20 h-12 object-cover rounded" />
                              )}
                              <div>
                                <p className="font-medium">{item.type}</p>
                                {item.duration && <p className="text-sm text-gray-500">{item.duration}s</p>}
                              </div>
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(item.created_at).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  {t('common.error')}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-between">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {t('common.delete')}
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedProject(null);
                  setProjectMetadata(null);
                  setActiveSection(null);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">{t('admin.projects.deleteTitle')}</h3>
            <p className="text-gray-600">
              {t('admin.projects.deleteConfirmMessage', { name: selectedProject.name })}
            </p>
            <p className="text-sm text-gray-500">
              {t('admin.projects.enterNameConfirm')}
            </p>
            <input
              type="text"
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              placeholder={selectedProject.name}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            {deleteConfirmName && deleteConfirmName !== selectedProject.name && (
              <p className="text-sm text-red-500">{t('admin.projects.nameMismatch')}</p>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmName('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => deleteProject(selectedProject.id)}
                disabled={deleting || deleteConfirmName !== selectedProject.name}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {t('admin.projects.confirmDeleteBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Script Detail Modal */}
      {showScriptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedScript ? `${t('script.version')} ${selectedScript.version}` : t('admin.projects.detail.scripts')}
                </h2>
                {selectedScript?.model_name && (
                  <p className="text-sm text-gray-500">{selectedScript.model_name}</p>
                )}
              </div>
              <button
                onClick={() => {
                  setShowScriptModal(false);
                  setSelectedScript(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {loadingScript ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : selectedScript ? (
                <div className="space-y-4">
                  {selectedScript.content?.title && (
                    <h3 className="text-lg font-semibold text-gray-900">{selectedScript.content.title}</h3>
                  )}
                  
                  {selectedScript.content?.scenes?.length > 0 ? (
                    <div className="space-y-4">
                      {selectedScript.content.scenes.map((scene: any, idx: number) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-gray-900">{t('script.scene')} {scene.scene_number}</span>
                            <span className="text-sm text-gray-500">{scene.duration}s</span>
                          </div>
                          <div className="space-y-2">
                            <div className="bg-blue-50 p-2 rounded text-sm text-blue-900">
                              <span className="font-semibold">{t('script.visual')}:</span> {scene.visual}
                            </div>
                            <div className="bg-green-50 p-2 rounded text-sm text-green-900">
                              <span className="font-semibold">{t('script.audio')}:</span> {scene.audio}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto">
                      {typeof selectedScript.content === 'string' 
                        ? selectedScript.content 
                        : JSON.stringify(selectedScript.content, null, 2)}
                    </pre>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  {t('common.error')}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowScriptModal(false);
                  setSelectedScript(null);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Storyboard Detail Modal */}
      {showStoryboardModal && selectedStoryboard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">{t('script.scene')} {selectedStoryboard.sequence_number}</h2>
              <button
                onClick={() => {
                  setShowStoryboardModal(false);
                  setSelectedStoryboard(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {selectedStoryboard.image_url && (
                <div className="mb-4">
                  <img 
                    src={selectedStoryboard.image_url} 
                    alt={`Scene ${selectedStoryboard.sequence_number}`} 
                    className="w-full rounded-lg"
                  />
                </div>
              )}
              
              <div className="space-y-3">
                {selectedStoryboard.visual_description && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm font-semibold text-blue-700 mb-1">{t('script.visual')}</p>
                    <p className="text-blue-900">{selectedStoryboard.visual_description}</p>
                  </div>
                )}
                
                {selectedStoryboard.audio_description && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm font-semibold text-green-700 mb-1">{t('script.audio')}</p>
                    <p className="text-green-900">{selectedStoryboard.audio_description}</p>
                  </div>
                )}
                
                {selectedStoryboard.duration && (
                  <p className="text-sm text-gray-500">{t('script.duration')}: {selectedStoryboard.duration}s</p>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowStoryboardModal(false);
                  setSelectedStoryboard(null);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Detail Modal */}
      {showVideoModal && selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{t('admin.projects.detail.videos')}</h2>
                <p className="text-sm text-gray-500">{selectedVideo.status}</p>
              </div>
              <button
                onClick={() => {
                  setShowVideoModal(false);
                  setSelectedVideo(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {selectedVideo.video_url && (
                <div className="mb-4">
                  <video 
                    src={selectedVideo.video_url} 
                    controls
                    className="w-full rounded-lg"
                    poster={selectedVideo.thumbnail_url}
                  />
                </div>
              )}
              
              {selectedVideo.thumbnail_url && !selectedVideo.video_url && (
                <div className="mb-4">
                  <img 
                    src={selectedVideo.thumbnail_url} 
                    alt="Video thumbnail" 
                    className="w-full rounded-lg"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-500 mb-1">{t('admin.projects.detail.status')}</p>
                  <p className="font-medium">{selectedVideo.status}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-500 mb-1">{t('script.duration')}</p>
                  <p className="font-medium">{selectedVideo.duration_seconds}s</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                  <p className="text-gray-500 mb-1">{t('admin.projects.detail.createdAt')}</p>
                  <p className="font-medium">{new Date(selectedVideo.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowVideoModal(false);
                  setSelectedVideo(null);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;
