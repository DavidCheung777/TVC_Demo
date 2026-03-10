import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { ArrowRight, ArrowLeft, Wand2, Loader2, Image as ImageIcon, Sparkles, Edit2, Check, X, Upload, ChevronDown, Plus, Trash2, FileText, Layers, ZoomIn } from 'lucide-react';

interface ReferenceImage {
  id: string;
  project_id: string;
  name: string;
  image_url: string;
  thumbnail_url: string;
  order_index: number;
}

const CreateStoryboard: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [script, setScript] = useState<any>(null);
  const [scriptId, setScriptId] = useState<string>('');
  const [storyboards, setStoryboards] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generatingScene, setGeneratingScene] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [editingScene, setEditingScene] = useState<number | null>(null);
  const [editedVisual, setEditedVisual] = useState('');
  const [editedAudio, setEditedAudio] = useState('');
  const [saving, setSaving] = useState(false);
  const [imageModels, setImageModels] = useState<any[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [imageSize, setImageSize] = useState<string>('2048x2048');
  const [imageStyle, setImageStyle] = useState<string>('Cinematic, Photorealistic');
  const [watermark, setWatermark] = useState<boolean>(false);
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);

  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [showReferenceSection, setShowReferenceSection] = useState(true);
  const [uploadingRef, setUploadingRef] = useState(false);
  const [showRefPicker, setShowRefPicker] = useState(false);
  const [pickingForScene, setPickingForScene] = useState<number | null>(null);
  const [selectedRefIds, setSelectedRefIds] = useState<string[]>([]);
  const [sceneRefMap, setSceneRefMap] = useState<Record<number, string[]>>({});

  const imageSizeOptions = [
    { value: '2048x2048', label: '2048×2048 (1:1) 2K' },
    { value: '2560x1440', label: '2560×1440 (16:9) 2K' },
    { value: '1024x1024', label: '1024×1024 (1:1)' },
    { value: '1280x720', label: '1280×720 (16:9)' },
    { value: '720x1280', label: '720×1280 (9:16)' },
  ];

  const imageStyleOptions = [
    { value: 'Cinematic, Photorealistic', label: '电影质感' },
    { value: 'Anime, Illustration', label: '动漫风格' },
    { value: '3D Render, CGI', label: '3D渲染' },
    { value: 'Oil Painting, Artistic', label: '油画风格' },
    { value: 'Watercolor, Soft', label: '水彩风格' },
    { value: 'Minimalist, Clean', label: '极简风格' },
  ];

  useEffect(() => {
    fetchImageModels();
    fetchReferenceImages();
    fetchStoryboards();
    
    if (location.state?.script) {
      setScript(location.state.script);
      if (location.state.script.id) {
        setScriptId(location.state.script.id);
      }
      setLoading(false);
    } else {
      fetchScript();
    }
  }, [id]);

  const fetchStoryboards = async () => {
    try {
      const response = await fetch(`/api/storyboards/project/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.storyboards) {
        setStoryboards(data.storyboards);
      }
    } catch (error) {
      console.error('Failed to fetch storyboards:', error);
    }
  };

  const fetchScript = async () => {
    try {
      const response = await fetch(`/api/scripts/project/${id}/latest`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.script) {
        let scriptData = data.script.content;
        if (typeof scriptData === 'string') {
          try {
            scriptData = JSON.parse(scriptData);
          } catch (e) {
            scriptData = { title: scriptData, scenes: [] };
          }
        }
        setScript(scriptData);
        setScriptId(data.script.id);
      }
    } catch (error) {
      console.error('Failed to fetch script:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchImageModels = async () => {
    try {
      const response = await fetch('/api/ai/models?type=image', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.models.length > 0) {
        setImageModels(data.models);
        const defaultModel = data.models.find((m: any) => 
          m.Model_ID?.toLowerCase().includes('seedream')
        ) || data.models[0];
        setSelectedModelId(defaultModel.Model_ID);
      }
    } catch (error) {
      console.error('Failed to fetch image models:', error);
    }
  };

  const fetchReferenceImages = async () => {
    try {
      const response = await fetch(`/api/reference-images/project/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        const next = data.reference_images || data.images || [];
        setReferenceImages(Array.isArray(next) ? next.filter(Boolean) : []);
      }
    } catch (error) {
      console.error('Failed to fetch reference images:', error);
    }
  };

  const uploadSingleReferenceImage = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('project_id', id || '');
      
      const response = await fetch('/api/reference-images', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        const refImage = data.reference_image || data.image;
        if (refImage) {
          setReferenceImages(prev => [...prev.filter(Boolean), refImage]);
        } else {
          await fetchReferenceImages();
        }
      }
    } catch (error) {
      console.error('Failed to upload reference image:', error);
    }
  };

  const uploadReferenceImages = async (files: FileList | File[]) => {
    setUploadingRef(true);
    try {
      const list = Array.isArray(files) ? files : Array.from(files);
      for (const file of list) {
        await uploadSingleReferenceImage(file);
      }
    } finally {
      setUploadingRef(false);
    }
  };

  const deleteReferenceImage = async (imageId: string) => {
    try {
      const response = await fetch(`/api/reference-images/${imageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setReferenceImages(prev => prev.filter(img => img.id !== imageId));
      }
    } catch (error) {
      console.error('Failed to delete reference image:', error);
    }
  };

  const getRefImageById = (id: string) => referenceImages.find(img => img.id === id);

  const openRefPicker = (sceneNumber: number) => {
    setPickingForScene(sceneNumber);
    setSelectedRefIds(sceneRefMap[sceneNumber] || []);
    setShowRefPicker(true);
  };

  const toggleRefSelection = (refId: string) => {
    setSelectedRefIds(prev => 
      prev.includes(refId) ? prev.filter(id => id !== refId) : [...prev, refId]
    );
  };

  const confirmRefSelection = () => {
    if (pickingForScene !== null) {
      setSceneRefMap(prev => ({
        ...prev,
        [pickingForScene]: selectedRefIds
      }));
    }
    setShowRefPicker(false);
    setPickingForScene(null);
    setSelectedRefIds([]);
  };

  const generateImages = async () => {
    if (!script?.scenes) return;
    
    setGenerating(true);
    try {
      for (const scene of script.scenes) {
        await generateSingleImage(scene);
      }
    } finally {
      setGenerating(false);
    }
  };

  const pollImageTaskStatus = async (taskId: string): Promise<string | null> => {
    const maxAttempts = 60;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`/api/ai/tasks/${taskId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.status === 'completed' && data.result?.image_url) {
          return data.result.image_url;
        }
        
        if (data.status === 'failed') {
          return null;
        }
        
        let interval: number;
        if (attempts < 6) {
          interval = 2 + attempts;
        } else {
          interval = 8;
        }
        await new Promise(resolve => setTimeout(resolve, interval * 1000));
        attempts++;
      } catch {
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      }
    }
    
    return null;
  };

  const generateSingleImage = async (scene: any) => {
    if (!scene) return;
    
    setGeneratingScene(scene.scene_number);
    try {
      const refIds = sceneRefMap[scene.scene_number] || [];
      
      const response = await fetch('/api/ai/generate-image-async', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          project_id: id,
          script_id: scriptId,
          sequence_number: scene.scene_number,
          prompt: scene.visual,
          model_id: selectedModelId,
          size: imageSize,
          style: imageStyle,
          watermark,
          reference_image_ids: refIds.length > 0 ? refIds : undefined
        })
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate image');
      }

      if (!data.task_id) {
        throw new Error('Missing task_id');
      }

      const imageUrl = await pollImageTaskStatus(data.task_id);
      if (!imageUrl) {
        throw new Error('Failed to generate image');
      }

      setStoryboards(prev => {
        const existing = prev.findIndex(s => s.sequence_number === scene.scene_number);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = { ...updated[existing], image_url: imageUrl };
          return updated;
        }
        return [...prev, { sequence_number: scene.scene_number, image_url: imageUrl }];
      });
    } catch (error) {
      console.error('Failed to generate image:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      setShowError(true);
    } finally {
      setGeneratingScene(null);
    }
  };

  const startEditing = (scene: any) => {
    setEditingScene(scene.scene_number);
    setEditedVisual(scene.visual);
    setEditedAudio(scene.audio);
  };

  const cancelEditing = () => {
    setEditingScene(null);
    setEditedVisual('');
    setEditedAudio('');
  };

  const saveEditedScene = async (scene: any) => {
    setSaving(true);
    try {
      const updatedScenes = script.scenes.map((s: any) => 
        s.scene_number === scene.scene_number 
          ? { ...s, visual: editedVisual, audio: editedAudio }
          : s
      );
      const response = await fetch(`/api/scripts/project/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: JSON.stringify({ ...script, scenes: updatedScenes }),
          version: (script.version || 0) + 1
        })
      });
      const data = await response.json();
      if (data.success) {
        setScript({ ...script, scenes: updatedScenes });
        cancelEditing();
      }
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    navigate(`/project/${id}/video`, { state: { script, storyboards, scriptId } });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!script || !script.scenes || script.scenes.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-700 mb-2">{t('storyboard.noScript')}</h2>
        <p className="text-slate-500 mb-4">{t('storyboard.createScriptFirst')}</p>
        <button
          onClick={() => navigate(`/project/${id}/script`)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {t('storyboard.goToScript')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {showError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-red-600">{t('common.error')}</h3>
            <p className="text-gray-600">{errorMessage}</p>
            <button
              onClick={() => { setShowError(false); setErrorMessage(''); }}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}

      {activeImageUrl && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setActiveImageUrl(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-5xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">图片预览</span>
              <button
                type="button"
                onClick={() => setActiveImageUrl(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-black flex items-center justify-center">
              <img src={activeImageUrl} alt="" className="max-h-[80vh] w-auto object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/project/${id}/script`)}
            className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            返回脚本
          </button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('storyboard.step')}</h1>
            <p className="text-sm text-slate-500">{script.title || '分镜创作'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-4 py-2 text-slate-400 text-sm font-medium">1. 脚本</span>
          <span className="text-slate-300">→</span>
          <span className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg">2. 分镜</span>
          <span className="text-slate-300">→</span>
          <span className="px-4 py-2 text-slate-400 text-sm font-medium">3. 视频</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* 左栏：脚本信息 */}
        <div className="col-span-3 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <h2 className="font-semibold text-slate-800">脚本信息</h2>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">场景数量</span>
                <span className="font-medium text-slate-800">{script.scenes?.length || 0} 个</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">已生成</span>
                <span className="font-medium text-emerald-600">{storyboards.length} 个</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">参考图</span>
                <span className="font-medium text-slate-800">{referenceImages.length} 张</span>
              </div>
              <div className="pt-3 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">场景列表</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {script.scenes?.map((scene: any, index: number) => {
                    const hasImage = storyboards.some(s => s.sequence_number === scene.scene_number);
                    return (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className={`w-5 h-5 rounded flex items-center justify-center text-xs font-medium ${hasImage ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                          {scene.scene_number}
                        </div>
                        <span className="text-slate-600 truncate flex-1">{scene.title || `场景 ${scene.scene_number}`}</span>
                        {hasImage && <Check className="w-3 h-3 text-emerald-500" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 中栏：配置面板 */}
        <div className="col-span-3 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              生成配置
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">AI 模型</label>
                <select
                  value={selectedModelId}
                  onChange={(e) => setSelectedModelId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                >
                  {imageModels.map((model) => (
                    <option key={model.id} value={model.Model_ID}>
                      {model.Model_ID}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">图片尺寸</label>
                <select
                  value={imageSize}
                  onChange={(e) => setImageSize(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                >
                  {imageSizeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">图片风格</label>
                <select
                  value={imageStyle}
                  onChange={(e) => setImageStyle(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                >
                  {imageStyleOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">水印</label>
                <select
                  value={watermark ? 'yes' : 'no'}
                  onChange={(e) => setWatermark(e.target.value === 'yes')}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                >
                  <option value="no">{t('common.no')}</option>
                  <option value="yes">{t('common.yes')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* 参考图 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              参考图
              <span className="text-xs font-normal text-slate-400">({referenceImages.length}张)</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {referenceImages.map((refImg, idx) => {
                const normalizedUrl =
                  refImg.image_url && !refImg.image_url.startsWith('http') && !refImg.image_url.startsWith('/')
                    ? `/${refImg.image_url}`
                    : refImg.image_url;

                return (
                  <div key={refImg.id} className="relative group">
                    <button
                      type="button"
                      className="w-12 h-12 rounded-lg border border-slate-200 overflow-hidden relative"
                      onClick={() => normalizedUrl && setActiveImageUrl(normalizedUrl)}
                    >
                      <img
                        src={normalizedUrl}
                        alt={refImg.name || `参考图 ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ZoomIn className="w-4 h-4 text-white" />
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteReferenceImage(refImg.id)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                );
              })}
              <label className="w-12 h-12 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-400 transition bg-slate-50">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) uploadReferenceImages(files);
                    e.target.value = '';
                  }}
                />
                {uploadingRef ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <Plus className="w-4 h-4 text-slate-400" />}
              </label>
            </div>
            <p className="text-xs text-slate-400 mt-3">上传参考图后，可在场景中选择引用</p>
          </div>

          {/* 生成按钮 */}
          <button
            onClick={generateImages}
            disabled={generating || storyboards.length === script.scenes.length}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> 生成中...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" /> {storyboards.length > 0 ? '重新生成全部' : '生成全部图片'}
              </>
            )}
          </button>
        </div>

        {/* 右栏：场景展示 */}
        <div className="col-span-6">
          <div className="bg-white rounded-2xl border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                </div>
                <h2 className="font-semibold text-slate-800">场景分镜</h2>
              </div>
              {storyboards.length > 0 && (
                <button
                  onClick={handleNext}
                  className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                >
                  下一步：视频
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="p-5 space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto">
              {script.scenes?.map((scene: any, index: number) => {
                const storyboard = storyboards.find(s => s.sequence_number === scene.scene_number);
                const isGeneratingThis = generatingScene === scene.scene_number;
                
                return (
                  <div key={index} className="flex gap-4 p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all">
                    <div className="w-32 h-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                      {storyboard ? (
                        <button
                          type="button"
                          onClick={() => setActiveImageUrl(storyboard.image_url)}
                          className="w-full h-full relative group"
                        >
                          <img src={storyboard.image_url} alt={`Scene ${scene.scene_number}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ZoomIn className="w-5 h-5 text-white" />
                          </div>
                        </button>
                      ) : isGeneratingThis ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-slate-300" />
                        </div>
                      )}
                      <div className="absolute top-1 left-1 bg-black/50 text-white px-1.5 py-0.5 rounded text-xs font-medium">
                        {String(scene.scene_number).padStart(2, '0')}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-slate-700">{scene.title || `场景 ${scene.scene_number}`}</span>
                        <span className="text-xs text-slate-400">{scene.duration}</span>
                      </div>
                      
                      {editingScene === scene.scene_number ? (
                        <div className="space-y-2">
                          <textarea
                            value={editedVisual}
                            onChange={(e) => setEditedVisual(e.target.value)}
                            className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs resize-none h-12"
                            placeholder="画面描述"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEditedScene(scene)}
                              disabled={saving}
                              className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700"
                            >
                              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : '保存'}
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs hover:bg-slate-200"
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-3 mb-2">
                            <div>
                              <span className="text-xs text-slate-400 block mb-0.5">画面</span>
                              <p className="text-xs text-slate-600 line-clamp-1">{scene.visual}</p>
                            </div>
                            <div>
                              <span className="text-xs text-slate-400 block mb-0.5">口播</span>
                              <p className="text-xs text-slate-600 line-clamp-1">{scene.audio}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {referenceImages.length > 0 && (
                              <div className="flex items-center gap-1">
                                {(sceneRefMap[scene.scene_number] || []).map(refId => {
                                  const refImg = getRefImageById(refId);
                                  if (!refImg) return null;
                                  return (
                                    <div key={refId} className="relative group">
                                      <img src={refImg.image_url} alt="" className="w-6 h-6 object-cover rounded border border-slate-200" />
                                      <button
                                        onClick={() => setSceneRefMap(prev => ({ ...prev, [scene.scene_number]: (prev[scene.scene_number] || []).filter(id => id !== refId) }))}
                                        className="absolute -top-0.5 -right-0.5 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100"
                                      >
                                        <X className="w-2 h-2" />
                                      </button>
                                    </div>
                                  );
                                })}
                                <button
                                  onClick={() => openRefPicker(scene.scene_number)}
                                  className="w-6 h-6 border border-dashed border-slate-300 rounded flex items-center justify-center hover:border-blue-400"
                                >
                                  <Plus className="w-3 h-3 text-slate-400" />
                                </button>
                              </div>
                            )}
                            
                            <button
                              onClick={() => generateSingleImage(scene)}
                              disabled={generatingScene !== null}
                              className="ml-auto px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs hover:bg-slate-200 flex items-center gap-1 disabled:opacity-50"
                            >
                              {isGeneratingThis ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" /> 生成中
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3 h-3" /> {storyboard ? '重新生成' : '生成'}
                                </>
                              )}
                            </button>
                            
                            <button
                              onClick={() => startEditing(scene)}
                              className="p-1 text-slate-400 hover:text-blue-600"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 参考图选择弹窗 */}
      {showRefPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-800">选择参考图</h3>
              <button onClick={() => setShowRefPicker(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-5 gap-3">
              {referenceImages.map((refImg, idx) => (
                <div
                  key={refImg.id}
                  onClick={() => toggleRefSelection(refImg.id)}
                  className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition ${
                    selectedRefIds.includes(refImg.id) ? 'border-blue-500' : 'border-transparent hover:border-slate-300'
                  }`}
                >
                  <img src={refImg.image_url} alt="" className="w-full aspect-square object-cover" />
                  {selectedRefIds.includes(refImg.id) && (
                    <div className="absolute top-1 right-1 bg-blue-500 text-white p-0.5 rounded-full">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm text-slate-500">已选择 {selectedRefIds.length} 张</span>
              <div className="flex gap-2">
                <button onClick={() => setShowRefPicker(false)} className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">取消</button>
                <button onClick={confirmRefSelection} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">确认</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateStoryboard;
