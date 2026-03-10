import { TosClient } from '@volcengine/tos-sdk';

const accessKeyId = process.env.TOS_ACCESS_KEY || '';
const accessKeySecret = process.env.TOS_SECRET_KEY || '';
const endpoint = process.env.TOS_ENDPOINT || 'tos-cn-beijing.volces.com';
const region = process.env.TOS_REGION || 'cn-beijing';
const bucket = process.env.TOS_BUCKET || '';

let client: TosClient | null = null;

if (accessKeyId && accessKeySecret) {
  try {
    client = new TosClient({
      accessKeyId,
      accessKeySecret,
      endpoint,
      region,
    });
  } catch (error) {
    console.error('Failed to initialize TOS client:', error);
  }
}

export const getPreSignedUrl = (objectKey: string, ttl: number = 3600) => {
  if (!client) {
    throw new Error('TOS client is not initialized. Please check your environment variables.');
  }

  // Generate a pre-signed URL for PUT operation
  const url = client.getPreSignedUrl({
    bucket,
    key: objectKey,
    method: 'PUT',
    expires: ttl,
  });

  return url;
};

export const getDownloadUrl = (objectKey: string, ttl: number = 3600) => {
    if (!client) {
        throw new Error('TOS client is not initialized. Please check your environment variables.');
    }

    const url = client.getPreSignedUrl({
        bucket,
        key: objectKey,
        method: 'GET',
        expires: ttl,
    });

    return url;
}

export const uploadToTOS = async (objectKey: string, content: Buffer | string): Promise<void> => {
    if (!client) {
        throw new Error('TOS client is not initialized. Please check your environment variables.');
    }

    const body = typeof content === 'string' ? Buffer.from(content) : content;

    await client.putObject({
        bucket,
        key: objectKey,
        body: body as any,
    });
}
