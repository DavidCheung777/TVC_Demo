import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { ArrowRight, Film, Loader2, CheckCircle, Download, Upload, Sparkles, RefreshCw } from 'lucide-react';

const CreateVideo: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuthStore();

  const [loading, setLoading] = useState(true);
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
    if (location.state?.script?.id) {
        setScriptId(location.state.script.id);
    }
    // If storyboards are passed in state, use them directly
    if (location.state?.storyboards && location.state.storyboards.length > 0) {
        setStoryboards(location.state.storyboards);
        fetchExistingVideos(location.state.storyboards, location.state?.script?.id, location.state?.script?.scenes);
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
      const data = await response.json();
      
      const sceneVideosData: {[key: number]: string} = {};
      
      if (data.success && data.storyboards) {
        data.storyboards.forEach((sb: any) => {
          if (sb.sequence_number && sb.video_url) {
            sceneVideosData[sb.sequence_number] = sb.video_url;
          }
        });
        
        const updatedStoryboards = storyboardsData.map((sb: any) => {
          const sceneData = scriptScenes?.find((s: any) => s.scene_number === sb.scene_number);
          return {
            ...sb,
            video_url: sceneVideosData[sb.scene_number] || sb.video_url,
            duration: sceneData?.duration || sb.duration || 5
          };
        });
        setStoryboards(updatedStoryboards);
      }
      
      const videosResponse = await fetch(`/api/videos/project/${id}${currentScriptId ? `?script_id=${currentScriptId}` : ''}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const videosData = await videosResponse.json();
      
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
      const data = await response.json();
      
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

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>;

  if (storyboards.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <h2 className="text-xl font-semibold text-gray-900">{t('video.noStoryboards.title')}</h2>
        <p className="text-gray-500 mt-2">{t('video.noStoryboards.desc')}</p>
        <button 
          onClick={() => navigate(`/project/${id}/storyboard`, { state: { script: location.state?.script } })} 
          className="mt-4 text-blue-600 hover:underline"
        >
          {t('video.noStoryboards.button')}
        </button>
      </div>
    );
  }

  const allScenesHaveVideos = Object.keys(sceneVideos).length === storyboards.length;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('video.step')}</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span className="text-green-600 font-medium">{t('script.steps.script')}</span>
          <span>→</span>
          <span className="text-green-600 font-medium">{t('script.steps.storyboard')}</span>
          <span>→</span>
          <span className="text-blue-600 font-medium">{t('script.steps.video')}</span>
        </div>
      </div>

      {videoModels.length > 0 && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('video.selectModel')}</label>
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {videoModels.map((model) => (
                  <option key={model.row_id} value={model.Model_ID}>
                    {model.Model_ID} {model.provider_name ? `(${model.provider_name})` : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('video.resolution')}</label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {resolutionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('video.aspectRatio')}</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {aspectRatioOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('video.hasAudio')}</label>
              <select
                value={hasAudio}
                onChange={(e) => setHasAudio(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {yesNoOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('video.demoMode')}</label>
              <select
                value={demoMode}
                onChange={(e) => setDemoMode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {yesNoOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {projectSeed && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="font-medium">{t('video.seed')}:</span>
                <code className="bg-gray-100 px-2 py-0.5 rounded font-mono">{projectSeed}</code>
                <span className="text-xs text-gray-400">({t('video.seedHint')})</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">{t('video.sceneVideos')}</h2>
          <button
            onClick={generateAllVideos}
            disabled={generatingAll || generatingScene !== null}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            {generatingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {allScenesHaveVideos ? t('video.regenerateAll') : t('video.generateAll')}
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {storyboards.map((scene: any, index: number) => {
            const sceneVideo = sceneVideos[scene.scene_number];
            const isGeneratingThis = generatingScene === scene.scene_number;
            
            return (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="aspect-video bg-gray-100 relative">
                  {sceneVideo ? (
                    <video 
                      src={sceneVideo} 
                      className="w-full h-full object-cover"
                      controls
                      muted
                    />
                  ) : isGeneratingThis ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-blue-500">
                      <Loader2 className="w-8 h-8 mb-2 animate-spin" />
                      <span className="text-xs">{t('video.generating')}</span>
                    </div>
                  ) : (
                    <img 
                      src={scene.image_url} 
                      alt={`Scene ${scene.scene_number}`} 
                      className="w-full h-full object-cover opacity-50"
                    />
                  )}
                  <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs font-medium">
                    {t('script.scene')} {scene.scene_number}
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs font-medium">
                    {scene.duration}s
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <p className="text-sm text-gray-700 font-medium line-clamp-2" title={scene.visual}>
                    {scene.visual}
                  </p>
                  <button
                    onClick={() => generateSceneVideo(scene)}
                    disabled={generatingScene !== null}
                    className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isGeneratingThis ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('video.generating')}
                      </>
                    ) : (
                      <>
                        {sceneVideo ? <RefreshCw className="w-4 h-4" /> : <Film className="w-4 h-4" />}
                        {sceneVideo ? t('video.regenerateScene') : t('video.generateScene')}
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!finalVideo ? (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="text-center py-8">
            <Film className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('video.mergeTitle')}</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {t('video.mergeDesc')}
            </p>
            <button
              onClick={handleGenerateFinalVideo}
              disabled={generatingScene !== null || Object.keys(sceneVideos).length === 0}
              className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
            >
              {generatingScene === -1 ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> {t('video.merging')}
                </>
              ) : (
                <>
                  <Film className="w-5 h-5" /> {t('video.mergeVideos')}
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
          <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg relative">
            <video 
              src={finalVideo.video_url}
              poster={finalVideo.thumbnail_url}
              preload="none"
              controls 
              className="w-full h-full"
            />
          </div>
          
          <div className="flex justify-between items-center bg-green-50 p-4 rounded-lg border border-green-100">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900">{t('video.success')}</h3>
                <p className="text-green-700 text-sm">{t('video.successDesc')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {pushSuccess && (
                <span className="text-green-600 text-sm font-medium">{t('video.pushSuccess')}</span>
              )}
              <button
                onClick={handlePushToLibrary}
                disabled={pushingToLibrary || pushSuccess}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
              >
                {pushingToLibrary ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {t('video.pushToLibrary')}
              </button>
              <a 
                href={finalVideo.video_url} 
                download 
                target="_blank"
                rel="noreferrer"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> {t('video.download')}
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center gap-4 pt-6">
        <button 
          onClick={() => navigate(`/project/${id}/storyboard`, { state: { script: location.state?.script } })}
          className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition font-medium"
        >
          {t('common.back')}
        </button>
        <button 
          onClick={() => navigate('/works')}
          className="px-6 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-medium"
        >
          {t('video.viewAll')}
        </button>
      </div>
    </div>
  );
};

export default CreateVideo;
