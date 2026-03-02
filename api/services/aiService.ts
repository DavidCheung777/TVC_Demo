import axios from 'axios';
import dotenv from 'dotenv';
import { getDownloadUrl } from './tosService.js';
import { db } from './db.js';

dotenv.config();

const API_KEY = process.env.ARK_API_KEY || process.env.OPENAI_API_KEY;
const BASE_URL = process.env.ARK_BASE_URL || process.env.OPENAI_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
const TEXT_MODEL = process.env.ARK_MODEL_ID || 'doubao-pro-32k';

if (!API_KEY) {
  console.warn('ARK_API_KEY or OPENAI_API_KEY is not set. AI features will fallback to mock data.');
}

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
  },
  timeout: 120000,
});

export const generateScript = async (productName: string, features: string[], duration: number, style: string, images?: { name: string, type: string, data: string }[], modelId?: string) => {
  console.log('[generateScript] Received modelId:', modelId);
  // If no API key, use mock implementation
  if (!API_KEY) {
    console.log(`[Mock] Generating script for ${productName} (${style}, ${duration}s)`);
    return new Promise((resolve) => {
      setTimeout(() => {
        const sceneCount = duration <= 5 ? 3 : duration <= 10 ? 4 : 5;
        const baseDuration = Math.floor(duration / sceneCount);
        
        const scenes = [];
        for (let i = 1; i <= sceneCount; i++) {
          let visual = '';
          let audio = '';
          let sceneDuration = baseDuration;
          
          switch (i) {
            case 1:
              visual = `Opening shot of ${productName} in a well-lit, modern environment. Camera pans slowly to reveal its sleek design. Soft lighting highlights the product's premium finish.`;
              audio = `Introducing the all-new ${productName}. Designed for those who appreciate excellence.`;
              sceneDuration = baseDuration + 1;
              break;
            case 2:
              visual = `Close-up shot focusing on ${features[0] || 'innovative technology'}. A user's hand interacts with the product, demonstrating its intuitive interface. Cinematic depth of field.`;
              audio = `Experience the power of ${features[0] || 'innovation'} at your fingertips.`;
              sceneDuration = baseDuration;
              break;
            case 3:
              visual = `Lifestyle shot in a contemporary living space. The ${productName} seamlessly integrates into daily life, bringing joy and convenience. Natural lighting, warm tones.`;
              audio = `It's not just a product, it's a lifestyle upgrade.`;
              sceneDuration = baseDuration;
              break;
            case 4:
              visual = features[1] 
                ? `Feature highlight: ${features[1]}. Dynamic camera movement showcases the product's versatility. Split-screen effect showing multiple use cases.`
                : `Multiple users enjoy ${productName} together. Laughter and smiles fill the frame. The product brings people closer.`;
              audio = features[1] 
                ? `${features[1]}. Making every moment count.`
                : `Share the experience. Share the joy.`;
              sceneDuration = baseDuration;
              break;
            case 5:
              visual = `Product logo appears on screen with a call to action: "Available Now". Background fades to elegant brand colors. Subtle particle effects add premium feel.`;
              audio = `${productName}. Elevate your world. Get yours today.`;
              sceneDuration = baseDuration - 1;
              break;
          }
          
          scenes.push({
            scene_number: i,
            visual,
            audio,
            duration: Math.max(1, sceneDuration)
          });
        }
        
        resolve({
          title: `${productName} - ${style.charAt(0).toUpperCase() + style.slice(1)} Campaign`,
          total_duration: duration,
          style: style,
          scenes
        });
      }, 1500);
    });
  }

  try {
    const modelToUse = modelId || TEXT_MODEL;
    console.log(`[Real API] Generating script for ${productName} with model ${modelToUse}`);
    
    const systemPrompt = `You are a professional video script writer. Your task is to generate a video script for a product advertisement.
The output must be a valid JSON object with the following structure:
{
  "title": "Script Title",
  "scenes": [
    {
      "scene_number": 1,
      "visual": "Description of the visual",
      "audio": "Voiceover or dialogue",
      "duration": 5 (in seconds)
    }
  ]
}
Ensure the total duration is approximately ${duration} seconds. Return ONLY the JSON object, no markdown formatting or explanation.`;

    const userContent: any[] = [
      {
        type: "text",
        text: `Product Name: ${productName}
Features: ${features.join(', ')}
Style: ${style}
Duration: ${duration} seconds

Create a script that highlights these features in the requested style.`
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
  watermark?: boolean
): Promise<string> => {
  const mockImages = [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1024&h=1024&fit=crop',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1024&h=1024&fit=crop',
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=1024&h=1024&fit=crop',
    'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=1024&h=1024&fit=crop',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1024&h=1024&fit=crop',
    'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=1024&h=1024&fit=crop',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1024&h=1024&fit=crop',
    'https://images.unsplash.com/photo-1491553895911-0055uj8e0es?w=1024&h=1024&fit=crop',
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=1024&h=1024&fit=crop',
    'https://images.unsplash.com/photo-1585155770913-5bca09b66794?w=1024&h=1024&fit=crop'
  ];
  
  // If no model info, use mock implementation
  if (!modelInfo) {
    console.log(`[Mock] Generating image for prompt: ${prompt?.substring(0, 50)}...`);
    return new Promise((resolve) => {
      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * mockImages.length);
        resolve(mockImages[randomIndex]);
      }, 1500);
    });
  }

  try {
    console.log(`[Real API] Generating image with model:`, modelInfo?.name, 'id:', modelInfo?.id);
    
    // Get provider info from database
    const { data: providerData, error } = await db
      .from('providers')
      .select('*')
      .eq('code', modelInfo.provider);
    
    if (error || !providerData || providerData.length === 0) {
      console.error('Provider not found for model:', modelInfo.id, 'provider code:', modelInfo.provider);
      const randomIndex = Math.floor(Math.random() * mockImages.length);
      return mockImages[randomIndex];
    }

    const provider = providerData[0];
    const apiKey = provider.api_key;
    const endpoint = provider.endpoint;
    
    if (!apiKey || !endpoint) {
      console.error('Provider missing api_key or endpoint:', provider.name);
      const randomIndex = Math.floor(Math.random() * mockImages.length);
      return mockImages[randomIndex];
    }
    
    const modelIdToUse = provider.model_ids?.split(',')[0] || modelInfo.Model_ID || modelInfo.id || modelId;
    
    if (!modelIdToUse) {
      console.error('No model ID found for image generation');
      const randomIndex = Math.floor(Math.random() * mockImages.length);
      return mockImages[randomIndex];
    }
    
    console.log(`Calling image API at ${endpoint} with model ${modelIdToUse}`);
    console.log(`Request payload:`, JSON.stringify({
      model: modelIdToUse,
      prompt: prompt.substring(0, 100) + '...',
      size: size,
      response_format: 'url'
    }));
    
    // Call the actual image generation API (火山引擎 OpenAI compatible)
    const response = await axios.post(
      `${endpoint}/images/generations`,
      {
        model: modelIdToUse,
        prompt: prompt,
        size: size,
        response_format: 'url',
        watermark: watermark !== undefined ? watermark : false
      },
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
    
    // Fallback to mock if no URL returned
    console.log('No image URL in response, using mock');
    const randomIndex = Math.floor(Math.random() * mockImages.length);
    return mockImages[randomIndex];
  } catch (error) {
    console.error('Image generation error:', error.response?.data || error.message || error);
    // Fallback to mock on error
    const randomIndex = Math.floor(Math.random() * mockImages.length);
    return mockImages[randomIndex];
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
  
  // If no model info, use mock implementation
  if (!modelInfo) {
    console.log('[Mock] Simulating video generation for:', storyboards.length, 'scenes');
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          thumbnail_url: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=1920&h=1080&fit=crop',
          duration: duration,
          scenes: storyboards.length,
          music: music || 'Default Background'
        });
      }, 2000);
    });
  }

  try {
    console.log('[Real API] Generating video with model:', modelInfo?.name, 'id:', modelInfo?.id);
    
    // Get provider info from database
    const { data: providerData, error } = await db
      .from('providers')
      .select('*')
      .eq('code', modelInfo.provider);
    
    if (error || !providerData || providerData.length === 0) {
      console.error('Provider not found for model:', modelInfo.id, 'provider code:', modelInfo.provider);
      return {
        video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=1920&h=1080&fit=crop',
        duration: duration,
        scenes: storyboards.length
      };
    }

    const provider = providerData[0];
    const apiKey = provider.api_key || API_KEY;
    const baseUrl = provider.endpoint || BASE_URL;

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

      const requestBody = {
        model: modelInfo.Model_ID || modelInfo.id,
        content: content,
        resolution: resolution,
        ratio: params?.aspect_ratio || '16:9',
        duration: scene.duration || duration || 5,
        generate_audio: params?.has_audio !== false,
        draft: isDraft,
        watermark: false,
        seed: params?.seed
      };

      console.log('[Real API] Video request body:', JSON.stringify(requestBody, null, 2));

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
      
      console.log('[Real API] Video response:', JSON.stringify(response.data, null, 2));

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

    // For multiple scenes or no image - use mock
    console.log('Using mock video for multiple scenes or no image');
    return {
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnail_url: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=1920&h=1080&fit=crop',
      duration: duration,
      scenes: storyboards.length,
      music: music || 'Default Background'
    };

  } catch (error) {
    console.error('Video generation error:', error.response?.data || error.message || error);
    // Fallback to mock on error
    return {
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnail_url: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=1920&h=1080&fit=crop',
      duration: duration,
      scenes: storyboards.length
    };
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
