import { z } from 'zod';

// 环境变量模式定义
const envSchema = z.object({
  // 环境
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // 数据库
  DATABASE_URL: z.string(),
  
  // JWT
  JWT_SECRET: z.string().min(32, 'JWT密钥至少需要32个字符'),
  
  // 域名
  NEXT_PUBLIC_DOMAIN: z.string().optional(),
  
  // 对象存储
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET_NAME: z.string().optional(),
  S3_REGION: z.string().optional(),
  
  // AI模型
  AI_API_KEY: z.string().optional(),
  
  // 支付
  PAYMENT_API_KEY: z.string().optional(),
  
  // 速率限制
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  
  // 上传限制
  MAX_UPLOAD_SIZE: z.coerce.number().default(104857600),
  
  // 验证码
  VERIFICATION_CODE_EXPIRY: z.coerce.number().default(300),
  VERIFICATION_CODE_LENGTH: z.coerce.number().default(6),
  
  // 教练审核
  COACH_APPROVAL_REQUIRED: z.coerce.boolean().default(true),
  
  // 邮件服务
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  
  // 短信服务
  SMS_API_KEY: z.string().optional(),
  SMS_SENDER_ID: z.string().optional(),
  
  // 阿里云
  ALIYUN_ACCESS_KEY_ID: z.string().optional(),
  ALIYUN_ACCESS_KEY_SECRET: z.string().optional(),
  ALIYUN_SMS_TEMPLATE_CODE: z.string().optional(),
  ALIYUN_SMS_SIGN_NAME: z.string().optional(),
  
  // 支付宝
  ALIPAY_APP_ID: z.string().optional(),
  ALIPAY_PRIVATE_KEY: z.string().optional(),
  ALIPAY_PUBLIC_KEY: z.string().optional(),
  ALIPAY_GATEWAY: z.string().optional(),
  
  // 微信小程序
  WECHAT_APP_ID: z.string().optional(),
  WECHAT_APP_SECRET: z.string().optional(),
  
  // 微信支付
  WECHAT_PAY_APP_ID: z.string().optional(),
  WECHAT_PAY_MCH_ID: z.string().optional(),
  WECHAT_PAY_API_V3_KEY: z.string().optional(),
  WECHAT_PAY_CERT_PATH: z.string().optional(),
  
  // 安全
  SECURE_COOKIES: z.coerce.boolean().default(true),
  
  // 性能
  CACHE_DURATION: z.coerce.number().default(3600000),
  
  // 开发模式
  DEV_MODE: z.coerce.boolean().default(false),
  
  // 种子数据
  SEED_ADMIN_EMAIL: z.string().email().optional(),
  SEED_ADMIN_PASSWORD: z.string().optional(),
});

// 验证环境变量
let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
  console.log('✅ 环境变量验证成功');
} catch (error) {
  console.error('❌ 环境变量验证失败:', error);
  // 在 Edge Runtime 中不使用 process.exit
  if (typeof process !== 'undefined' && typeof process.exit === 'function') {
    process.exit(1);
  }
}

// 导出类型安全的环境变量
export { env };

// 导出环境变量类型
export type Env = z.infer<typeof envSchema>;