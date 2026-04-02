/**
 * CSRF防护工具
 * 实现双重Cookie提交模式 + Token验证
 */

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// CSRF Token配置
const CSRF_CONFIG = {
  COOKIE_NAME: 'csrf_token',
  HEADER_NAME: 'x-csrf-token',
  TOKEN_LENGTH: 32,
  COOKIE_MAX_AGE: 60 * 60 * 24, // 24小时
};

/**
 * 生成CSRF Token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(CSRF_CONFIG.TOKEN_LENGTH).toString('hex');
}

/**
 * 设置CSRF Token到Cookie
 */
export async function setCSRFToken(): Promise<string> {
  const token = generateCSRFToken();
  const cookieStore = await cookies();
  
  cookieStore.set(CSRF_CONFIG.COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: CSRF_CONFIG.COOKIE_MAX_AGE,
    path: '/',
  });
  
  return token;
}

/**
 * 获取CSRF Token
 */
export async function getCSRFToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_CONFIG.COOKIE_NAME)?.value;
}

/**
 * 清除CSRF Token
 */
export async function clearCSRFToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CSRF_CONFIG.COOKIE_NAME);
}

/**
 * 验证CSRF Token
 * 支持双重Cookie提交模式
 */
export async function validateCSRFToken(request: NextRequest): Promise<boolean> {
  // 获取Cookie中的Token
  const cookieToken = request.cookies.get(CSRF_CONFIG.COOKIE_NAME)?.value;
  
  if (!cookieToken) {
    console.warn('CSRF验证失败: 缺少Cookie Token');
    return false;
  }
  
  // 获取请求头中的Token
  const headerToken = request.headers.get(CSRF_CONFIG.HEADER_NAME);
  
  // 如果请求头中有Token，验证是否匹配
  if (headerToken) {
    try {
      // 使用timing-safe比较防止时序攻击
      const cookieBuffer = Buffer.from(cookieToken);
      const headerBuffer = Buffer.from(headerToken);
      
      if (cookieBuffer.length !== headerBuffer.length) {
        return false;
      }
      
      return crypto.timingSafeEqual(cookieBuffer, headerBuffer);
    } catch (error) {
      console.error('CSRF Token比较失败:', error);
      return false;
    }
  }
  
  // 如果没有请求头Token，检查是否为安全请求
  // GET、HEAD、OPTIONS请求不需要CSRF保护
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(request.method)) {
    return true;
  }
  
  console.warn(`CSRF验证失败: ${request.method} 请求缺少CSRF Token`);
  return false;
}

/**
 * CSRF保护中间件
 * 用于保护状态改变请求
 */
export async function csrfProtection(request: NextRequest) {
  // 安全请求直接通过
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(request.method)) {
    return NextResponse.next();
  }
  
  // 验证CSRF Token
  const isValid = await validateCSRFToken(request);
  
  if (!isValid) {
    return NextResponse.json(
      { 
        error: 'CSRF验证失败', 
        code: 'CSRF_INVALID',
        message: '请求缺少有效的CSRF Token，请刷新页面后重试'
      },
      { status: 403 }
    );
  }
  
  return NextResponse.next();
}

/**
 * 生成CSRF Token响应
 * 用于登录后或页面加载时返回Token
 */
export async function generateCSRFResponse() {
  const token = await setCSRFToken();
  
  return NextResponse.json({
    success: true,
    csrfToken: token,
  });
}

/**
 * 刷新CSRF Token
 */
export async function refreshCSRFToken() {
  const newToken = await setCSRFToken();
  return newToken;
}

// 导出配置
export { CSRF_CONFIG };
