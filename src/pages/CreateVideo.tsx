import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { ArrowLeft, Film, Loader2, CheckCircle, Download, Upload, Sparkles, RefreshCw, Video, Check, X } from 'lucide-react';

const CreateVideo: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [script, setScript] = useState<any>(null);
  const [storyboards, setStoryboards] = useState<any[]>([]);
  const [sceneVideos, setSceneVideos] = useState<{[key: number]: string}>({});
  const [generatingScene, setGeneratingScene] = useState<number | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [finalVideo, setFinalVideo] = useState<any>(null);
  const [pushingToLibrary, setPushingToLibrary] = useState(false);
  const [pushSuccess, setPushSuccess] = useState(false);
  const [videoModels, setVideoModels] = useState<any[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [resolution, setResolution] = useState<string>('720p');
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [hasAudio, setHasAudio] = useState<string>('yes');
  const [demoMode, setDemoMode] = useState<string>('no');
  const [projectSeed, setProjectSeed] = useState<number | null>(null);
  const [scriptId, setScriptId] = useState<string | null>(null);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

  const resolutionOptions = [
    { value: '480p', label: '480p (标清)' },
    { value: '720p', label: '720p (高清)' },
    { value: '1080p', label: '1080p (全高清)' },
  ];

  const aspectRatioOptions = [
    { value: '16:9', label: '16:9 (横屏)' },
    { value: '9:16', label: '9:16 (竖屏)' },
    { value: '1:1', label: '1:1 (方形)' },
    { value: '4:3', label: '4:3 (传统)' },
    { value: '21:9', label: '21:9 (超宽)' },
  ];
  const yesNoOptions = [
    { value: 'yes', label: t('common.yes') },
    { value: 'no', label: t('common.no') },
  ];

  useEffect(() => {
    const stateScriptId = location.state?.scriptId || location.state?.script?.id;
    if (stateScriptId) {
        setScriptId(stateScriptId);
    }
    if (location.state?.storyboards && location.state.storyboards.length > 0) {
        const normalizedStoryboards = location.state.storyboards.map((sb: any) => ({
          ...sb,
          scene_number: sb.scene_number || sb.sequence_number,
          visual: sb.visual || sb.image_prompt
        }));
        setStoryboards(normalizedStoryboards);
        if (location.state?.script) {
          setScript(location.state.script);
        }
        fetchExistingVideos(normalizedStoryboards, stateScriptId, location.state?.script?.scenes);
        setLoading(false);
    } else {
        fetchStoryboardsFromDB();
    }
  }, [id, location.state]);

  const fetchExistingVideos = async (storyboardsData: any[], currentScriptId?: string, scriptScenes?: any[]) => {
    try {
      const response = await fetch(`/api/storyboards/project/${id}${currentScriptId ? `?script_id=${currentScriptId}` : ''}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let data = await response.json();
      if (currentScriptId && (!data.success || !data.storyboards || data.storyboards.length === 0)) {
        const fallbackResponse = await fetch(`/api/storyboards/project/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const fallbackData = await fallbackResponse.json();
        if (fallbackData.success && fallbackData.storyboards && fallbackData.storyboards.length > 0) {
          data = fallbackData;
        }
      }
      
      const sceneVideosData: {[key: number]: string} = {};
      
      if (data.success && data.storyboards) {
        data.storyboards.forEach((sb: any) => {
          if (sb.sequence_number && sb.video_url) {
            sceneVideosData[sb.sequence_number] = sb.video_url;
          }
        });
        
        const updatedStoryboards = storyboardsData.map((sb: any) => {
          const sceneNumber = sb.scene_number || sb.sequence_number;
          const sceneData = scriptScenes?.find((s: any) => s.scene_number === sceneNumber);
          return {
            ...sb,
            scene_number: sceneNumber,
            video_url: sceneVideosData[sceneNumber] || sb.video_url,
            duration: sceneData?.duration || sb.duration || 5
          };
        });
        setStoryboards(updatedStoryboards);
      }
      
      const videosResponse = await fetch(`/api/videos/project/${id}${currentScriptId ? `?script_id=${currentScriptId}` : ''}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let videosData = await videosResponse.json();
      if (currentScriptId && (!videosData.success || !videosData.videos || videosData.videos.length === 0)) {
        const fallbackVideosResponse = await fetch(`/api/videos/project/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const fallbackVideosData = await fallbackVideosResponse.json();
        if (fallbackVideosData.success && fallbackVideosData.videos && fallbackVideosData.videos.length > 0) {
          videosData = fallbackVideosData;
        }
      }
      
      if (videosData.success && videosData.videos && videosData.videos.length > 0) {
        const latestVideo = videosData.videos.find((v: any) => !v.scene_number);
        if (latestVideo) {
          setFinalVideo({ 
            video_url: latestVideo.video_url,
            thumbnail_url: latestVideo.thumbnail_url,
            duration: latestVideo.duration_seconds
          });
        }
      }
      
      setSceneVideos(sceneVideosData);
    } catch (error) {
      console.error('Failed to fetch existing videos:', error);
    }
  };

  const fetchStoryboardsFromDB = async () => {
    try {
      const projectResponse = await fetch(`/api/projects/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const projectData = await projectResponse.json();
      if (projectData.success && projectData.project) {
        setProjectSeed(projectData.project.seed);
      }

      const scriptResponse = await fetch(`/api/scripts/project/${id}/latest`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const scriptData = await scriptResponse.json();
      
      let sceneDurations: {[key: number]: number} = {};
      let validSceneNumbers: Set<number> | null = null;
      let currentScriptId = location.state?.script?.id;

      if (scriptData.success && scriptData.script) {
        if (!currentScriptId) {
            currentScriptId = scriptData.script.id;
            setScriptId(currentScriptId);
        }
        let scriptContent = scriptData.script.content;
        if (typeof scriptContent === 'string') {
          try {
            scriptContent = JSON.parse(scriptContent);
          } catch (e) {}
        }
        
        if (scriptContent && scriptContent.scenes) {
          setScript(scriptContent);
          validSceneNumbers = new Set(scriptContent.scenes.map((s: any) => s.scene_number));
          scriptContent.scenes.forEach((scene: any) => {
            if (scene.scene_number && scene.duration) {
              sceneDurations[scene.scene_number] = scene.duration;
            }
          });
        }
      }
      
      const response = await fetch(`/api/storyboards/project/${id}${currentScriptId ? `?script_id=${currentScriptId}` : ''}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let data = await response.json();
      if (currentScriptId && (!data.success || !data.storyboards || data.storyboards.length === 0)) {
        const fallbackResponse = await fetch(`/api/storyboards/project/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const fallbackData = await fallbackResponse.json();
        if (fallbackData.success && fallbackData.storyboards && fallbackData.storyboards.length > 0) {
          data = fallbackData;
        }
      }
      
      if (data.success && data.storyboards) {
        const latestStoryboards = new Map();
        data.storyboards.forEach((sb: any) => {
          const existing = latestStoryboards.get(sb.sequence_number);
          if (!existing || new Date(sb.created_at) > new Date(existing.created_at)) {
            latestStoryboards.set(sb.sequence_number, sb);
          }
        });
        
        const storyboardsData = Array.from(latestStoryboards.values())
          .filter((sb: any) => !validSceneNumbers || validSceneNumbers.has(sb.sequence_number))
          .map((sb: any) => ({
            scene_number: sb.sequence_number,
            image_url: sb.image_url,
            visual: sb.image_prompt,
            duration: sceneDurations[sb.sequence_number] || 5,
            video_url: sb.video_url
          }))
          .sort((a, b) => a.scene_number - b.scene_number);
        
        setStoryboards(storyboardsData);
        
        const videos: {[key: number]: string} = {};
        storyboardsData.forEach((sb: any) => {
          if (sb.video_url) {
            videos[sb.scene_number] = sb.video_url;
          }
        });
        setSceneVideos(videos);
      }
      
      const videosResponse = await fetch(`/api/videos/project/${id}${currentScriptId ? `?script_id=${currentScriptId}` : ''}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const videosData = await videosResponse.json();
      
      if (videosData.success && videosData.videos && videosData.videos.length > 0) {
        const latestVideo = videosData.videos[0];
        setFinalVideo({ 
          video_url: latestVideo.video_url,
          thumbnail_url: latestVideo.thumbnail_url,
          duration: latestVideo.duration_seconds
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch storyboards:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchVideoModels = async () => {
      try {
        const response = await fetch('/api/ai/models?type=video', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success && data.models) {
          setVideoModels(data.models);
          if (data.models.length > 0) {
            setSelectedModelId(data.models[0].Model_ID);
          }
        }
      } catch (error) {
        console.error('Failed to fetch video models:', error);
      }
    };
    
    if (token) {
      fetchVideoModels();
    }
  }, [token]);

  const generateSceneVideo = async (scene: any) => {
    setGeneratingScene(scene.scene_number);
    
    try {
      const response = await fetch('/api/ai/generate-video-async', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          project_id: id,
          script_id: scriptId,
          scene: scene,
          duration: scene.duration || 5,
          model_id: selectedModelId || undefined,
          resolution,
          aspect_ratio: aspectRatio,
          has_audio: hasAudio === 'yes',
          demo_mode: demoMode === 'yes'
        })
      });

      const data = await response.json();
      if (data.success && data.task_id) {
        const videoUrl = await pollTaskStatus(data.task_id);
        if (videoUrl) {
          setSceneVideos(prev => ({
            ...prev,
            [scene.scene_number]: videoUrl
          }));
          setFinalVideo(null);
        }
      }
    } catch (error) {
      console.error('Failed to generate scene video:', error);
    } finally {
      setGeneratingScene(null);
    }
  };

  const generateAllVideos = async () => {
    setGeneratingAll(true);
    setFinalVideo(null);
    
    for (const scene of storyboards) {
      if (!sceneVideos[scene.scene_number]) {
        await generateSceneVideo(scene);
      }
    }
    
    setGeneratingAll(false);
  };

  const pollTaskStatus = async (taskId: string): Promise<string | null> => {
    const maxAttempts = 180;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`/api/ai/tasks/${taskId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.status === 'completed' && data.result?.video_url) {
          return data.result.video_url;
        }
        
        if (data.status === 'failed') {
          console.error('Task failed:', data.error);
          return null;
        }
        
        let interval: number;
        if (attempts < 6) {
          interval = 12 - 2 * attempts;
        } else {
          interval = 2 + 10 * (attempts - 5);
        }
        console.log(`[Poll] Waiting ${interval}s before next poll (attempt ${attempts + 1})`);
        await new Promise(resolve => setTimeout(resolve, interval * 1000));
        attempts++;
      } catch (error) {
        console.error('Error polling task status:', error);
        let interval: number;
        if (attempts < 6) {
          interval = 12 - 2 * attempts;
        } else {
          interval = 2 + 10 * (attempts - 5);
        }
        await new Promise(resolve => setTimeout(resolve, interval * 1000));
        attempts++;
      }
    }
    
    return null;
  };

  const handleGenerateFinalVideo = async () => {
    setGeneratingScene(-1);
    
    try {
      const response = await fetch('/api/ai/generate-video-async', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          project_id: id,
          script_id: scriptId,
          storyboards: storyboards,
          scene_videos: sceneVideos,
          duration: storyboards.reduce((acc, curr) => acc + (curr.duration || 5), 0),
          model_id: selectedModelId || undefined,
          resolution,
          aspect_ratio: aspectRatio,
          has_audio: hasAudio === 'yes',
          demo_mode: demoMode === 'yes'
        })
      });

      const data = await response.json();
      if (data.success && data.task_id) {
        const videoUrl = await pollTaskStatus(data.task_id);
        if (videoUrl) {
          setFinalVideo({ video_url: videoUrl });
        }
      }
    } catch (error) {
      console.error('Failed to generate final video:', error);
    } finally {
      setGeneratingScene(null);
    }
  };

  const handlePushToLibrary = async () => {
    if (!finalVideo) return;
    
    setPushingToLibrary(true);
    try {
      const response = await fetch('/api/library', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          project_id: id,
          type: 'video',
          url: finalVideo.video_url,
          thumbnail_url: finalVideo.thumbnail_url,
          duration: storyboards.reduce((acc, curr) => acc + (curr.duration || 5), 0),
          metadata: {
            scenes: storyboards.length
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        setPushSuccess(true);
        setTimeout(() => setPushSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Failed to push to library:', error);
    } finally {
      setPushingToLibrary(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (storyboards.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <Film className="w-16 h-16 mx-auto text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-700 mb-2">{t('video.noStoryboards.title')}</h2>
        <p className="text-slate-500 mb-4">{t('video.noStoryboards.desc')}</p>
        <button 
          onClick={() => navigate(`/project/${id}/storyboard`, { state: { script: location.state?.script } })} 
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {t('video.noStoryboards.button')}
        </button>
      </div>
    );
  }

  const allScenesHaveVideos = Object.keys(sceneVideos).length === storyboards.length;
  const totalDuration = storyboards.reduce((acc, curr) => acc + (curr.duration || 5), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/project/${id}/storyboard`)}
            className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            返回分镜
          </button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('video.step')}</h1>
            <p className="text-sm text-slate-500">{script?.title || '视频创作'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-4 py-2 text-slate-400 text-sm font-medium">1. 脚本</span>
          <span className="text-slate-300">→</span>
          <span className="px-4 py-2 text-slate-400 text-sm font-medium">2. 分镜</span>
          <span className="text-slate-300">→</span>
          <span className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg">3. 视频</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* 左栏：视频信息 */}
        <div className="col-span-3 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Film className="w-4 h-4 text-blue-600" />
                </div>
                <h2 className="font-semibold text-slate-800">视频信息</h2>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">场景数量</span>
                <span className="font-medium text-slate-800">{storyboards.length} 个</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">总时长</span>
                <span className="font-medium text-slate-800">{totalDuration} 秒</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">已生成视频</span>
                <span className="font-medium text-emerald-600">{Object.keys(sceneVideos).length} 个</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">最终视频</span>
                <span className={`font-medium ${finalVideo ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {finalVideo ? '已完成' : '待合成'}
                </span>
              </div>
              <div className="pt-3 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">场景列表</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {storyboards.map((scene: any, index: number) => {
                    const hasVideo = sceneVideos[scene.scene_number];
                    return (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className={`w-5 h-5 rounded flex items-center justify-center text-xs font-medium ${hasVideo ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                          {scene.scene_number}
                        </div>
                        <span className="text-slate-600 truncate flex-1">{scene.visual?.slice(0, 20) || `场景 ${scene.scene_number}`}...</span>
                        {hasVideo && <Check className="w-3 h-3 text-emerald-500" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 最终视频预览 */}
          {finalVideo && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h2 className="font-semibold text-slate-800">最终视频</h2>
                </div>
              </div>
              <div className="p-4">
                <div className="aspect-video bg-black rounded-xl overflow-hidden mb-4">
                  <button
                    type="button"
                    onClick={() => setActiveVideoUrl(finalVideo.video_url)}
                    className="w-full h-full"
                  >
                    <video 
                      src={finalVideo.video_url}
                      poster={finalVideo.thumbnail_url}
                      preload="metadata"
                      muted
                      className="w-full h-full"
                      onMouseEnter={(e) => e.currentTarget.play()}
                      onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                    />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handlePushToLibrary}
                    disabled={pushingToLibrary || pushSuccess}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-1 disabled:opacity-50 text-sm"
                  >
                    {pushingToLibrary ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {pushSuccess ? '已推送' : '推送作品库'}
                  </button>
                  <a 
                    href={finalVideo.video_url} 
                    download 
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center justify-center gap-1 text-sm"
                  >
                    <Download className="w-4 h-4" /> 下载
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 中栏：配置面板 */}
        <div className="col-span-3 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              生成配置
            </h2>
            <div className="space-y-4">
              {videoModels.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">AI 模型</label>
                  <select
                    value={selectedModelId}
                    onChange={(e) => setSelectedModelId(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  >
                    {videoModels.map((model) => (
                      <option key={model.id} value={model.Model_ID}>
                        {model.Model_ID}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">分辨率</label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                >
                  {resolutionOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">画面比例</label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                >
                  {aspectRatioOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">生成音频</label>
                <select
                  value={hasAudio}
                  onChange={(e) => setHasAudio(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                >
                  {yesNoOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">草稿模式</label>
                <select
                  value={demoMode}
                  onChange={(e) => setDemoMode(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                >
                  {yesNoOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              {projectSeed && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-medium">Seed:</span>
                    <code className="bg-slate-100 px-2 py-0.5 rounded font-mono text-xs">{projectSeed}</code>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 生成按钮 */}
          <button
            onClick={generateAllVideos}
            disabled={generatingAll || generatingScene !== null}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {generatingAll ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> 生成中...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" /> {allScenesHaveVideos ? '重新生成全部' : '生成全部视频'}
              </>
            )}
          </button>

          {/* 合成最终视频按钮 */}
          {!finalVideo && (
            <button
              onClick={handleGenerateFinalVideo}
              disabled={generatingScene !== null || Object.keys(sceneVideos).length === 0}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/35 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generatingScene === -1 ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> 合成中...
                </>
              ) : (
                <>
                  <Film className="w-5 h-5" /> 合成最终视频
                </>
              )}
            </button>
          )}
        </div>

        {/* 右栏：场景视频展示 */}
        <div className="col-span-6">
          <div className="bg-white rounded-2xl border border-slate-200 h-full">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Video className="w-4 h-4 text-blue-600" />
                </div>
                <h2 className="font-semibold text-slate-800">场景视频</h2>
              </div>
              <span className="text-sm text-slate-500">
                {Object.keys(sceneVideos).length} / {storyboards.length} 已生成
              </span>
            </div>
            
            <div className="p-5 space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto">
              {storyboards.map((scene: any, index: number) => {
                const sceneVideo = sceneVideos[scene.scene_number];
                const isGeneratingThis = generatingScene === scene.scene_number;
                
                return (
                  <div key={index} className="flex gap-4 p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all">
                    <div className="w-32 h-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                      {sceneVideo ? (
                        <button
                          type="button"
                          onClick={() => setActiveVideoUrl(sceneVideo)}
                          className="w-full h-full"
                        >
                          <video 
                            src={sceneVideo} 
                            className="w-full h-full object-cover"
                            muted
                            preload="metadata"
                            onMouseEnter={(e) => e.currentTarget.play()}
                            onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                          />
                        </button>
                      ) : isGeneratingThis ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                        </div>
                      ) : (
                        <img 
                          src={scene.image_url} 
                          alt={`Scene ${scene.scene_number}`} 
                          className="w-full h-full object-cover opacity-50"
                        />
                      )}
                      <div className="absolute top-1 left-1 bg-black/50 text-white px-1.5 py-0.5 rounded text-xs font-medium">
                        {String(scene.scene_number).padStart(2, '0')}
                      </div>
                      <div className="absolute bottom-1 right-1 bg-black/50 text-white px-1.5 py-0.5 rounded text-xs font-medium">
                        {scene.duration}s
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-slate-700">场景 {scene.scene_number}</span>
                        {sceneVideo && (
                          <span className="text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">已生成</span>
                        )}
                      </div>
                      
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3" title={scene.visual}>
                        {scene.visual}
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => generateSceneVideo(scene)}
                          disabled={generatingScene !== null}
                          className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs hover:bg-slate-200 flex items-center gap-1 disabled:opacity-50"
                        >
                          {isGeneratingThis ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" /> 生成中
                            </>
                          ) : (
                            <>
                              {sceneVideo ? <RefreshCw className="w-3 h-3" /> : <Film className="w-3 h-3" />}
                              {sceneVideo ? '重新生成' : '生成视频'}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {activeVideoUrl && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setActiveVideoUrl(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">视频预览</span>
              <button
                type="button"
                onClick={() => setActiveVideoUrl(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-black">
              <video src={activeVideoUrl} className="w-full h-full" controls />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CreateVideo;
