import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Loader2, ChevronDown, Play, Image as ImageIcon, Video, FileText, Sparkles } from 'lucide-react';

interface CreativeAnalysis {
  main_selling_points: string;
  sub_selling_points: string;
  user_insight: string;
  script_content: string;
}

interface Script {
  id: string;
  version: number;
  content: any;
  metadata: {
    creative_analysis?: CreativeAnalysis;
    [key: string]: any;
  };
  created_at: string;
}

interface Storyboard {
  id: string;
  script_id: string;
  sequence_number: number;
  image_prompt: string;
  image_url: string;
  video_url: string;
  metadata: any;
}

interface Video {
  id: string;
  script_id: string;
  video_url: string;
  thumbnail_url: string;
  duration_seconds: number;
  status: string;
}

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [currentScript, setCurrentScript] = useState<Script | null>(null);
  const [storyboards, setStoryboards] = useState<Storyboard[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
  
  useEffect(() => {
    fetchProject();
    fetchScripts();
  }, [id]);
  
  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setProject(data.project);
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
    }
  };
  
  const fetchScripts = async () => {
    try {
      const response = await fetch(`/api/scripts/project/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.scripts?.length > 0) {
        const sortedScripts = data.scripts.sort((a: Script, b: Script) => b.version - a.version);
        setScripts(sortedScripts);
        loadScriptData(sortedScripts[0]);
      }
    } catch (error) {
      console.error('Failed to fetch scripts:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadScriptData = async (script: Script) => {
    setCurrentScript(script);
    
    // Fetch storyboards for this script
    try {
      const response = await fetch(`/api/storyboards/script/${script.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStoryboards(data.storyboards || []);
      }
    } catch (error) {
      console.error('Failed to fetch storyboards:', error);
      setStoryboards([]);
    }
    
    // Fetch videos for this script
    try {
      const response = await fetch(`/api/videos/script/${script.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setVideos(data.videos || []);
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
      setVideos([]);
    }
    
    setShowVersionDropdown(false);
  };
  
  const getCreativeAnalysis = (): CreativeAnalysis | null => {
    if (!currentScript?.metadata?.creative_analysis) return null;
    return currentScript.metadata.creative_analysis;
  };
  
  const getScriptContent = () => {
    if (!currentScript?.content) return null;
    const content = currentScript.content;
    if (typeof content === 'string') {
      try {
        const parsed = JSON.parse(content);
        return parsed;
      } catch {
        return { title: content, scenes: [] };
      }
    }
    return content;
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">项目不存在</p>
      </div>
    );
  }
  
  const creativeAnalysis = getCreativeAnalysis();
  const scriptContent = getScriptContent();
  
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            创建于 {new Date(project.created_at).toLocaleDateString()}
          </p>
        </div>
        
        {/* Version Selector */}
        {scripts.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowVersionDropdown(!showVersionDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <span>版本 {currentScript?.version}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showVersionDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showVersionDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                {scripts.map((script) => (
                  <button
                    key={script.id}
                    onClick={() => loadScriptData(script)}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${
                      currentScript?.id === script.id ? 'bg-blue-50 text-blue-600' : ''
                    }`}
                  >
                    版本 {script.version}
                    <span className="text-xs text-gray-400 ml-2">
                      {new Date(script.created_at).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* No Scripts State */}
      {scripts.length === 0 && (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">暂无脚本数据</p>
          <button
            onClick={() => navigate(`/project/${id}/script`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            开始创作
          </button>
        </div>
      )}
      
      {/* Creative Analysis Section */}
      {scripts.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">创作分析</h2>
          </div>
          
          {creativeAnalysis ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-700 mb-2">主卖点</h3>
                <p className="text-sm text-gray-600">{creativeAnalysis.main_selling_points}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-purple-700 mb-2">次卖点</h3>
                <p className="text-sm text-gray-600">{creativeAnalysis.sub_selling_points}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-700 mb-2">用户洞察</h3>
                <p className="text-sm text-gray-600">{creativeAnalysis.user_insight}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-orange-700 mb-2">口播文案</h3>
                <p className="text-sm text-gray-600">{creativeAnalysis.script_content}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">暂无创作分析数据</p>
          )}
        </div>
      )}
      
      {/* Script Content Section */}
      {scripts.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">分镜脚本</h2>
          </div>
          
          {scriptContent?.scenes?.length > 0 ? (
            <div className="space-y-3">
              {scriptContent.scenes.map((scene: any, index: number) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                      {scene.scene_number || index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700"><span className="font-medium text-gray-900">口播文案：</span>{scene.audio || scene.narration || scene.description}</p>
                      {scene.visual && (
                        <p className="text-xs text-gray-500 mt-1"><span className="font-medium text-gray-700">画面描述：</span>{scene.visual}</p>
                      )}
                      {scene.visual_description && (
                        <p className="text-xs text-gray-500 mt-1"><span className="font-medium text-gray-700">画面描述：</span>{scene.visual_description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">暂无分镜脚本数据</p>
          )}
        </div>
      )}
      
      {/* Storyboard Images Section */}
      {scripts.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">分镜画面</h2>
          </div>
          
          {storyboards.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {storyboards
                .filter(s => s.image_url)
                .sort((a, b) => a.sequence_number - b.sequence_number)
                .map((storyboard) => (
                  <div key={storyboard.id} className="relative group">
                    <img
                      src={storyboard.image_url}
                      alt={`Scene ${storyboard.sequence_number}`}
                      className="w-full aspect-video object-cover rounded-lg border border-gray-200"
                    />
                    <span className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-0.5 rounded">
                      {storyboard.sequence_number}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">暂无分镜画面，请先生成画面</p>
          )}
        </div>
      )}
      
      {/* Storyboard Videos Section */}
      {scripts.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Video className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">分镜视频</h2>
          </div>
          
          {storyboards.filter(s => s.video_url).length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {storyboards
                .filter(s => s.video_url)
                .sort((a, b) => a.sequence_number - b.sequence_number)
                .map((storyboard) => (
                  <div key={storyboard.id} className="relative group">
                    <video
                      src={storyboard.video_url}
                      className="w-full aspect-video object-cover rounded-lg border border-gray-200"
                      controls
                    />
                    <span className="absolute top-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-0.5 rounded">
                      {storyboard.sequence_number}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">暂无分镜视频，请先生成视频</p>
          )}
        </div>
      )}
      
      {/* Final Video Section */}
      {scripts.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Play className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">合成视频</h2>
          </div>
          
          {videos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videos.map((video) => (
                <div key={video.id} className="relative">
                  <video
                    src={video.video_url}
                    className="w-full aspect-video object-cover rounded-lg border border-gray-200"
                    controls
                  />
                  {video.duration_seconds && (
                    <span className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-0.5 rounded">
                      {video.duration_seconds}s
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">暂无合成视频，请先生成</p>
          )}
        </div>
      )}
      

    </div>
  );
};

export default ProjectDetail;
