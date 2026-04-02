/**
 * 健康检查API
 * 用于监控系统健康状态
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from "drizzle-orm";

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: boolean;
    storage: boolean;
    payments: boolean;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // 检查各项服务状态
    const [dbStatus, storageStatus, paymentsStatus] = await Promise.all([
      checkDatabaseHealth(),
      checkStorageHealth(),
      checkPaymentHealth()
    ]);
    
    const memoryUsage = process.memoryUsage();
    const totalMemory = require('os').totalmem();
    
    // 确定整体状态
    // 开发环境：数据库正常即可认为是 healthy
    // 生产环境：所有服务都必须正常
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (dbStatus && storageStatus && paymentsStatus) {
      status = 'healthy';
    } else if (dbStatus && isDevelopment) {
      // 开发环境，数据库正常但其他服务未配置，标记为 degraded
      status = 'degraded';
    } else if (dbStatus) {
      // 生产环境，数据库正常但其他服务异常，标记为 degraded
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }
    
    const healthResult: HealthCheckResult = {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: dbStatus,
        storage: storageStatus,
        payments: paymentsStatus
      },
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(totalMemory / 1024 / 1024), // MB
        percentage: Math.round((memoryUsage.heapUsed / totalMemory) * 100)
      }
    };
    
    const responseTime = Date.now() - startTime;
    
    // 状态码映射
    const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;
    
    return NextResponse.json(healthResult, {
      status: statusCode,
      headers: {
        'X-Response-Time': `${responseTime}ms`
      }
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    }, { status: 503 });
  }
}

/**
 * 检查数据库健康状态
 */
async function checkDatabaseHealth(): Promise<boolean> {
  try {
    // 简单的数据库连接检查
    const { db } = await import('@/storage/database/instance');
    await db.execute(sql`SELECT 1`); // 执行简单查询
    
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * 检查存储服务健康状态
 */
async function checkStorageHealth(): Promise<boolean> {
  try {
    // 检查COS配置是否存在
    if (!process.env.COS_SECRET_ID || !process.env.COS_SECRET_KEY || !process.env.COS_BUCKET) {
      return false;
    }
    
    // 检查COS配置
    const { getCOSClient } = await import('@/lib/storage');
    const cos = getCOSClient();
    
    // 尝试获取存储桶信息
    return new Promise((resolve) => {
      cos.getBucket({
        Bucket: process.env.COS_BUCKET || '',
        Region: process.env.COS_REGION || 'ap-beijing',
        MaxKeys: 1
      }, (err: any) => {
        resolve(!err);
      });
    });
  } catch (error) {
    console.error('Storage health check failed:', error);
    return false;
  }
}

/**
 * 检查支付服务健康状态
 */
async function checkPaymentHealth(): Promise<boolean> {
  try {
    // 检查支付配置
    const wechatConfig = process.env.WECHAT_PAY_MCH_ID && process.env.WECHAT_PAY_API_V3_KEY;
    const alipayConfig = process.env.ALIPAY_APP_ID && process.env.ALIPAY_PRIVATE_KEY;
    
    return !!(wechatConfig || alipayConfig);
  } catch (error) {
    console.error('Payment health check failed:', error);
    return false;
  }
}
