import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { ArrowRight, Wand2, Loader2, Save, Upload, X, Image as ImageIcon, History, ChevronDown, RefreshCw, Check, FileText } from 'lucide-react';

interface CreativeAnalysis {
  main_selling_points: string;
  sub_selling_points: string;
  user_insight: string;
  video_type: string;
  creative_theme: string;
  copy_framework: string;
  persona_tone: string;
  script_content: string;
}

interface Scene {
  scene_number: number;
  audio: string;
  visual: string;
  duration: string;
  title?: string;
  narration?: string;
  description?: string;
}

const CreateScript: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [project, setProject] = useState<any>(null);

  const [creativeAnalysis, setCreativeAnalysis] = useState<CreativeAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisConfirmed, setAnalysisConfirmed] = useState(false);
  const [showAnalysisSection, setShowAnalysisSection] = useState(true);
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);

  const [productName, setProductName] = useState('');
  const [features, setFeatures] = useState('');
  const [duration, setDuration] = useState('30');
  const [customDuration, setCustomDuration] = useState('');
  const [models, setModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [videoType, setVideoType] = useState('single_person');
  const [creativeTheme, setCreativeTheme] = useState('product_showcase');
  const [copyFramework, setCopyFramework] = useState('AIDA');
  const [personaTone, setPersonaTone] = useState('friendly_professional');
  const [mainSellingPoints, setMainSellingPoints] = useState('');
  const [subSellingPoints, setSubSellingPoints] = useState('');
  const [generatedScript, setGeneratedScript] = useState<any>(null);
  const [scriptVersions, setScriptVersions] = useState<any[]>([]);
  const [currentVersion, setCurrentVersion] = useState<number>(0);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
  const [scriptExists, setScriptExists] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const videoTypeOptions = [
    { value: 'single_person', label: '单人口播' },
    { value: 'multi_person', label: '多人口播' },
    { value: 'drama', label: '剧情演绎' },
    { value: 'vlog', label: 'Vlog记录' },
    { value: 'mix_cut', label: '混剪' }
  ];
  const creativeThemeOptions = [
    { value: 'product_showcase', label: '产品展示' },
    { value: 'pain_point', label: '痛点讲述' },
    { value: 'boss_ip', label: '老板IP' },
    { value: 'factory_trace', label: '工厂溯源' },
    { value: 'unboxing', label: '开箱评测' },
    { value: 'life_scene', label: '生活场景' },
    { value: 'comparison', label: '对比测评' },
    { value: 'emotional', label: '情感共鸣' }
  ];
  const copyFrameworkOptions = [
    { value: 'AIDA', label: 'AIDA暴力转化' },
    { value: 'SUCCESS', label: 'SUCCESS病毒模型' },
    { value: 'GOLDEN_CIRCLE', label: '黄金圈法则' },
    { value: 'HOOKED', label: 'Hooked上瘾模型' },
    { value: 'FAB', label: 'FAB法则' },
    { value: 'PAS', label: 'PAS问题解决' },
    { value: '6WH1', label: '6WH1场景构建' },
    { value: 'ENFP', label: 'ENFP热情分享型' },
    { value: 'INFP', label: 'INFP情感共鸣型' },
    { value: 'INTJ', label: 'INTJ理性分析型' },
    { value: 'ESTP', label: 'ESTP行动派' }
  ];
  const personaToneOptions = [
    { value: 'friendly_professional', label: '亲切专业' },
    { value: 'enthusiastic', label: '热情活力' },
    { value: 'calm_reliable', label: '沉稳可靠' },
    { value: 'humorous', label: '幽默风趣' },
    { value: 'expert', label: '专家权威' },
    { value: 'neighbor', label: '邻家朋友' },
    { value: 'storyteller', label: '故事讲述者' }
  ];
  useEffect(() => {
    fetchProject();
    fetchModels();
    fetchLatestScript();
  }, [id]);
  useEffect(() => {
    if (scriptLoaded && project && features && selectedModel && !creativeAnalysis && !analysisLoading) {
      generateCreativeAnalysis();
    }
  }, [project, features, selectedModel, scriptExists, creativeAnalysis, analysisLoading, scriptLoaded]);
  const generateCreativeAnalysis = async () => {
    setAnalysisLoading(true);
    try {
      const response = await fetch('/api/ai/generate-creative-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_name: productName,
          features: features.split('\n').filter(f => f.trim()),
          model_id: selectedModel
        })
      });
      const data = await response.json();
      if (data.success) {
        setCreativeAnalysis(data.analysis);
      } else {
        console.error('Failed to generate creative analysis:', data.error);
      }
    } catch (error) {
      console.error('Failed to generate creative analysis:', error);
    } finally {
      setAnalysisLoading(false);
    }
  };
  const handleConfirmAnalysis = () => {
    if (creativeAnalysis) {
      setMainSellingPoints(creativeAnalysis.main_selling_points);
      setSubSellingPoints(creativeAnalysis.sub_selling_points);
      setVideoType(creativeAnalysis.video_type);
      setCreativeTheme(creativeAnalysis.creative_theme);
      setCopyFramework(creativeAnalysis.copy_framework);
      setPersonaTone(creativeAnalysis.persona_tone);
      setAnalysisConfirmed(true);
      setShowAnalysisSection(false);
      setShowAdvanced(true);
    }
  };
  const handleRegenerateAnalysis = async () => {
    setCreativeAnalysis(null);
    await generateCreativeAnalysis();
  };
  const fetchModels = async () => {
    try {
      const response = await fetch('/api/ai/models?type=text', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.models.length > 0) {
        setModels(data.models);
        const defaultModel = data.models.find((m: any) => 
          m.Model_ID === 'doubao-seed-2-0-lite-260215'
        ) || data.models[0];
        setSelectedModel(defaultModel.Model_ID);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
    }
  };
  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setProject(data.project);
        setProductName(data.project.name);
        if (data.project.product_info?.description) {
          setFeatures(data.project.product_info.description);
        }
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
    } finally {
      setLoading(false);
    }
  };
  const fetchLatestScript = async () => {
    try {
      const response = await fetch(`/api/scripts/project/${id}/latest`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.script) {
        let scriptData = data.script.content;
        if (typeof scriptData === 'string' && !scriptData.includes('scene_number')) {
          const metadata = data.script.metadata;
          if (metadata) {
            const parsedMetadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
            if (Array.isArray(parsedMetadata)) {
              scriptData = {
                title: scriptData,
                scenes: parsedMetadata
              };
            }
          }
        } else if (typeof scriptData === 'string') {
          try {
            scriptData = JSON.parse(scriptData);
          } catch (e) {
          }
        }
        setGeneratedScript({
          ...scriptData,
          id: data.script.id
        });
        setCurrentVersion(data.script.version);
        setScriptExists(true);
        const metadata = data.script.metadata;
        if (metadata) {
          const parsedMetadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
          if (parsedMetadata.creative_analysis) {
            const parsedAnalysis = typeof parsedMetadata.creative_analysis === 'string'
              ? JSON.parse(parsedMetadata.creative_analysis)
              : parsedMetadata.creative_analysis;
            setCreativeAnalysis(parsedAnalysis);
            setAnalysisConfirmed(true);
            setShowAnalysisSection(false);
          }
          if (parsedMetadata.video_type) setVideoType(parsedMetadata.video_type);
          if (parsedMetadata.creative_theme) setCreativeTheme(parsedMetadata.creative_theme);
          if (parsedMetadata.copy_framework) setCopyFramework(parsedMetadata.copy_framework);
          if (parsedMetadata.persona_tone) setPersonaTone(parsedMetadata.persona_tone);
          if (parsedMetadata.main_selling_points) setMainSellingPoints(parsedMetadata.main_selling_points);
          if (parsedMetadata.sub_selling_points) setSubSellingPoints(parsedMetadata.sub_selling_points);
        }
        fetchScriptVersions();
      }
    } catch (error) {
      console.error('Failed to fetch latest script:', error);
    } finally {
      setScriptLoaded(true);
    }
  };
  const fetchScriptVersions = async () => {
    try {
      const response = await fetch(`/api/scripts/project/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setScriptVersions(data.scripts || []);
      }
    } catch (error) {
      console.error('Failed to fetch script versions:', error);
    }
  };
  const loadScriptVersion = async (scriptId: string, version: number) => {
    try {
      const response = await fetch(`/api/scripts/${scriptId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        const scriptData = typeof data.script.content === 'string' 
          ? JSON.parse(data.script.content) 
          : data.script.content;
        const metadata = data.script.metadata;
        if (metadata) {
          const parsedMetadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
          if (parsedMetadata.creative_analysis) {
            const parsedAnalysis = typeof parsedMetadata.creative_analysis === 'string'
              ? JSON.parse(parsedMetadata.creative_analysis)
              : parsedMetadata.creative_analysis;
            setCreativeAnalysis(parsedAnalysis);
            setAnalysisConfirmed(true);
            setShowAnalysisSection(false);
          } else {
            setCreativeAnalysis(null);
            setAnalysisConfirmed(false);
            setShowAnalysisSection(true);
          }
          if (parsedMetadata.video_type) setVideoType(parsedMetadata.video_type);
          if (parsedMetadata.creative_theme) setCreativeTheme(parsedMetadata.creative_theme);
          if (parsedMetadata.copy_framework) setCopyFramework(parsedMetadata.copy_framework);
          if (parsedMetadata.persona_tone) setPersonaTone(parsedMetadata.persona_tone);
          if (parsedMetadata.main_selling_points) setMainSellingPoints(parsedMetadata.main_selling_points);
          if (parsedMetadata.sub_selling_points) setSubSellingPoints(parsedMetadata.sub_selling_points);
        }
        setGeneratedScript({ ...scriptData, id: scriptId });
        setCurrentVersion(version);
        setShowVersionDropdown(false);
      }
    } catch (error) {
      console.error('Failed to load script version:', error);
    }
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    setUploadedImages(prev => [...prev, ...files]);
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadedImages(prev => [...prev, ...files]);
    }
  };
  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };
  const handleGenerate = async () => {
    if (!features.trim()) {
      setErrorMessage('请输入产品介绍');
      setShowError(true);
      return;
    }
    console.log('[handleGenerate] selectedModel:', selectedModel, 'models:', models);
    if (!selectedModel) {
      setErrorMessage('请选择 AI 模型');
      setShowError(true);
      return;
    }
    setGenerating(true);
    try {
      const formData = new FormData();
      formData.append('project_id', id || '');
      formData.append('product_name', productName);
      formData.append('features', features);
      formData.append('duration', duration === 'custom' ? customDuration : duration);
      formData.append('model_id', selectedModel);
      formData.append('video_type', videoType);
      formData.append('creative_theme', creativeTheme);
      formData.append('copy_framework', copyFramework);
      formData.append('persona_tone', personaTone);
      formData.append('main_selling_points', mainSellingPoints);
      formData.append('sub_selling_points', subSellingPoints);
      if (creativeAnalysis) {
        formData.append('creative_analysis', JSON.stringify(creativeAnalysis));
      }
      uploadedImages.forEach((file, index) => {
        formData.append('images', file);
      });
      const response = await fetch('/api/ai/generate-script', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate script');
      }
      setGeneratedScript({
        ...data.script,
        id: data.scriptId
      });
      setCurrentVersion(data.version);
      setScriptExists(true);
      fetchScriptVersions();
    } catch (error) {
      console.error('Failed to generate script:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      setShowError(true);
    } finally {
      setGenerating(false);
    }
  };
  const handleNext = () => {
    navigate(`/project/${id}/storyboard`, { state: { script: generatedScript } });
  };
  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>;
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {showError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-red-600">{t('common.error')}</h3>
            <p className="text-gray-600">{errorMessage}</p>
            <button
              onClick={() => {
                setShowError(false);
                setErrorMessage('');
              }}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('script.step')}</h1>
            <p className="text-sm text-slate-500">{productName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg">1. 脚本</span>
          <span className="text-slate-300">→</span>
          <span className="px-4 py-2 text-slate-400 text-sm font-medium">2. 分镜</span>
          <span className="text-slate-300">→</span>
          <span className="px-4 py-2 text-slate-400 text-sm font-medium">3. 视频</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* 左栏：创作分析 */}
        <div className="col-span-3 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Check className="w-4 h-4 text-emerald-600" />
                </div>
                <h2 className="font-semibold text-slate-800">创作分析</h2>
              </div>
              <div className="flex items-center gap-2">
                {analysisConfirmed && (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-full">已确认</span>
                )}
              </div>
            </div>
            <div className="p-5 space-y-5">
              {analysisLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <span className="ml-2 text-slate-500">正在分析...</span>
                </div>
              ) : creativeAnalysis ? (
                <>
                  <div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                      主卖点
                    </label>
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">{creativeAnalysis.main_selling_points}</p>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                      次卖点
                    </label>
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">{creativeAnalysis.sub_selling_points}</p>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                      用户洞察
                    </label>
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">{creativeAnalysis.user_insight}</p>
                  </div>
                  <div className="pt-3 border-t border-slate-100">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                      口播文案
                    </label>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{creativeAnalysis.script_content}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowFullAnalysis(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    编辑
                    <ChevronDown className="w-3 h-3 rotate-[-90deg]" />
                  </button>
                </>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-sm">等待 AI 分析...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 中栏：配置面板 */}
        <div className="col-span-3 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              基本配置
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">产品介绍</label>
                <textarea
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm resize-none h-20 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  placeholder="请输入产品介绍..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">视频时长</label>
                <select
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  value={duration === 'custom' ? 'custom' : duration}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setDuration('custom');
                    } else {
                      setDuration(e.target.value);
                      setCustomDuration('');
                    }
                  }}
                >
                  <option value="5">5 秒</option>
                  <option value="10">10 秒</option>
                  <option value="15">15 秒</option>
                  <option value="30">30 秒</option>
                  <option value="60">60 秒</option>
                  <option value="custom">{t('script.customDuration')}</option>
                </select>
                {duration === 'custom' && (
                  <input
                    type="number"
                    min="1"
                    max="300"
                    className="mt-2 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="自定义时长"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(e.target.value)}
                  />
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">AI 模型</label>
                <select
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                >
                  {models.map((model: any) => (
                    <option key={model.id} value={model.Model_ID}>{model.Model_ID}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">产品图片</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    id="image-upload"
                    onChange={handleFileSelect}
                  />
                  <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center justify-center">
                    <Upload className="w-5 h-5 text-slate-400" />
                    <p className="text-xs text-slate-500 mt-1">上传图片</p>
                  </label>
                </div>
                {uploadedImages.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {uploadedImages.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Product ${index + 1}`}
                          className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full text-sm text-slate-500 hover:text-slate-700"
            >
              <span className="font-medium">高级创作选项</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>
            {showAdvanced && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">视频类型</label>
                    <select
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                      value={videoType}
                      onChange={(e) => setVideoType(e.target.value)}
                    >
                      {videoTypeOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">创意主题</label>
                    <select
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                      value={creativeTheme}
                      onChange={(e) => setCreativeTheme(e.target.value)}
                    >
                      {creativeThemeOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">文案框架</label>
                    <select
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                      value={copyFramework}
                      onChange={(e) => setCopyFramework(e.target.value)}
                    >
                      {copyFrameworkOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">人设语气</label>
                    <select
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                      value={personaTone}
                      onChange={(e) => setPersonaTone(e.target.value)}
                    >
                      {personaToneOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> 生成中...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" /> 生成脚本
              </>
            )}
          </button>
        </div>

        {/* 右栏：生成结果 */}
        <div className="col-span-6">
          <div className="bg-white rounded-2xl border border-slate-200 h-full">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <h2 className="font-semibold text-slate-800">生成结果</h2>
              </div>
              {generatedScript && (
                <div className="flex items-center gap-2">
                  {scriptVersions.length > 0 && (
                    <div className="relative">
                      <button
                        onClick={() => setShowVersionDropdown(!showVersionDropdown)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <History className="w-4 h-4" />
                        V{currentVersion}
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      {showVersionDropdown && (
                        <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
                          {scriptVersions.map((script: any) => (
                            <button
                              key={script.id}
                              onClick={() => loadScriptVersion(script.id, script.version)}
                              className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex justify-between items-center ${
                                script.version === currentVersion ? 'bg-blue-50 text-blue-700' : ''
                              }`}
                            >
                              <span>V{script.version}</span>
                              <span className="text-slate-400 text-xs">
                                {new Date(script.created_at).toLocaleDateString()}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                    重新生成
                  </button>
                  <button
                    onClick={handleNext}
                    className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                  >
                    下一步：分镜
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="p-5 space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto">
              {generatedScript ? (
                <>
                  {generatedScript.scenes && generatedScript.scenes.map((scene: Scene, index: number) => (
                    <div key={index} className="flex gap-4 p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all">
                      <div className="flex flex-col items-center gap-2 w-16 flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                          <span className="text-lg font-bold text-white">{String(index + 1).padStart(2, '0')}</span>
                        </div>
                        <span className="text-xs font-medium text-blue-600">{scene.duration || `${Math.floor(index * 10)}-${Math.floor((index + 1) * 10)}s`}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-slate-700">{scene.title || `场景 ${index + 1}`}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white rounded-lg p-3 border border-slate-100">
                            <span className="text-xs font-medium text-slate-400 block mb-1">口播</span>
                            <p className="text-sm text-slate-600 line-clamp-2">{scene.audio || scene.narration || '暂无口播内容'}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-slate-100">
                            <span className="text-xs font-medium text-slate-400 block mb-1">画面</span>
                            <p className="text-sm text-slate-500 line-clamp-2">{scene.visual || scene.description || '暂无画面描述'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-16 text-slate-400">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-sm">点击"生成脚本"开始创作</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 完整分析弹窗 */}
      {showFullAnalysis && creativeAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">完整创作分析</h3>
              <button
                onClick={() => setShowFullAnalysis(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(80vh-120px)]">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">主卖点</label>
                  <textarea
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none text-sm"
                    value={creativeAnalysis.main_selling_points}
                    onChange={(e) => setCreativeAnalysis({ ...creativeAnalysis, main_selling_points: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">次卖点</label>
                  <textarea
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none text-sm"
                    value={creativeAnalysis.sub_selling_points}
                    onChange={(e) => setCreativeAnalysis({ ...creativeAnalysis, sub_selling_points: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">用户洞察</label>
                <textarea
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none text-sm"
                  value={creativeAnalysis.user_insight}
                  onChange={(e) => setCreativeAnalysis({ ...creativeAnalysis, user_insight: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">口播文案</label>
                <textarea
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none text-sm"
                  value={creativeAnalysis.script_content}
                  onChange={(e) => setCreativeAnalysis({ ...creativeAnalysis, script_content: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  onClick={handleRegenerateAnalysis}
                  disabled={analysisLoading}
                  className="px-5 py-2.5 text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 flex items-center gap-2 disabled:opacity-50 transition-colors font-medium"
                >
                  <RefreshCw className={`w-4 h-4 ${analysisLoading ? 'animate-spin' : ''}`} />
                  重新分析
                </button>
                <button
                  onClick={() => {
                    handleConfirmAnalysis();
                    setShowFullAnalysis(false);
                  }}
                  disabled={analysisConfirmed}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 transition-colors font-medium shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  {analysisConfirmed ? '已确认' : '确认'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateScript;
