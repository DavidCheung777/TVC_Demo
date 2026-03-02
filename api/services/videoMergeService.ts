import ffmpeg from 'fluent-ffmpeg';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { uploadToTOS, getDownloadUrl } from './tosService.js';

const TEMP_DIR = '/tmp/video-merge';

const ensureTempDir = () => {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
};

const downloadVideo = async (url: string, outputPath: string): Promise<void> => {
  const response = await axios({
    method: 'GET',
    url: url,
    responseType: 'stream',
    timeout: 60000
  });

  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
};

export const mergeVideos = async (videoUrls: string[]): Promise<string> => {
  ensureTempDir();
  
  const timestamp = Date.now();
  const inputFiles: string[] = [];
  
  for (let i = 0; i < videoUrls.length; i++) {
    const inputPath = path.join(TEMP_DIR, `input_${timestamp}_${i}.mp4`);
    console.log(`Downloading video ${i + 1}/${videoUrls.length}: ${videoUrls[i].substring(0, 50)}...`);
    await downloadVideo(videoUrls[i], inputPath);
    inputFiles.push(inputPath);
  }
  
  const listFilePath = path.join(TEMP_DIR, `list_${timestamp}.txt`);
  const listContent = inputFiles.map(f => `file '${f}'`).join('\n');
  fs.writeFileSync(listFilePath, listContent);
  
  const outputPath = path.join(TEMP_DIR, `output_${timestamp}.mp4`);
  
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(listFilePath)
      .inputOptions(['-f concat', '-safe 0'])
      .outputOptions(['-c copy'])
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log('FFmpeg command:', commandLine);
      })
      .on('end', async () => {
        console.log('Video merge completed');
        
        try {
          const fileBuffer = fs.readFileSync(outputPath);
          const tosKey = `merged-videos/${timestamp}_merged.mp4`;
          
          await uploadToTOS(tosKey, fileBuffer);
          console.log('Uploaded merged video to TOS:', tosKey);
          
          const downloadUrl = getDownloadUrl(tosKey, 86400);
          console.log('Generated download URL');
          
          inputFiles.forEach(f => {
            try { fs.unlinkSync(f); } catch (e) {}
          });
          try { fs.unlinkSync(listFilePath); } catch (e) {}
          try { fs.unlinkSync(outputPath); } catch (e) {}
          
          resolve(downloadUrl);
        } catch (error) {
          console.error('Error uploading merged video:', error);
          reject(error);
        }
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err);
        reject(err);
      })
      .run();
  });
};
