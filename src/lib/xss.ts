/**
 * XSS防护工具
 * 使用DOMPurify进行专业的XSS清理
 */

import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// 创建DOMPurify实例
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window as any);

// DOMPurify配置
const purifyConfig = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'strike', 'del',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'a', 'img',
    'blockquote', 'code', 'pre',
    'table', 'thead', 'tbody', 'tr', 'th', 'td'
  ],
  ALLOWED_ATTR: [
    'href', 'title', 'target',
    'src', 'alt', 'width', 'height',
    'class', 'id'
  ],
  ALLOW_DATA_ATTR: false,
  SANITIZE_DOM: true,
  // 强制所有链接在新窗口打开，并添加安全属性
  ADD_ATTR: ['target', 'rel'],
  ADD_DATA_URI_TAGS: ['img'],
  // 禁止JavaScript协议
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout'],
  // 自定义钩子函数
  UPLOADED_FILES: false,
};

/**
 * 清理HTML内容，防止XSS攻击
 * 适用于富文本输入（如帖子内容、评论等）
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(dirty, purifyConfig);
}

/**
 * 清理纯文本输入
 * 适用于普通文本字段（如用户名、标题等）
 * 完全移除所有HTML标签
 */
export function sanitizeText(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  // 首先使用DOMPurify移除所有HTML
  const clean = DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });

  // 解码HTML实体
  const textarea = window.document.createElement('textarea');
  textarea.innerHTML = clean;
  return textarea.value;
}

/**
 * 清理URL
 * 防止javascript:等危险协议
 */
export function sanitizeUrl(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  const url = dirty.trim();
  
  // 检查危险协议
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lowerUrl = url.toLowerCase();
  
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return '';
    }
  }

  // 只允许http和https协议
  if (!lowerUrl.startsWith('http://') && !lowerUrl.startsWith('https://') && !lowerUrl.startsWith('/')) {
    return '';
  }

  return url;
}

/**
 * 清理JSON对象中的所有字符串值
 * 递归清理对象中的所有字符串
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // 根据字段名决定清理级别
      if (['content', 'description', 'bio', 'message'].includes(key)) {
        // 富文本字段
        sanitized[key] = sanitizeHtml(value);
      } else if (['url', 'link', 'website'].includes(key)) {
        // URL字段
        sanitized[key] = sanitizeUrl(value);
      } else {
        // 普通文本字段
        sanitized[key] = sanitizeText(value);
      }
    } else if (typeof value === 'object' && value !== null) {
      // 递归清理嵌套对象
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * 验证输入是否包含XSS攻击代码
 * 返回true表示检测到XSS
 */
export function detectXSS(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  // XSS检测模式
  const xssPatterns = [
    /<script[^>]*>[\s\S]*?<\/script>/i,
    /<[^>]+on\w+\s*=/i,
    /javascript:/i,
    /data:text\/html/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<form/i,
    /<input[^>]*type\s*=\s*["']?hidden/i,
  ];

  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * 中间件：清理请求体中的XSS
 * 用于API路由
 */
export function xssMiddleware() {
  return async function(req: Request) {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      try {
        const contentType = req.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const body = await req.json();
          const sanitizedBody = sanitizeObject(body);
          
          // 创建新的请求对象，使用清理后的数据
          const newReq = new Request(req.url, {
            method: req.method,
            headers: req.headers,
            body: JSON.stringify(sanitizedBody),
          });
          
          return newReq;
        }
      } catch (error) {
        console.error('XSS清理失败:', error);
      }
    }
    return req;
  };
}

/**
 * 安全转义HTML特殊字符
 * 用于将用户输入显示为纯文本（不解析HTML）
 */
export function escapeHtml(unsafe: string): string {
  if (!unsafe || typeof unsafe !== 'string') {
    return '';
  }

  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 导出便捷函数
export const xss = {
  sanitizeHtml,
  sanitizeText,
  sanitizeUrl,
  sanitizeObject,
  detectXSS,
  escapeHtml,
};
