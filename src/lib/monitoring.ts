/**
 * 安全审计和监控配置
 */

import { logger } from './logger';
import { env } from './env';

// 监控配置
export const MONITORING_CONFIG = {
  // 日志配置
  logging: {
    level: env.NODE_ENV === 'production' ? 'INFO' : 'DEBUG',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    logRotation: true,
  },
  
  // 系统监控
  system: {
    enabled: true,
    cpuThreshold: 80, // 80% CPU使用率告警
    memoryThreshold: 85, // 85% 内存使用率告警
    diskThreshold: 90, // 90% 磁盘使用率告警
    checkInterval: 60000, // 60秒检查一次
  },
  
  // 安全事件监控
  security: {
    enabled: true,
    failedLoginThreshold: 5, // 5次失败登录告警
    bruteForceDetection: true,
    suspiciousActivityDetection: true,
    checkInterval: 30000, // 30秒检查一次
  },
  
  // 性能监控
  performance: {
    enabled: true,
    apiResponseTimeThreshold: 2000, // 2秒API响应时间告警
    pageLoadTimeThreshold: 3000, // 3秒页面加载时间告警
    checkInterval: 60000, // 60秒检查一次
  },
  
  // 数据库监控
  database: {
    enabled: true,
    connectionPoolThreshold: 90, // 90% 连接池使用率告警
    queryTimeThreshold: 500, // 500ms 查询时间告警
    checkInterval: 60000, // 60秒检查一次
  },
};

// 安全审计事件类型
export enum AuditEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  REGISTER = 'REGISTER',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PROFILE_UPDATE = 'PROFILE_UPDATE',
  ROLE_CHANGE = 'ROLE_CHANGE',
  RESOURCE_ACCESS = 'RESOURCE_ACCESS',
  RESOURCE_MODIFY = 'RESOURCE_MODIFY',
  RESOURCE_DELETE = 'RESOURCE_DELETE',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
}

// 安全审计记录接口
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  eventType: AuditEventType;
  userId?: string;
  username?: string;
  ipAddress: string;
  userAgent: string;
  resource?: string;
  action?: string;
  details?: Record<string, any>;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// 安全审计类
class SecurityAudit {
  /**
   * 记录安全审计事件
   */
  async logEvent(
    eventType: AuditEventType,
    options: {
      userId?: string;
      username?: string;
      ipAddress: string;
      userAgent: string;
      resource?: string;
      action?: string;
      details?: Record<string, any>;
      severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    }
  ): Promise<void> {
    try {
      const { userId, username, ipAddress, userAgent, resource, action, details, severity = 'MEDIUM' } = options;
      
      const auditEntry: AuditLogEntry = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        eventType,
        userId,
        username,
        ipAddress,
        userAgent,
        resource,
        action,
        details,
        severity,
      };
      
      // 日志记录
      const auditLogger = logger.withContext({ source: 'SecurityAudit' });
      auditLogger.info(`Audit event: ${eventType}`, {
        userId,
        username,
        ipAddress,
        resource,
        action,
        severity,
      });
      
      // 这里可以添加数据库存储逻辑
      // await auditLogManager.create(auditEntry);
      
      // 检查是否需要告警
      this.checkForAlerts(auditEntry);
      
    } catch (error) {
      logger.error('Failed to log audit event', error as Error);
    }
  }
  
  /**
   * 检查是否需要告警
   */
  private checkForAlerts(entry: AuditLogEntry): void {
    // 失败登录次数检查
    if (entry.eventType === AuditEventType.LOGIN_FAILURE) {
      // 这里可以添加失败登录次数统计和告警逻辑
      logger.warn('Failed login attempt', {
        username: entry.username,
        ipAddress: entry.ipAddress,
      });
    }
    
    // 权限拒绝检查
    if (entry.eventType === AuditEventType.PERMISSION_DENIED) {
      logger.warn('Permission denied', {
        userId: entry.userId,
        username: entry.username,
        resource: entry.resource,
        action: entry.action,
        ipAddress: entry.ipAddress,
      });
    }
    
    // 严重安全事件告警
    if (entry.severity === 'HIGH' || entry.severity === 'CRITICAL') {
      logger.error('Critical security event', undefined, {
        eventType: entry.eventType,
        userId: entry.userId,
        username: entry.username,
        resource: entry.resource,
        ipAddress: entry.ipAddress,
        details: entry.details,
      });
    }
  }
  
  /**
   * 获取审计日志
   */
  async getAuditLogs(options: {
    limit?: number;
    offset?: number;
    eventType?: AuditEventType;
    userId?: string;
    startTime?: string;
    endTime?: string;
  } = {}): Promise<AuditLogEntry[]> {
    // 这里可以添加数据库查询逻辑
    // return await auditLogManager.getLogs(options);
    return [];
  }
  
  /**
   * 清理旧审计日志
   */
  async cleanupOldLogs(days: number = 30): Promise<void> {
    // 这里可以添加数据库清理逻辑
    // await auditLogManager.cleanup(days);
    logger.info(`Cleaned up audit logs older than ${days} days`);
  }
}

// 系统监控类
class SystemMonitor {
  private intervalId: NodeJS.Timeout | null = null;
  
  /**
   * 启动系统监控
   */
  start(): void {
    if (this.intervalId) {
      return;
    }
    
    const monitorLogger = logger.withContext({ source: 'SystemMonitor' });
    monitorLogger.info('Starting system monitoring');
    
    this.intervalId = setInterval(() => {
      this.checkSystemStatus();
    }, MONITORING_CONFIG.system.checkInterval);
  }
  
