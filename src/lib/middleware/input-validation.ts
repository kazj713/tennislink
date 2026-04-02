import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// 常用验证模式
export const VALIDATION_SCHEMAS = {
  // 登录验证
  login: z.object({
    identifier: z.string().min(3).max(100),
    password: z.string().min(6).max(100),
  }),
  
  // 注册验证
  register: z.object({
    name: z.string().min(2).max(50),
    email: z.string().email().optional(),
    phone: z.string().regex(/^1[3-9]\d{9}$/).optional(),
    password: z.string().min(6).max(100),
    code: z.string().length(6),
    role: z.enum(['student', 'coach']).optional(),
  }).refine(data => data.email || data.phone, {
    message: '邮箱或手机号至少提供一个',
    path: ['email'],
  }),
  
  // 密码验证
  password: z.string()
    .min(8, '密码长度至少8位')
    .regex(/[a-z]/, '密码必须包含小写字母')
    .regex(/[A-Z]/, '密码必须包含大写字母')
    .regex(/[0-9]/, '密码必须包含数字')
    .regex(/[^a-zA-Z0-9]/, '密码必须包含特殊字符'),
  
  // 邮箱验证
  email: z.string().email('请输入有效的邮箱地址'),
  
  // 手机号验证
  phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入有效的手机号'),
  
  // 支付验证
  payment: z.object({
    orderId: z.string().min(1).max(100),
    amount: z.number().positive('金额必须大于0'),
    description: z.string().min(1).max(200),
    paymentMethod: z.enum(['wechat', 'alipay']),
  }),
  
  // 教练推荐验证
  coachRecommendation: z.object({
    location: z.string().min(1).max(100),
    skillLevel: z.number().min(1).max(10),
    preferredDays: z.array(z.number().min(1).max(7)),
    budget: z.number().positive('预算必须大于0'),
    learningGoals: z.array(z.string().min(1)),
  }),
};

/**
 * 清理输入数据，防止XSS攻击
 * @param input 输入数据
 * @returns 清理后的数据
 */
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // 清理字符串，防止XSS
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  if (Array.isArray(input)) {
    return input.map(item => sanitizeInput(item));
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}

/**
 * 验证输入数据
 * @param request 请求对象
 * @param schema 验证模式
 * @returns 验证结果
 */
export async function validateInput(request: NextRequest, schema: z.ZodSchema<any>): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    
    if (!result.success) {
      const errorMessages = result.error.issues.map(err => err.message).join('; ');
      return { success: false, error: errorMessages };
    }
    
    // 清理输入数据
    const sanitizedData = sanitizeInput(result.data);
    return { success: true, data: sanitizedData };
  } catch (error) {
    return { success: false, error: '无效的请求数据格式' };
  }
}

/**
 * 输入验证中间件
 * @param request 请求对象
 * @param schema 验证模式
 * @returns 验证结果
 */
export async function inputValidationMiddleware(request: NextRequest, schema: z.ZodSchema<any>) {
  const validation = await validateInput(request, schema);
  
  if (!validation.success) {
    return NextResponse.json(
      { 
        error: validation.error || '输入数据验证失败', 
        code: 'VALIDATION_ERROR'
      },
      { status: 400 }
    );
  }
  
  return { success: true, data: validation.data };
}

/**
 * 获取API的验证模式
 * @param path API路径
 * @returns 验证模式或null
 */
export function getValidationSchema(path: string, method: string) {
  if (path === '/api/auth/login' && method === 'POST') {
    return VALIDATION_SCHEMAS.login;
  }
  
  if (path === '/api/auth/register' && method === 'POST') {
    return VALIDATION_SCHEMAS.register;
  }
  
  if (path === '/api/payment/create' && method === 'POST') {
    return VALIDATION_SCHEMAS.payment;
  }
  
  if (path === '/api/coach-recommendation' && method === 'POST') {
    return VALIDATION_SCHEMAS.coachRecommendation;
  }
  
  return null;
}

/**
 * 通用输入验证中间件
 */
export async function generalValidationMiddleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const method = request.method;
  
  // 只验证POST/PUT请求
  if (!['POST', 'PUT', 'DELETE'].includes(method)) {
    return { success: true };
  }
  
  const schema = getValidationSchema(path, method);
  if (!schema) {
    return { success: true };
  }
  
  return inputValidationMiddleware(request, schema);
}

/**
 * 防止SQL注入
 * @param input 输入数据
 * @returns 清理后的数据
 */
export function preventSqlInjection(input: string): string {
  // 移除SQL注入关键字
  return input
    .replace(/['";]/g, '')
    .replace(/(--|#|\/\*)[\s\S]*?(\*\/)?/g, '')
    .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|SP_|xp_|sys\.)\b/gi, '')
    .trim();
}

/**
 * 防止NoSQL注入
 * @param input 输入数据
 * @returns 清理后的数据
 */
export function preventNosqlInjection(input: any): any {
  if (typeof input === 'string') {
    // 移除NoSQL注入模式
    return input
      .replace(/\$\b(gt|gte|lt|lte|ne|eq|in|nin|all|elemMatch|size|exists|type|regex)\b/gi, '')
      .replace(/\b(where|find|findOne|update|remove|delete)\b/gi, '');
  }
  
  if (Array.isArray(input)) {
    return input.map(item => preventNosqlInjection(item));
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      // 移除以$开头的键（MongoDB操作符）
      if (typeof key === 'string' && key.startsWith('$')) {
        continue;
      }
      sanitized[key] = preventNosqlInjection(value);
    }
    return sanitized;
  }
  
  return input;
}
