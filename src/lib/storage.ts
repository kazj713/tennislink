/**
 * 腾讯云COS对象存储服务
 * 用于图片、文件等资源的上传和管理
 */

import COS from 'cos-nodejs-sdk-v5';

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

export interface UploadOptions {
  folder?: string;
  fileName?: string;
  contentType?: string;
  isPublic?: boolean;
}

/**
 * 获取COS客户端
 */
export function getCOSClient() {
  const secretId = process.env.COS_SECRET_ID;
  const secretKey = process.env.COS_SECRET_KEY;
  const region = process.env.COS_REGION || 'ap-beijing';

  if (!secretId || !secretKey) {
    throw new Error('COS配置缺失：请设置 COS_SECRET_ID 和 COS_SECRET_KEY');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new COS({
    SecretId: secretId,
    SecretKey: secretKey,
    Region: region,
  } as any);
}

/**
 * 获取存储桶名称
 */
export function getBucketName(): string {
  const bucket = process.env.COS_BUCKET;
  if (!bucket) {
    throw new Error('COS配置缺失：请设置 COS_BUCKET');
  }
  return bucket;
}

/**
 * 检查存储服务是否可用
 * @returns 存储服务是否已配置
 */
export function isStorageAvailable(): boolean {
  const secretId = process.env.COS_SECRET_ID;
  const secretKey = process.env.COS_SECRET_KEY;
  const bucket = process.env.COS_BUCKET;
  
  return !!(secretId && secretKey && bucket);
}

/**
 * 生成文件路径
 */
function generateFilePath(folder: string, fileName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = fileName.split('.').pop();
  const name = fileName.split('.').slice(0, -1).join('.');
  
  return `${folder}/${timestamp}_${random}_${name}.${extension}`;
}

/**
 * 上传文件到COS
 */
export async function uploadFile(
  fileBuffer: Buffer,
  fileName: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    const cos = getCOSClient();
    const bucket = getBucketName();
    
    const folder = options.folder || 'uploads';
    const finalFileName = options.fileName || fileName;
    const filePath = generateFilePath(folder, finalFileName);
    
    const uploadParams = {
      Bucket: bucket,
      Region: process.env.COS_REGION || 'ap-beijing',
      Key: filePath,
      Body: fileBuffer,
      ContentType: options.contentType || 'application/octet-stream',
      ACL: options.isPublic ? 'public-read' : 'private',
    } as any;

    return new Promise((resolve, reject) => {
      cos.uploadFile(uploadParams, (err, data) => {
        if (err) {
          console.error('COS上传失败:', err);
          resolve({
            success: false,
            error: '文件上传失败'
          });
        } else {
          const cdnUrl = process.env.COS_CDN_URL;
          const url = cdnUrl ? `${cdnUrl}/${filePath}` : `https://${data.Location}`;
          
          resolve({
            success: true,
            url: url,
            key: filePath
          });
        }
      });
    });
  } catch (error) {
    console.error('上传文件异常:', error);
    return {
      success: false,
      error: '文件上传异常'
    };
  }
}

/**
 * 上传Base64图片
 */
export async function uploadBase64Image(
  base64Data: string,
  fileName: string,
  folder: string = 'images'
): Promise<UploadResult> {
  try {
    // 移除Base64前缀
    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Content, 'base64');
    
    return await uploadFile(buffer, fileName, {
      folder,
      contentType: 'image/jpeg',
      isPublic: true
    });
  } catch (error) {
    console.error('上传Base64图片失败:', error);
    return {
      success: false,
      error: '图片上传失败'
    };
  }
}

/**
 * 删除COS文件
 */
export async function deleteFile(key: string): Promise<{ success: boolean; error?: string }> {
  try {
    const cos = getCOSClient();
    const bucket = getBucketName();

    return new Promise((resolve) => {
      cos.deleteObject({
        Bucket: bucket,
        Region: process.env.COS_REGION || 'ap-beijing',
        Key: key,
      }, (err) => {
        if (err) {
          console.error('COS删除失败:', err);
          resolve({
            success: false,
            error: '文件删除失败'
          });
        } else {
          resolve({ success: true });
        }
      });
    });
  } catch (error) {
    console.error('删除文件异常:', error);
    return {
      success: false,
      error: '文件删除异常'
    };
  }
}

/**
 * 获取文件临时访问URL
 */
export async function getFileUrl(key: string, expires: number = 3600): Promise<string> {
  try {
    const cos = getCOSClient();
    const bucket = getBucketName();

    return new Promise((resolve, reject) => {
      cos.getObjectUrl({
        Bucket: bucket,
        Region: process.env.COS_REGION || 'ap-beijing',
        Key: key,
        Sign: true,
        Expires: expires,
      }, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data.Url);
        }
      });
    });
  } catch (error) {
    console.error('获取文件URL失败:', error);
    throw error;
  }
}

/**
 * 验证图片文件
 */
export function validateImageFile(buffer: Buffer, maxSize: number = 5 * 1024 * 1024): boolean {
  // 检查文件大小（默认5MB）
  if (buffer.length > maxSize) {
    return false;
  }

  // 检查文件头，验证是否为有效图片
  const signatures = [
    { ext: 'jpg', signature: [0xFF, 0xD8, 0xFF] },
    { ext: 'png', signature: [0x89, 0x50, 0x4E, 0x47] },
    { ext: 'gif', signature: [0x47, 0x49, 0x46] },
    { ext: 'webp', signature: [0x52, 0x49, 0x46, 0x46] }
  ];

  for (const { signature } of signatures) {
    let match = true;
    for (let i = 0; i < signature.length; i++) {
      if (buffer[i] !== signature[i]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }

  return false;
}