  /**
   * 停止系统监控
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.withContext({ source: 'SystemMonitor' }).info('Stopped system monitoring');
    }
  }
  
  /**
   * 检查系统状态
   */
  private async checkSystemStatus(): Promise<void> {
    try {
      const monitorLogger = logger.withContext({ source: 'SystemMonitor' });
      
      // 检查CPU使用率
      // const cpuUsage = await this.getCpuUsage();
      // if (cpuUsage > MONITORING_CONFIG.system.cpuThreshold) {
      //   monitorLogger.warn(`High CPU usage: ${cpuUsage}%`);
      // }
      
      // 检查内存使用率
      // const memoryUsage = await this.getMemoryUsage();
      // if (memoryUsage > MONITORING_CONFIG.system.memoryThreshold) {
      //   monitorLogger.warn(`High memory usage: ${memoryUsage}%`);
      // }
      
      // 检查磁盘使用率
      // const diskUsage = await this.getDiskUsage();
      // if (diskUsage > MONITORING_CONFIG.system.diskThreshold) {
      //   monitorLogger.warn(`High disk usage: ${diskUsage}%`);
      // }
      
      monitorLogger.debug('System status check completed');
      
    } catch (error) {
      logger.error('System status check failed', error as Error);
    }
  }
  
  /**
   * 获取CPU使用率
   */
  private async getCpuUsage(): Promise<number> {
    // 这里可以添加CPU使用率获取逻辑
    return 0;
  }
  
  /**
   * 获取内存使用率
   */
  private async getMemoryUsage(): Promise<number> {
    const memory = process.memoryUsage();
    const totalMemory = process.memoryUsage().heapTotal;
    const usedMemory = process.memoryUsage().heapUsed;
    return Math.round((usedMemory / totalMemory) * 100);
  }
  
  /**
   * 获取磁盘使用率
   */
  private async getDiskUsage(): Promise<number> {
    // 这里可以添加磁盘使用率获取逻辑
    return 0;
  }
}

// 性能监控类
class PerformanceMonitor {
  private apiResponseTimes: Map<string, number[]> = new Map();
  private intervalId: NodeJS.Timeout | null = null;
  
  /**
   * 启动性能监控
   */
  start(): void {
    if (this.intervalId) {
      return;
    }
    
    const monitorLogger = logger.withContext({ source: 'PerformanceMonitor' });
    monitorLogger.info('Starting performance monitoring');
    
    this.intervalId = setInterval(() => {
      this.analyzePerformance();
    }, MONITORING_CONFIG.performance.checkInterval);
  }
  
  /**
   * 停止性能监控
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.withContext({ source: 'PerformanceMonitor' }).info('Stopped performance monitoring');
    }
  }
  
  /**
   * 记录API响应时间
   */
  recordApiResponseTime(path: string, time: number): void {
    if (!this.apiResponseTimes.has(path)) {
      this.apiResponseTimes.set(path, []);
    }
    
    const times = this.apiResponseTimes.get(path)!;
    times.push(time);
    
    // 只保留最近100个记录
    if (times.length > 100) {
      times.shift();
    }
  }
  
  /**
   * 分析性能数据
   */
  private analyzePerformance(): void {
    try {
      const monitorLogger = logger.withContext({ source: 'PerformanceMonitor' });
      
      // 分析API响应时间
      for (const [path, times] of this.apiResponseTimes.entries()) {
        if (times.length === 0) continue;
        
        const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        const maxTime = Math.max(...times);
        
        if (averageTime > MONITORING_CONFIG.performance.apiResponseTimeThreshold) {
          monitorLogger.warn(`Slow API response time for ${path}`, {
            average: averageTime,
            max: maxTime,
            count: times.length,
          });
        }
        
        monitorLogger.debug(`API performance for ${path}`, {
          average: averageTime,
          max: maxTime,
          count: times.length,
        });
      }
      
    } catch (error) {
      logger.error('Performance analysis failed', error as Error);
    }
  }
  
  /**
   * 获取性能报告
   */
  getPerformanceReport(): Record<string, any> {
    const report: Record<string, any> = {};
    
    for (const [path, times] of this.apiResponseTimes.entries()) {
      if (times.length === 0) continue;
      
      const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      
      report[path] = {
        average: averageTime,
        max: maxTime,
        min: minTime,
        count: times.length,
      };
    }
    
    return report;
  }
}

// 导出监控实例
export const securityAudit = new SecurityAudit();
export const systemMonitor = new SystemMonitor();
export const performanceMonitor = new PerformanceMonitor();

// 导出监控中间件
import { NextRequest, NextResponse } from 'next/server';

export async function monitoringMiddleware(request: NextRequest) {
  const startTime = Date.now();
  const path = request.nextUrl.pathname;
  const method = request.method;
  const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('remote-addr') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  try {
    // 处理请求
    const response = await NextResponse.next();
    
    // 记录响应时间
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // 记录性能数据
    performanceMonitor.recordApiResponseTime(`${method} ${path}`, responseTime);
    
    // 记录安全审计
    if (path.startsWith('/api')) {
      securityAudit.logEvent(AuditEventType.RESOURCE_ACCESS, {
        ipAddress,
        userAgent,
        resource: path,
        action: method,
        severity: 'LOW',
      });
    }
    
    // 添加响应时间头
    response.headers.set('X-Response-Time', responseTime.toString());
    
    return response;
    
  } catch (error) {
    // 记录错误
    securityAudit.logEvent(AuditEventType.SYSTEM_ERROR, {
      ipAddress,
      userAgent,
      resource: path,
      action: method,
      details: { error: (error as Error).message },
      severity: 'HIGH',
    });
    
    throw error;
  }
}

// 初始化监控
export function initializeMonitoring() {
  if (MONITORING_CONFIG.system.enabled) {
    systemMonitor.start();
  }
  
  if (MONITORING_CONFIG.performance.enabled) {
    performanceMonitor.start();
  }
  
  logger.info('Monitoring initialized');
}
