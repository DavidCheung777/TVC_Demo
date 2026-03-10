import axios from 'axios';
import dotenv from 'dotenv';
import { getDownloadUrl } from './tosService.js';
import { db } from './db.js';

dotenv.config();

interface ProviderConfig {
  endpoint: string;
  api_key: string;
}

async function getProviderConfig(): Promise<ProviderConfig> {
  try {
    const { data: providers, error } = await db
      .from('providers')
      .select('*')
      .eq('is_active', 1)
      .order('id', { ascending: true })
      .limit(1);

    if (!error && providers && providers.length > 0) {
      const provider = providers[0];
      return {
        endpoint: provider.endpoint,
        api_key: provider.api_key
      };
    }
  } catch (e) {
    console.warn('Failed to get provider config from database, falling back to environment variables');
  }

  return {
    endpoint: process.env.ARK_BASE_URL || process.env.OPENAI_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3',
    api_key: process.env.ARK_API_KEY || process.env.OPENAI_API_KEY || ''
  };
}

let config: ProviderConfig | null = null;
let client: any = null;

async function initClient() {
  if (!config) {
    config = await getProviderConfig();
  }
  if (!client) {
    client = axios.create({
      baseURL: config.endpoint,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.api_key}`,
      },
      timeout: 120000,
    });
  }
  return { config, client };
}

const TEXT_MODEL = process.env.ARK_MODEL_ID || 'doubao-pro-32k';

export interface ScriptGenerationParams {
  productName: string;
  features: string[];
  duration: number;
  videoType?: string;
  creativeTheme?: string;
  copyFramework?: string;
  personaTone?: string;
  mainSellingPoints?: string;
  subSellingPoints?: string;
  images?: { name: string; type: string; data: string }[];
  modelId?: string;
}

export interface CreativeAnalysisParams {
  productName: string;
  features: string[];
  modelId?: string;
}

export interface CreativeAnalysisResult {
  main_selling_points: string;
  sub_selling_points: string;
  user_insight: string;
  video_type: string;
  creative_theme: string;
  copy_framework: string;
  persona_tone: string;
  script_content: string;
}

export const generateCreativeAnalysis = async (params: CreativeAnalysisParams): Promise<CreativeAnalysisResult> => {
  const { productName, features, modelId } = params;

  console.log('[generateCreativeAnalysis] Received modelId:', modelId);

  const { config } = await initClient();

  if (!config.api_key) {
    throw new Error('API key not configured');
  }

  try {
    const { client } = await initClient();
    const modelToUse = modelId || TEXT_MODEL;
    console.log(`Generating creative analysis for ${productName} with model ${modelToUse}`);

    const systemPrompt = `你是一位专业的短视频广告编剧编导，擅长创作抖音电商短视频内容。请根据产品信息，生成创作分析。

## 输出要求

请输出以下内容：

### 1. 产品主次卖点
- 主卖点：1-2个核心价值点，作为信息锚点
- 次卖点：2-3个衍生价值点，丰富内容层次

### 2. 用户洞察
分析目标人群特征和心理需求：
- 人群：年龄/身份/场景特征/人生阶段等
- 用户心理：痛点场景、生活方式、社交情绪、价格敏感度、兴趣偏好等

### 3. 视频类型
从以下类型中选择1个最合适的：
- single_person: 单人口播
- multi_person: 多人口播
- drama: 剧情演绎
- vlog: Vlog记录
- mix_cut: 混剪

### 4. 创意主题
从以下主题中选择1个最合适的：
- product_showcase: 产品展示
- pain_point: 痛点讲述
- boss_ip: 老板IP
- factory_trace: 工厂溯源
- unboxing: 开箱评测
- life_scene: 生活场景
- comparison: 对比测评
- emotional: 情感共鸣

### 5. 文案框架
从以下框架中选择1个最合适的：
- AIDA: AIDA暴力转化模型
- SUCCESS: SUCCESS病毒模型
- GOLDEN_CIRCLE: 黄金圈法则
- HOOKED: Hooked上瘾模型
- FAB: FAB法则
- PAS: PAS问题解决
- 6WH1: 6WH1场景构建
- ENFP/INFP/INTJ/ESTP等: MBTI人格化叙事

### 6. 人设与语气
设定讲述者的身份定位和表达风格

### 7. 口播文案
撰写完整的口播文案（20-30秒），要求：
- 加入"人味噪点"：轻微的犹豫、自我修正、吐槽、感叹
- 遵循认知规律：自然表达节奏，避免公式化
- 完整口播内容，非片段

## 输出格式

必须返回有效的JSON对象，结构如下：
{
  "main_selling_points": "主卖点描述",
  "sub_selling_points": "次卖点描述",
  "user_insight": "用户洞察分析",
  "video_type": "视频类型代码",
  "creative_theme": "创意主题代码",
  "copy_framework": "文案框架代码",
  "persona_tone": "人设与语气描述",
  "script_content": "完整的口播文案内容"
}

只返回JSON对象，不要有markdown格式或额外说明。`;

    const requestBody = {
      model: modelToUse,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `请为以下产品生成创作分析：

## 产品信息
- 产品名称：${productName}
- 产品特点：${features.join('、')}

请输出完整的创作分析内容。`
        }
      ],
    };

    const response = await client.post('/chat/completions', requestBody);

    const content = response.data.choices[0].message.content;
    console.log('Creative Analysis API Response:', content);

    let analysisData;
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, '');
      analysisData = JSON.parse(cleanContent);
    } catch (e) {
      console.error('Failed to parse creative analysis response as JSON:', e);
      throw new Error('Invalid response format from AI');
    }

    return analysisData;

  } catch (error: any) {
    console.error('Creative Analysis Service Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Failed to generate creative analysis via AI');
  }
};

export const generateScript = async (params: ScriptGenerationParams) => {
  const { 
    productName, 
    features, 
    duration, 
    videoType = 'single_person',
    creativeTheme = 'product_showcase',
    copyFramework = 'AIDA',
    personaTone = 'friendly_professional',
    mainSellingPoints = '',
    subSellingPoints = '',
    images, 
    modelId 
  } = params;

  console.log('[generateScript] Received modelId:', modelId);
  
  const { config } = await initClient();
  
  if (!config.api_key) {
    throw new Error('API key not configured');
  }

  try {
    const { client } = await initClient();
    const modelToUse = modelId || TEXT_MODEL;
    console.log(`Generating script for ${productName} with model ${modelToUse}`);
    
    const systemPrompt = `你是一位专业的短视频广告编剧编导，擅长创作抖音电商短视频内容。请按照以下8步创作逻辑生成完整的广告脚本：

## 创作流程

### 1. 产品主次卖点分析
- 主卖点：1-2个核心价值点，作为信息锚点
- 次卖点：2-3个衍生价值点，丰富内容层次

### 2. 用户洞察
分析目标人群特征和心理需求：
- 痛点场景与功能需求
- 生活方式与价值认同
- 社交情绪与心理需求
- 价格敏感与性价比认知
- 兴趣偏好与文化符号

### 3. 视频类型
- 单人口播：单人面对镜头讲解
- 多人口播：多人对话或互动
- 剧情：有连续情节的故事
- vlog记录：第一人称视角
- 混剪：多画面剪辑拼接

### 4. 创意主题
视频的核心创意方向，如：老板IP、明星代言、产品痛点讲述、工厂溯源、打假测评、开箱评测、生活场景演绎等

### 5. 文案框架
- AIDA暴力转化：Attention → Interest → Desire → Action
- SUCCESS病毒模型：Simple + Unexpected + Concrete + Credible + Emotional + Story
- 黄金圈法则：Why → How → What
- Hooked上瘾模型：Trigger → Action → Reward → Investment
- FAB法则：Feature → Advantage → Benefit
- PAS问题解决：Problem → Agitate → Solution
- 6WH1：Who/What/When/Where/Why/How
- MBTI人格化叙事：16种人格风格

### 6. 人设与语气
设定讲述者的身份定位和表达风格

### 7. 口播文案撰写要求
- 加入"人味噪点"：轻微的犹豫、自我修正、吐槽、感叹
- 遵循认知规律：自然表达节奏，避免公式化
- 时长控制：短视频一般20-30秒
- 完整口播内容，非片段

### 8. 分镜脚本撰写
每个分镜包含：
- 场景编号和时长
- 口播文案
- 画面类型和描述
- 多模态提示词（用于AI生成画面/视频）

## 输出格式要求

必须返回有效的JSON对象，结构如下：
{
  "analysis": {
    "main_selling_points": "主卖点描述",
    "sub_selling_points": "次卖点描述",
    "user_insight": "用户洞察分析",
    "video_type": "视频类型",
    "creative_theme": "创意主题",
    "copy_framework": "文案框架",
    "persona_tone": "人设与语气"
  },
  "title": "脚本标题",
  "total_duration": 总时长,
  "scenes": [
    {
      "scene_number": 1,
      "duration": 5,
      "audio": "完整的口播文案内容",
      "visual_type": "画面类型（如：产品特写/生活场景/人物互动等）",
      "visual": "详细的画面描述",
      "image_prompt": "用于AI生成图片的英文提示词，包含：主体、动作、环境、光线、风格等",
      "video_prompt": "用于AI生成视频的英文提示词，包含：镜头运动、人物动作、场景转换等"
    }
  ]
}

确保总时长约为${duration}秒。只返回JSON对象，不要有markdown格式或额外说明。`;

    const userContent: any[] = [
      {
        type: "text",
        text: `请为以下产品创作短视频广告脚本：

## 产品信息
- 产品名称：${productName}
- 产品特点：${features.join('、')}
${mainSellingPoints ? `- 主卖点（可选参考）：${mainSellingPoints}` : ''}
${subSellingPoints ? `- 次卖点（可选参考）：${subSellingPoints}` : ''}

## 创作要求
- 视频时长：${duration}秒
- 视频类型：${videoType}
- 创意主题：${creativeTheme}
- 文案框架：${copyFramework}
- 人设语气：${personaTone}

请按照8步创作逻辑，输出完整的分析内容和分镜脚本。`
      }
    ];

    // Add images if provided
    if (images && images.length > 0) {
      images.forEach(img => {
        let url = img.data;
        // Check if it's a TOS key (simple heuristic: doesn't start with http or data:)
        if (url && !url.startsWith('http') && !url.startsWith('data:')) {
            try {
                url = getDownloadUrl(img.data, 3600); // Generate signed URL valid for 1 hour
            } catch (e) {
                console.warn('Failed to generate download URL for key:', img.data, e);
            }
        }

        userContent.push({
          type: "image_url",
          image_url: {
            url: url
          }
        });
      });
    }

    console.log(`Using model: ${modelToUse}`);

    const requestBody = {
      model: modelToUse,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userContent
        }
      ],
    };
    console.log('[AI API Request Body]:', JSON.stringify(requestBody, null, 2));

    const response = await client.post('/chat/completions', requestBody);

    const content = response.data.choices[0].message.content;
    console.log('API Response:', content);

    // Parse JSON
    let scriptData;
    try {
      // Clean up any markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '');
      scriptData = JSON.parse(cleanContent);
    } catch (e) {
      console.error('Failed to parse API response as JSON:', e);
      throw new Error('Invalid response format from AI');
    }

    return scriptData;

  } catch (error: any) {
    console.error('AI Service Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Failed to generate script via AI');
  }
};

export const generateImage = async (
  prompt: string,
  size: string = '1024x1024',
  style?: string,
  modelId?: string,
  modelInfo?: { id?: string; Model_ID?: string; name?: string; provider?: string; endpoint?: string; type?: string; apiKey?: string },
  watermark?: boolean,
  referenceImageUrls?: string[]
): Promise<string> => {
  if (!modelInfo) {
    throw new Error('Model info is required for image generation');
  }

  try {
    console.log(`Generating image with model:`, modelInfo?.name, 'id:', modelInfo?.id);
    if (referenceImageUrls && referenceImageUrls.length > 0) {
      console.log(`Using ${referenceImageUrls.length} reference images`);
    }
    
    const { data: providerData, error } = await db
      .from('providers')
      .select('*')
      .eq('code', modelInfo.provider);
    
    if (error || !providerData || providerData.length === 0) {
      console.error('Provider not found for model:', modelInfo.id, 'provider code:', modelInfo.provider);
      throw new Error('Provider not found');
    }

    const provider = providerData[0];
    const apiKey = provider.api_key;
    const endpoint = provider.endpoint;
    
    if (!apiKey || !endpoint) {
      console.error('Provider missing api_key or endpoint:', provider.name);
      throw new Error('Provider configuration missing');
    }
    
    const modelIdToUse = provider.model_ids?.split(',')[0] || modelInfo.Model_ID || modelInfo.id || modelId;
    
    if (!modelIdToUse) {
      console.error('No model ID found for image generation');
      throw new Error('Model ID not found');
    }
    
    const requestBody: any = {
      model: modelIdToUse,
      prompt: prompt,
      size: size,
      response_format: 'url',
      watermark: watermark !== undefined ? watermark : false,
      sequential_image_generation: 'disabled'
    };

    if (referenceImageUrls && referenceImageUrls.length > 0) {
      requestBody.image = referenceImageUrls;
    }
    
    console.log(`Calling image API at ${endpoint} with model ${modelIdToUse}`);
    console.log(`Request payload:`, JSON.stringify({
      ...requestBody,
      prompt: prompt.substring(0, 100) + '...'
    }));
    
    const response = await axios.post(
      `${endpoint}/images/generations`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 120000
      }
    );

    console.log(`API Response status:`, response.status);
    console.log(`API Response data:`, JSON.stringify(response.data).substring(0, 500));

    const result = response.data;
    const imageUrl = result.data?.[0]?.url || result.data?.data?.[0]?.url || null;
    
    if (imageUrl) {
      console.log(`Image generated successfully: ${imageUrl.substring(0, 50)}...`);
      return imageUrl;
    }
    
    throw new Error('No image URL in response');
  } catch (error: any) {
    console.error('Image generation error:', error.response?.data || error.message || error);
    throw new Error(error.response?.data?.error?.message || 'Failed to generate image');
  }
};

export const generateVideo = async (
  storyboards: any[], 
  duration: number, 
  music?: string,
  modelId?: string,
  modelInfo?: { id?: string; Model_ID?: string; name?: string; provider?: string; endpoint?: string; type?: string; apiKey?: string },
  params?: { resolution?: string; aspect_ratio?: string; has_audio?: boolean; demo_mode?: boolean; seed?: number }
): Promise<any> => {
  
  if (!modelInfo) {
    throw new Error('Model info is required for video generation');
  }

  try {
    console.log('Generating video with model:', modelInfo?.name, 'id:', modelInfo?.id);
    
    // Get provider info from database
    const { data: providerData, error } = await db
      .from('providers')
      .select('*')
      .eq('code', modelInfo.provider);
    
    if (error || !providerData || providerData.length === 0) {
      console.error('Provider not found for model:', modelInfo.id, 'provider code:', modelInfo.provider);
      throw new Error('Provider not found');
    }

    const provider = providerData[0];
    const apiKey = provider.api_key;
    const baseUrl = provider.endpoint;

    // For single scene video generation (image to video)
    if (storyboards.length === 1 && storyboards[0].image_url) {
      const scene = storyboards[0];
      
      // Build content array according to Volcano Engine API spec
      const content: any[] = [];
      
      // Add text prompt
      content.push({
        type: 'text',
        text: scene.visual || scene.image_prompt || 'Generate video from image'
      });
      
      // Add image as first frame
      content.push({
        type: 'image_url',
        image_url: {
          url: scene.image_url
        },
        role: 'first_frame'
      });

      const isDraft = params?.demo_mode === true;
      const resolution = isDraft ? '480p' : (params?.resolution || '720p');

      let videoDuration = scene.duration || duration || 5;
      const modelIdLower = (modelInfo.Model_ID || modelInfo.id || '').toLowerCase();
      if (modelIdLower.includes('seedance-1-5') || modelIdLower.includes('seedance-1.5')) {
        videoDuration = Math.min(videoDuration, 12);
      }

      const requestBody = {
        model: modelInfo.Model_ID || modelInfo.id,
        content: content,
        resolution: resolution,
        ratio: params?.aspect_ratio || '16:9',
        duration: videoDuration,
        generate_audio: params?.has_audio !== false,
        draft: isDraft,
        watermark: false,
        seed: params?.seed
      };

      console.log('Video request body:', JSON.stringify(requestBody, null, 2));

      const videoClient = axios.create({
        baseURL: baseUrl,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: 300000, // 5 minutes timeout for video generation
      });

      // API endpoint for video generation
      const response = await videoClient.post('/contents/generations/tasks', requestBody);
      
      console.log('Video response:', JSON.stringify(response.data, null, 2));

      const result = response.data;
      const taskId = result.id;
      
      if (taskId) {
        // Poll for task result
        const videoUrl = await pollVideoTask(videoClient, taskId);
        
        if (videoUrl) {
          console.log('Video generated successfully:', videoUrl.substring(0, 50) + '...');
          return {
            video_url: videoUrl,
            thumbnail_url: null,
            duration: scene.duration || duration,
            scenes: 1,
            task_id: taskId
          };
        }
      }
    }

    throw new Error('Multiple scenes or no image not supported yet');

  } catch (error: any) {
    console.error('Video generation error:', error.response?.data || error.message || error);
    throw new Error(error.response?.data?.error?.message || 'Failed to generate video');
  }
};

const pollVideoTask = async (client: any, taskId: string): Promise<string | null> => {
  const maxAttempts = 180; // 6 minutes max
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      const response = await client.get(`/contents/generations/tasks/${taskId}`);
      const result = response.data;
      
      console.log(`[Poll] Task ${taskId} status: ${result.status}`);
      
      if (result.status === 'succeeded' || result.status === 'completed') {
        console.log('[Poll] Full response:', JSON.stringify(result, null, 2));
        
        const videoUrl = result.content?.video_url 
          || result.output?.video_url 
          || result.output?.url
          || result.video_url 
          || result.data?.video_url
          || result.url
          || null;
        
        console.log('[Poll] Extracted video URL:', videoUrl);
        return videoUrl;
      }
      
      if (result.status === 'failed' || result.status === 'expired') {
        console.error('Video task failed:', result.error || 'Unknown error');
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
      console.error('Error polling video task:', error);
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
  
  console.error('Video task timed out');
  return null;
};
