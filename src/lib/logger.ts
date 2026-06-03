/**
 * 专业日志系统
 * 支持不同日志级别，生产环境自动过滤调试日志
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: Error;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    // 从环境变量读取日志级别，默认开发环境 debug，生产环境 info
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || (this.isDevelopment ? 'debug' : 'info');
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * 检查日志级别是否应该输出
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  /**
   * 格式化日志消息
   */
  private formatMessage(entry: LogEntry): string {
    const contextStr = entry.context ? ` | ${JSON.stringify(entry.context)}` : '';
    return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${contextStr}`;
  }

  /**
   * 创建日志条目
   */
  private createEntry(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    };
  }

  /**
   * 调试日志
   * 仅在开发环境显示
   */
  debug(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog('debug')) return;

    const entry = this.createEntry('debug', message, context);
    console.debug(this.formatMessage(entry));

    // 开发环境下可以发送到远程日志服务
    if (this.isDevelopment) {
      // 可以在这里添加开发环境的特殊处理
    }
  }

  /**
   * 信息日志
   */
  info(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog('info')) return;

    const entry = this.createEntry('info', message, context);
    console.info(this.formatMessage(entry));
  }

  /**
   * 警告日志
   */
  warn(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog('warn')) return;

    const entry = this.createEntry('warn', message, context);
    console.warn(this.formatMessage(entry));
  }

  /**
   * 错误日志
   */
  error(message: string, error?: Error, context?: Record<string, any>): void {
    if (!this.shouldLog('error')) return;

    const entry = this.createEntry('error', message, context, error);
    console.error(this.formatMessage(entry));

    // 生产环境下发送错误到监控服务
    if (!this.isDevelopment && error) {
      this.sendToErrorTracking(error, context);
    }
  }

  /**
   * API请求日志
   */
  logApiRequest(method: string, url: string, body?: any): void {
    this.debug(`API Request: ${method} ${url}`, { body });
  }

  /**
   * API响应日志
   */
  logApiResponse(method: string, url: string, status: number, duration: number): void {
    const level = status >= 400 ? 'warn' : 'debug';
    this[level](`API Response: ${method} ${url} - ${status} (${duration}ms)`);
  }

  /**
   * 数据库操作日志
   */
  logDatabase(operation: string, table: string, details?: any): void {
    this.debug(`Database: ${operation} ${table}`, details);
  }

  /**
   * 性能日志
   */
  logPerformance(operation: string, duration: number, details?: any): void {
    const level = duration > 1000 ? 'warn' : 'debug';
    this[level](`Performance: ${operation} took ${duration}ms`, details);
  }

  /**
   * 安全日志
   */
  logSecurity(event: string, details: Record<string, any>): void {
    this.warn(`Security: ${event}`, details);
  }

  /**
   * 业务日志
   */
  logBusiness(event: string, userId: string, details?: Record<string, any>): void {
    this.info(`Business: ${event}`, { userId, ...details });
  }

  /**
   * 发送错误到错误追踪服务（如 Sentry）
   * 这里预留接口，实际使用时可以接入 Sentry、Bugsnag 等
   */
  private sendToErrorTracking(error: Error, context?: Record<string, any>): void {
    // TODO: 接入 Sentry 或其他错误追踪服务
    // Sentry.captureException(error, { extra: context });

    // 临时记录到控制台，实际应该发送到远程服务
    console.error('[Error Tracking]', {
      message: error.message,
      stack: error.stack,
      context,
    });
  }

  /**
   * 创建带上下文的日志记录器
   * 返回一个新的logger实例，自动包含指定的上下文
   */
  withContext(context: Record<string, any>): Logger {
    const contextualLogger = new (this.constructor as typeof Logger)();
    // 复制当前实例的配置
    (contextualLogger as any).logLevel = this.logLevel;
    (contextualLogger as any).isDevelopment = this.isDevelopment;
    // 保存上下文
    (contextualLogger as any).defaultContext = context;
    return contextualLogger as Logger;
  }
}

// 导出单例实例
export const logger = Logger.getInstance();

// 便捷导出
export const logDebug = (message: string, context?: Record<string, any>) => logger.debug(message, context);
export const logInfo = (message: string, context?: Record<string, any>) => logger.info(message, context);
export const logWarn = (message: string, context?: Record<string, any>) => logger.warn(message, context);
export const logError = (message: string, error?: Error, context?: Record<string, any>) => logger.error(message, error, context);
