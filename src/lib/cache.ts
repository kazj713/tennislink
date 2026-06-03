/**
 * Redis缓存管理器
 * 提供高性能的数据缓存服务
 */

import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

// Redis客户端实例
let redisClient: Redis | null = null;

/**
 * 获取Redis客户端实例
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    const redisUrl = env.REDIS_URL;
    
    if (!redisUrl) {
      throw new Error('Redis URL未配置');
    }

    redisClient = new Redis(redisUrl, {
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    redisClient.on('error', (error) => {
      logger.error('Redis连接错误', error);
    });

    redisClient.on('connect', () => {
      logger.info('Redis连接成功');
    });

    redisClient.on('reconnecting', () => {
      logger.warn('Redis正在重新连接');
    });
  }

  return redisClient;
}

/**
 * 缓存管理器
 */
export class CacheManager {
  private redis: Redis;

  constructor() {
    this.redis = getRedisClient();
  }

  /**
   * 获取缓存值
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error('缓存获取失败', error as Error, { key });
      return null;
    }
  }

  /**
   * 设置缓存值
   */
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.redis.setex(key, ttl, serialized);
    } catch (error) {
      logger.error('缓存设置失败', error as Error, { key });
    }
  }

  /**
   * 删除缓存
   */
  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      logger.error('缓存删除失败', error as Error, { key });
    }
  }

  /**
   * 批量删除缓存（支持通配符）
   */
  async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      logger.error('缓存批量删除失败', error as Error, { pattern });
    }
  }

  /**
   * 检查缓存是否存在
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('缓存检查失败', error as Error, { key });
      return false;
    }
  }

  /**
   * 设置缓存过期时间
   */
  async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.redis.expire(key, seconds);
    } catch (error) {
      logger.error('缓存过期设置失败', error as Error, { key });
    }
  }

  /**
   * 获取缓存剩余过期时间
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      logger.error('缓存TTL获取失败', error as Error, { key });
      return -1;
    }
  }

  /**
   * 递增计数器
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    try {
      return await this.redis.incrby(key, amount);
    } catch (error) {
      logger.error('缓存递增失败', error as Error, { key });
      return 0;
    }
  }

  /**
   * 递减计数器
   */
  async decrement(key: string, amount: number = 1): Promise<number> {
    try {
      return await this.redis.decrby(key, amount);
    } catch (error) {
      logger.error('缓存递减失败', error as Error, { key });
      return 0;
    }
  }

  /**
   * 获取或设置缓存（Cache-Aside模式）
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number = 3600
  ): Promise<T> {
    // 先尝试从缓存获取
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // 从数据源获取
    const data = await factory();
    
    // 存入缓存
    await this.set(key, data, ttl);
    
    return data;
  }

  /**
   * 清空所有缓存
   */
  async flush(): Promise<void> {
    try {
      await this.redis.flushdb();
      logger.info('缓存已清空');
    } catch (error) {
      logger.error('缓存清空失败', error as Error);
    }
  }

  /**
   * 获取缓存统计信息
   */
  async getStats(): Promise<{
    keys: number;
    memory: string;
    hitRate: number;
  }> {
    try {
      const info = await this.redis.info('memory');
      const dbsize = await this.redis.dbsize();
      
      // 解析内存信息
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const memory = memoryMatch ? memoryMatch[1].trim() : '0B';
      
      return {
        keys: dbsize,
        memory,
        hitRate: 0, // 需要配合应用层统计
      };
    } catch (error) {
      logger.error('缓存统计获取失败', error as Error);
      return { keys: 0, memory: '0B', hitRate: 0 };
    }
  }
}

// 导出单例实例
export const cache = new CacheManager();

// 便捷导出
export const cacheGet = <T>(key: string) => cache.get<T>(key);
export const cacheSet = (key: string, value: any, ttl?: number) => cache.set(key, value, ttl);
export const cacheDelete = (key: string) => cache.delete(key);
export const cacheGetOrSet = <T>(key: string, factory: () => Promise<T>, ttl?: number) => 
  cache.getOrSet<T>(key, factory, ttl);

/**
 * 缓存装饰器
 * 用于自动缓存函数返回值
 */
export function withCache<T>(
  keyGenerator: (...args: any[]) => string,
  ttl: number = 3600
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]): Promise<T> {
      const cacheKey = keyGenerator(...args);
      
      return cache.getOrSet<T>(
        cacheKey,
        () => originalMethod.apply(this, args),
        ttl
      );
    };

    return descriptor;
  };
}

/**
 * 清除缓存装饰器
 * 用于在数据更新时清除相关缓存
 */
export function clearCache(pattern: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);
      
      // 异步清除缓存，不阻塞主流程
      cache.deletePattern(pattern).catch(error => {
        logger.error('缓存清除失败', error as Error, { pattern });
      });
      
      return result;
    };

    return descriptor;
  };
}
