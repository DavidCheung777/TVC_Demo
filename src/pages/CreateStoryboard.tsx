import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { ArrowRight, Wand2, Loader2, Image as ImageIcon, Sparkles, Edit2, Check, X } from 'lucide-react';

const CreateStoryboard: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [script, setScript] = useState<any>(null);
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

  const imageSizeOptions = [
    { value: '2048x2048', label: '2048×2048 (1:1) 2K' },
    { value: '2560x1440', label: '2560×1440 (16:9) 2K' },
    { value: '1440x2560', label: '1440×2560 (9:16) 2K' },
    { value: '2304x1728', label: '2304×1728 (4:3) 2K' },
    { value: '1728x2304', label: '1728×2304 (3:4) 2K' },
    { value: '4096x4096', label: '4096×4096 (1:1) 4K' },
  ];

  const imageStyleOptions = [
    { value: 'Cinematic, Photorealistic', label: '电影感、写实' },
    { value: 'Anime, Illustration', label: '动漫、插画' },
    { value: '3D Render, CGI', label: '3D渲染' },
    { value: 'Watercolor, Artistic', label: '水彩、艺术' },
    { value: 'Minimalist, Clean', label: '极简、干净' },
    { value: 'Vintage, Retro', label: '复古、怀旧' },
  ];

  const startEditing = (scene: any) => {
    setEditingScene(scene.scene_number);
    setEditedVisual(scene.visual || '');
    setEditedAudio(scene.audio || '');
  };

  const cancelEditing = () => {
    setEditingScene(null);
    setEditedVisual('');
    setEditedAudio('');
  };

  const saveEditedScene = async (scene: any) => {
    if (!editedVisual.trim()) {
      setErrorMessage('Visual description cannot be empty');
      setShowError(true);
      return;
    }

    setSaving(true);
    try {
      const updatedScenes = script.scenes.map((s: any) => {
        if (s.scene_number === scene.scene_number) {
          return {
            ...s,
            visual: editedVisual,
            audio: editedAudio
          };
        }
        return s;
      });

      const response = await fetch(`/api/scripts/${script.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: {
            ...script,
            scenes: updatedScenes
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        setScript({
          ...script,
          scenes: updatedScenes
        });
        setEditingScene(null);
        setEditedVisual('');
        setEditedAudio('');
      } else {
        setErrorMessage(data.error || 'Failed to save changes');
        setShowError(true);
      }
    } catch (error) {
      console.error('Failed to save scene:', error);
      setErrorMessage('Failed to save changes');
      setShowError(true);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (location.state?.script) {
      setScript(location.state.script);
      // Pass the script ID directly to avoid stale state issues
      fetchStoryboards(location.state.script.id);
    } else {
      // Fallback: fetch script and storyboards from DB
      fetchScriptAndStoryboards();
    }
  }, [location.state, id]);

  const fetchStoryboards = async (specificScriptId?: string) => {
    try {
      let url = `/api/storyboards/project/${id}`;
      // Use the passed ID or fallback to state (though state might be stale in useEffect)
      const targetScriptId = specificScriptId || script?.id;
      
      if (targetScriptId) {
        url += `?script_id=${targetScriptId}`;
      }
      
      const storyboardResponse = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const storyboardData = await storyboardResponse.json();
      
      if (storyboardData.success && storyboardData.storyboards) {
        const latestStoryboards = new Map();
        storyboardData.storyboards.forEach((sb: any) => {
          const existing = latestStoryboards.get(sb.sequence_number);
          if (!existing || new Date(sb.created_at) > new Date(existing.created_at)) {
            latestStoryboards.set(sb.sequence_number, sb);
          }
        });
        
        const scriptScenes = script?.scenes || [];
        setStoryboards(Array.from(latestStoryboards.values()).map((sb: any) => {
          const sceneData = scriptScenes.find((s: any) => s.scene_number === sb.sequence_number);
          return {
            scene_number: sb.sequence_number,
            image_url: sb.image_url,
            visual: sb.image_prompt,
            duration: sceneData?.duration || 5
          };
        }));
      } else {
        // If searching with a specific script ID and nothing found, clear the list
        if (targetScriptId) {
            setStoryboards([]);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch storyboards:', error);
      setLoading(false);
    }
  };

  const fetchScriptAndStoryboards = async () => {
    try {
      // Fetch latest script
      const scriptResponse = await fetch(`/api/scripts/project/${id}/latest`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const scriptData = await scriptResponse.json();
      
      let scriptContent: any = null;
      
      if (scriptData.success && scriptData.script) {
        scriptContent = scriptData.script.content;
        
        // Handle both content and metadata fields
        if (typeof scriptContent === 'string' && !scriptContent.includes('scene_number')) {
          const metadata = scriptData.script.metadata;
          if (metadata) {
            const parsedMetadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
            if (Array.isArray(parsedMetadata)) {
              scriptContent = {
                title: scriptContent,
                scenes: parsedMetadata
              };
            }
          }
        } else if (typeof scriptContent === 'string') {
          try {
            scriptContent = JSON.parse(scriptContent);
          } catch (e) {
            // Keep as string
          }
        }
        
        setScript({
          ...scriptContent,
          id: scriptData.script.id
        });
      }
      
      // Fetch existing storyboards (reuse fetchStoryboards with new script state)
      // Note: We need to use the script id we just fetched, but state update is async.
      // So we call fetch directly here with the id.
      const currentScriptId = scriptData.script?.id;
      if (currentScriptId) {
         try {
            const storyboardResponse = await fetch(`/api/storyboards/project/${id}?script_id=${currentScriptId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const storyboardData = await storyboardResponse.json();
            
            if (storyboardData.success && storyboardData.storyboards) {
                const latestStoryboards = new Map();
                storyboardData.storyboards.forEach((sb: any) => {
                const existing = latestStoryboards.get(sb.sequence_number);
                if (!existing || new Date(sb.created_at) > new Date(existing.created_at)) {
                    latestStoryboards.set(sb.sequence_number, sb);
                }
                });
                
                const scriptScenes = scriptContent?.scenes || [];
                setStoryboards(Array.from(latestStoryboards.values()).map((sb: any) => {
                  const sceneData = scriptScenes.find((s: any) => s.scene_number === sb.sequence_number);
                  return {
                    scene_number: sb.sequence_number,
                    image_url: sb.image_url,
                    visual: sb.image_prompt,
                    duration: sceneData?.duration || 5
                  };
                }));
            } else {
                setStoryboards([]); // Clear storyboards if none found for this script ID
            }
         } catch (e) {
             console.error('Failed to fetch storyboards inside fetchScriptAndStoryboards:', e);
         }
      } else {
        await fetchStoryboards(scriptData.script?.id);
      }
    } catch (error) {
      console.error('Failed to fetch script and storyboards:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchImageModels = async () => {
      try {
        const response = await fetch('/api/ai/models?type=image', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success && data.models) {
          setImageModels(data.models);
          if (data.models.length > 0) {
            setSelectedModelId(data.models[0].Model_ID);
          }
        }
      } catch (error) {
        console.error('Failed to fetch image models:', error);
      }
    };
    
    if (token) {
      fetchImageModels();
    }
  }, [token]);

  const generateImages = async () => {
    setGenerating(true);
    const newStoryboards = [...storyboards];

    try {
      if (script && script.scenes) {
        for (const scene of script.scenes) {
          if (!scene.visual) {
            console.warn(`Scene ${scene.scene_number} is missing visual description. Skipping.`);
            continue;
          }

          const existingIndex = newStoryboards.findIndex(s => s.scene_number === scene.scene_number);
          if (existingIndex >= 0) {
            continue;
          }

          setGeneratingScene(scene.scene_number);

          const requestBody = {
            project_id: id,
            script_id: script?.id,
            prompt: scene.visual,
            size: imageSize,
            style: imageStyle,
            sequence_number: scene.scene_number,
            model_id: selectedModelId || undefined,
            watermark: watermark
          };
          
          console.log('Creating image task with params:', requestBody);

          // Create async task
          const response = await fetch('/api/ai/generate-image-async', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestBody)
          });
          
          const data = await response.json();
          if (data.success && data.task_id) {
            // Poll for task status
            const imageUrl = await pollTaskStatus(data.task_id);
            
            if (imageUrl) {
              newStoryboards.push({
                ...scene,
                image_url: imageUrl
              });
              setStoryboards([...newStoryboards]);
            }
          } else {
             console.error('Failed to create image task for scene', scene.scene_number, data.error);
             setErrorMessage(`Error generating scene ${scene.scene_number}: ${data.error}`);
             setShowError(true);
          }
        }
      }
    } catch (error) {
      console.error('Failed to generate images:', error);
    } finally {
      setGenerating(false);
      setGeneratingScene(null);
    }
  };

  const generateSingleImage = async (scene: any) => {
    if (!scene.visual) {
      setErrorMessage(`Scene ${scene.scene_number} is missing visual description.`);
      setShowError(true);
      return;
    }

    setGeneratingScene(scene.scene_number);

    try {
      const requestBody = {
        project_id: id,
        script_id: script?.id,
        prompt: scene.visual,
        size: imageSize,
        style: imageStyle,
        sequence_number: scene.scene_number,
        model_id: selectedModelId || undefined,
        watermark: watermark
      };
      
      console.log('Creating image task with params:', requestBody);

      // Create async task
      const response = await fetch('/api/ai/generate-image-async', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      if (data.success && data.task_id) {
        // Poll for task status
        const imageUrl = await pollTaskStatus(data.task_id);
        
        if (imageUrl) {
          const existingIndex = storyboards.findIndex(s => s.scene_number === scene.scene_number);
          const newStoryboard = {
            ...scene,
            image_url: imageUrl
          };
          
          if (existingIndex >= 0) {
            const updated = [...storyboards];
            updated[existingIndex] = newStoryboard;
            setStoryboards(updated);
          } else {
            setStoryboards([...storyboards, newStoryboard]);
          }
        }
      } else {
        console.error('Failed to create image task:', data.error);
        setErrorMessage(`Error: ${data.error}`);
        setShowError(true);
      }
    } catch (error) {
      console.error('Failed to generate image:', error);
      setErrorMessage('Failed to generate image');
      setShowError(true);
    } finally {
      setGeneratingScene(null);
    }
  };

  const pollTaskStatus = async (taskId: string): Promise<string | null> => {
    const maxAttempts = 120;
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
          console.error('Task failed:', data.error);
          setErrorMessage(data.error || 'Image generation failed');
          setShowError(true);
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
    
    setErrorMessage('Image generation timed out');
    setShowError(true);
    return null;
  };

  const handleNext = () => {
    // Navigate directly to the video page for this project
    // The video page will load the script and storyboards from the DB/state
    navigate(`/project/${id}/video`, { 
        state: { 
            storyboards: storyboards,
            script: script 
        } 
    });
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>;

  if (!script) {
    return (
        <div className="max-w-4xl mx-auto py-12 text-center">
            <h2 className="text-xl font-semibold text-gray-900">{t('storyboard.noScript.title')}</h2>
            <p className="text-gray-500 mt-2">{t('storyboard.noScript.desc')}</p>
            <button onClick={() => navigate(`/project/${id}/script`)} className="mt-4 text-blue-600 hover:underline">{t('storyboard.noScript.button')}</button>
        </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
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
        <h1 className="text-2xl font-bold text-gray-900">{t('storyboard.step')}</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span className="text-green-600 font-medium">{t('script.steps.script')}</span>
          <span>→</span>
          <span className="text-blue-600 font-medium">{t('script.steps.storyboard')}</span>
          <span>→</span>
          <span>{t('script.steps.video')}</span>
        </div>
      </div>

      {imageModels.length > 0 && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('storyboard.selectModel')}</label>
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {imageModels.map((model) => (
                  <option key={model.row_id} value={model.Model_ID}>
                    {model.Model_ID} {model.provider_name ? `(${model.provider_name})` : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('storyboard.imageSize')}</label>
              <select
                value={imageSize}
                onChange={(e) => setImageSize(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {imageSizeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('storyboard.imageStyle')}</label>
              <select
                value={imageStyle}
                onChange={(e) => setImageStyle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {imageStyleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('storyboard.watermark')}</label>
              <select
                value={watermark ? 'yes' : 'no'}
                onChange={(e) => setWatermark(e.target.value === 'yes')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="no">{t('common.no')}</option>
                <option value="yes">{t('common.yes')}</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">{t('storyboard.scenes')}</h2>
            <button
                onClick={generateImages}
                disabled={generating || storyboards.length === script.scenes.length}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
            >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                {storyboards.length > 0 ? t('storyboard.regenerate') : t('storyboard.generateAll')}
            </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {script.scenes.map((scene: any, index: number) => {
                const storyboard = storyboards.find(s => s.scene_number === scene.scene_number);
                const isGeneratingThis = generatingScene === scene.scene_number;
                return (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="aspect-video bg-gray-100 relative flex items-center justify-center">
                            {storyboard ? (
                                <img src={storyboard.image_url} alt={`Scene ${scene.scene_number}`} className="w-full h-full object-cover" />
                            ) : isGeneratingThis ? (
                                <div className="text-blue-500 flex flex-col items-center">
                                    <Loader2 className="w-8 h-8 mb-2 animate-spin" />
                                    <span className="text-xs">{t('storyboard.generating')}</span>
                                </div>
                            ) : (
                                <div className="text-gray-400 flex flex-col items-center">
                                    <ImageIcon className="w-8 h-8 mb-2" />
                                    <span className="text-xs">{t('storyboard.waiting')}</span>
                                </div>
                            )}
                            <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs font-medium">
                                {t('script.scene')} {scene.scene_number}
                            </div>
                            <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs font-medium">
                                {scene.duration}s
                            </div>
                        </div>
                        <div className="p-4 space-y-2">
                            {editingScene === scene.scene_number ? (
                              <>
                                <div>
                                  <label className="text-gray-500 text-xs uppercase tracking-wider block mb-1">{t('script.visual')}</label>
                                  <textarea
                                    value={editedVisual}
                                    onChange={(e) => setEditedVisual(e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    rows={3}
                                  />
                                </div>
                                <div>
                                  <label className="text-gray-500 text-xs uppercase tracking-wider block mb-1">{t('script.audio')}</label>
                                  <textarea
                                    value={editedAudio}
                                    onChange={(e) => setEditedAudio(e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    rows={2}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => saveEditedScene(scene)}
                                    disabled={saving}
                                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-1 disabled:opacity-50 text-sm"
                                  >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    {t('common.save')}
                                  </button>
                                  <button
                                    onClick={cancelEditing}
                                    disabled={saving}
                                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 text-sm"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex justify-between items-start">
                                  <p className="text-sm text-gray-700 font-medium line-clamp-2 flex-1" title={scene.visual}>
                                    <span className="text-gray-500 text-xs uppercase tracking-wider block mb-1">{t('script.visual')}</span>
                                    {scene.visual}
                                  </p>
                                  <button
                                    onClick={() => startEditing(scene)}
                                    className="ml-2 p-1 text-gray-400 hover:text-blue-600 transition"
                                    title={t('common.edit')}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-2" title={scene.audio}>
                                    <span className="text-gray-500 text-xs uppercase tracking-wider block mb-1">{t('script.audio')}</span>
                                    {scene.audio}
                                </p>
                                <button
                                    onClick={() => generateSingleImage(scene)}
                                    disabled={generatingScene !== null}
                                    className="w-full mt-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    {isGeneratingThis ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {t('storyboard.generating')}
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" />
                                            {storyboard ? t('storyboard.regenerateScene') : t('storyboard.generateScene')}
                                        </>
                                    )}
                                </button>
                              </>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
            onClick={() => navigate(`/project/${id}/script`)}
            className="px-8 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
        >
            {t('common.back')}
        </button>
        <button
            onClick={handleNext}
            disabled={storyboards.length === 0}
            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {t('storyboard.proceed')} <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default CreateStoryboard;
