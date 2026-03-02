import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { ArrowRight, Wand2, Loader2, Save, Upload, X, Image as ImageIcon, History, ChevronDown } from 'lucide-react';

const CreateScript: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [project, setProject] = useState<any>(null);

  // Form state
  const [productName, setProductName] = useState('');
  const [features, setFeatures] = useState('');
  const [duration, setDuration] = useState('5');
  const [customDuration, setCustomDuration] = useState('');
  const [style, setStyle] = useState('modern');
  const [models, setModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);

  // Generated Content
  const [generatedScript, setGeneratedScript] = useState<any>(null);
  
  // Script versions
  const [scriptVersions, setScriptVersions] = useState<any[]>([]);
  const [currentVersion, setCurrentVersion] = useState<number>(0);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);

  useEffect(() => {
    fetchProject();
    fetchModels();
    fetchLatestScript();
  }, [id]);

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/ai/models?type=text', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.models.length > 0) {
        setModels(data.models);
        const defaultModel = data.models.find((m: any) => m.Model_ID === 'doubao-seed-2-0-lite-260215') || data.models[0];
        setSelectedModel(defaultModel.id);
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
        // Handle both content and metadata fields
        let scriptData = data.script.content;
        
        // If content is just a title, check metadata for scenes
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
            // Keep as string
          }
        }
        
        setGeneratedScript({
          ...scriptData,
          id: data.script.id
        });
        setCurrentVersion(data.script.version);
        fetchScriptVersions();
      }
    } catch (error) {
      console.error('Failed to fetch latest script:', error);
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
        // Handle both content and metadata fields
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
            // Keep as string
          }
        }
        
        setGeneratedScript({
          ...scriptData,
          id: data.script.id
        });
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
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage(`${file.name} is too large. Max size is 5MB.`);
        setShowError(true);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setUploadedImages(prev => [...prev, ...validFiles]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
      
      const validFiles = files.filter(file => {
        if (file.size > 5 * 1024 * 1024) {
          setErrorMessage(`${file.name} is too large. Max size is 5MB.`);
          setShowError(true);
          return false;
        }
        return true;
      });

      if (validFiles.length > 0) {
        setUploadedImages(prev => [...prev, ...validFiles]);
      }
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadToTos = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to upload file');
      }

      return data.objectKey;
    } catch (error) {
      console.error('TOS Upload Error:', error);
      throw error;
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // Upload images to TOS
      let imagesData: { name: string; type: string; data: string }[] = [];
      if (uploadedImages.length > 0) {
        try {
          imagesData = await Promise.all(
            uploadedImages.map(async (file) => ({
              name: file.name,
              type: file.type,
              data: await uploadToTos(file)
            }))
          );
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          setErrorMessage(`Image upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
          setShowError(true);
          return;
        }
      }

      const response = await fetch('/api/ai/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          project_id: id,
          product_name: productName,
          features: features.split('\n').filter(f => f.trim()),
          duration: parseInt(duration === 'custom' ? customDuration : duration) || 5,
          style,
          images: imagesData,
          model_id: selectedModel
        })
      });
      
      const data = await response.json();
      if (data.success) {
        // Merge script_id into the script object so it can be used for filtering
        const scriptWithId = {
          ...data.script,
          id: data.script_id
        };
        setGeneratedScript(scriptWithId);
        if (data.version) {
          setCurrentVersion(data.version);
        }
        fetchScriptVersions();
      } else {
        console.error('API Error:', data.error);
        setErrorMessage(`Error: ${data.error}`);
        setShowError(true);
      }
    } catch (error) {
      console.error('Failed to generate script:', error);
      setErrorMessage(`Failed to generate script: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        <h1 className="text-2xl font-bold text-gray-900">{t('script.step')}</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span className="text-blue-600 font-medium">{t('script.steps.script')}</span>
          <span>→</span>
          <span>{t('script.steps.storyboard')}</span>
          <span>→</span>
          <span>{t('script.steps.video')}</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('script.productName')}</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('script.duration')}</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <option value="5">5s</option>
              <option value="10">10s</option>
              <option value="15">15s</option>
              <option value="30">30s</option>
              <option value="60">60s</option>
              <option value="custom">{t('script.customDuration')}</option>
            </select>
            {duration === 'custom' && (
              <input
                type="number"
                min="1"
                max="300"
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('script.customDurationPlaceholder')}
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
              />
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('script.style')}</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
            >
              <option value="modern">{t('script.styles.modern')}</option>
              <option value="emotional">{t('script.styles.emotional')}</option>
              <option value="professional">{t('script.styles.professional')}</option>
              <option value="humorous">{t('script.styles.humorous')}</option>
            </select>
          </div>
          
          {models.length > 0 ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('script.model')}</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                {models.map((model: any) => (
                  <option key={model.id} value={model.id}>{model.Model_ID} {model.provider ? `(${model.provider})` : ''}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">&nbsp;</label>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> {t('script.generating')}
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" /> {t('script.generate')}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('script.features')}</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-20"
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              placeholder={t('script.placeholder.features')}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('script.productImages')}</label>
            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                id="image-upload"
                onChange={handleFileSelect}
              />
              <label htmlFor="image-upload" className="cursor-pointer flex items-center justify-center gap-2">
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">{t('script.uploadPrompt')}</span>
              </label>
            </div>
            {uploadedImages.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {uploadedImages.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Product ${index + 1}`}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {models.length > 0 && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> {t('script.generating')}
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" /> {t('script.generate')}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">{t('script.output')}</h2>
          
          {scriptVersions.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowVersionDropdown(!showVersionDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                <History className="w-4 h-4" />
                {t('script.version')} {currentVersion}
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showVersionDropdown && (
                <div className="absolute right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  {scriptVersions.map((script: any) => (
                    <button
                      key={script.id}
                      onClick={() => loadScriptVersion(script.id, script.version)}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex justify-between items-center ${
                        script.version === currentVersion ? 'bg-blue-50 text-blue-700' : ''
                      }`}
                    >
                      <span>{t('script.version')} {script.version}</span>
                      <span className="text-gray-400 text-xs">
                        {new Date(script.created_at).toLocaleDateString()}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {generatedScript ? (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-xl mb-4">{generatedScript.title}</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {generatedScript.scenes?.map((scene: any, idx: number) => (
                  <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                    <div className="bg-gray-100 px-3 py-2 flex justify-between items-center">
                      <span className="font-medium text-gray-900">{t('script.scene')} {scene.scene_number}</span>
                      <span className="text-sm text-gray-500">{scene.duration}s</span>
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="bg-blue-50 p-2 rounded text-sm text-blue-900">
                        <span className="font-semibold">{t('script.visual')}:</span>
                        <p className="mt-1 line-clamp-3">{scene.visual}</p>
                      </div>
                      <div className="bg-green-50 p-2 rounded text-sm text-green-900">
                        <span className="font-semibold">{t('script.audio')}:</span>
                        <p className="mt-1 line-clamp-2">{scene.audio}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleNext}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
              >
                {t('script.proceed')} <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center text-gray-400 text-center">
            <FileText className="w-12 h-12 mb-2 opacity-50" />
            <p>{t('script.placeholder.script')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper icon
function FileText(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" x2="8" y1="13" y2="13" />
            <line x1="16" x2="8" y1="17" y2="17" />
            <line x1="10" x2="8" y1="9" y2="9" />
        </svg>
    );
}

export default CreateScript;
