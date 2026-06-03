/**
 * 安全配置和工具函数
 */

import crypto from 'crypto';

/**
 * 安全配置常量
 */
export const SECURITY_CONFIG = {
  // 密码安全
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  PASSWORD_REQUIRE_UPPERCASE: true,
  PASSWORD_REQUIRE_LOWERCASE: true,
  PASSWORD_REQUIRE_NUMBERS: true,
  PASSWORD_REQUIRE_SYMBOLS: false,
  
  // JWT配置
  JWT_EXPIRES_IN: '7d',
  REFRESH_TOKEN_EXPIRES_IN: '30d',
  
  // 速率限制
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15分钟
  RATE_LIMIT_MAX_REQUESTS: 100, // 最多100次请求
  
  // 文件上传限制
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword'],
  
  // XSS防护
  XSS_ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
  
  // CORS配置 - 从环境变量读取，支持多个域名
  CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS 
    ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(s => s.trim())
    : [
        'http://localhost:3000',
        'http://localhost:5000',
        'https://ydtenhub.online',
        'https://www.ydtenhub.online'
      ],
  CORS_ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  CORS_ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'X-Requested-With'],
  
  // 安全头配置
  SECURITY_HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  }
};

/**
 * 密码验证
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < SECURITY_CONFIG.PASSWORD_MIN_LENGTH) {
    errors.push(`密码长度至少${SECURITY_CONFIG.PASSWORD_MIN_LENGTH}位`);
  }
  
  if (password.length > SECURITY_CONFIG.PASSWORD_MAX_LENGTH) {
    errors.push(`密码长度不能超过${SECURITY_CONFIG.PASSWORD_MAX_LENGTH}位`);
  }
  
  if (SECURITY_CONFIG.PASSWORD_REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('密码必须包含至少一个大写字母');
  }
  
  if (SECURITY_CONFIG.PASSWORD_REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('密码必须包含至少一个小写字母');
  }
  
  if (SECURITY_CONFIG.PASSWORD_REQUIRE_NUMBERS && !/\d/.test(password)) {
    errors.push('密码必须包含至少一个数字');
  }
  
  if (SECURITY_CONFIG.PASSWORD_REQUIRE_SYMBOLS && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('密码必须包含至少一个特殊字符');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 生成安全的随机字符串
 */
export function generateSecureRandomString(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * 生成密码哈希
 */
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = require('bcryptjs');
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * 验证密码
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(password, hash);
}

/**
 * 清理HTML内容，防止XSS
 */
export function sanitizeHtml(dirty: string): string {
  // 简单的XSS防护，生产环境建议使用专业的库如DOMPurify
  return dirty
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

/**
 * 验证邮箱格式
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证手机号格式
 */
export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

// 验证JWT密钥配置
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error(
    "JWT_SECRET environment variable is required and must be at least 32 characters long. " +
    "Please set a secure random string in your .env.local file."
  );
}

/**
 * 生成JWT Token
 */
export function generateJWTToken(payload: any, expiresIn: string = SECURITY_CONFIG.JWT_EXPIRES_IN): string {
  const jwt = require('jsonwebtoken');
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * 验证JWT Token
 */
export function verifyJWTToken(token: string): any {
  const jwt = require('jsonwebtoken');
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// 验证加密密钥配置
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
  throw new Error(
    "ENCRYPTION_KEY environment variable is required and must be at least 32 characters long. " +
    "Please set a secure random string in your .env.local file."
  );
}

/**
 * 加密敏感数据
 */
export function encryptData(data: string): string {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(ENCRYPTION_KEY!, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, key, iv);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

/**
 * 解密敏感数据
 */
export function decryptData(encryptedData: string): string {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(ENCRYPTION_KEY!, 'salt', 32);
  
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipher(algorithm, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * 生成CSRF Token
 */
export function generateCSRFToken(): string {
  return generateSecureRandomString(32);
}

/**
 * 验证CSRF Token
 */
export function verifyCSRFToken(token: string, sessionToken: string): boolean {
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(sessionToken));
}

/**
 * 检测可疑活动
 */
export function detectSuspiciousActivity(req: Request): boolean {
  // 检测常见攻击模式
  const suspiciousPatterns = [
    /union\s+select/i,
    /script\s*>/i,
    /<iframe/i,
    /javascript\s*:/i,
    /on\w+\s*=/i,
    /\.\./,  // 目录遍历
  ];
  
  const url = req.url || '';
  const userAgent = req.headers.get('user-agent') || '';
  
  return suspiciousPatterns.some(pattern => 
    pattern.test(url) || pattern.test(userAgent)
  );
}

/**
 * IP白名单检查
 */
export function isIPAllowed(ip: string): boolean {
  // 开发环境允许所有IP，生产环境应该配置白名单
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  const allowedIPs = (process.env.ALLOWED_IPS || '').split(',').map(s => s.trim());
  return allowedIPs.length === 0 || allowedIPs.includes(ip);
}