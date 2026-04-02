import { eq, and, SQL } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import { systemSettings, insertSystemSettingSchema, updateSystemSettingSchema } from "./shared/schema";
import type { SystemSetting, InsertSystemSetting, UpdateSystemSetting } from "./shared/schema";

/**
 * 系统设置管理器
 * 负责系统设置的数据库操作
 */
export class SystemSettingsManager {
  /**
   * 获取所有系统设置（按分类组织）
   */
  async getAllSettings(): Promise<Record<string, Record<string, unknown>>> {
    const db = await getDb();
    const settings = await db.select().from(systemSettings);
    
    // 按分类组织设置
    const organized: Record<string, Record<string, unknown>> = {};
    
    for (const setting of settings) {
      if (!organized[setting.category]) {
        organized[setting.category] = {};
      }
      organized[setting.category][setting.key] = setting.value;
    }
    
    return organized;
  }

  /**
   * 获取指定分类的设置
   */
  async getSettingsByCategory(category: string): Promise<Record<string, unknown>> {
    const db = await getDb();
    const settings = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.category, category));
    
    const result: Record<string, unknown> = {};
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }
    
    return result;
  }

  /**
   * 获取单个设置值
   */
  async getSetting(category: string, key: string): Promise<unknown | null> {
    const db = await getDb();
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(and(
        eq(systemSettings.category, category),
        eq(systemSettings.key, key)
      ));
    
    return setting?.value ?? null;
  }

  /**
   * 设置单个配置项
   */
  async setSetting(
    category: string,
    key: string,
    value: unknown,
    description?: string,
    updatedBy?: string
  ): Promise<boolean> {
    try {
      const db = await getDb();
      
      // 检查是否已存在
      const [existing] = await db
        .select()
        .from(systemSettings)
        .where(and(
          eq(systemSettings.category, category),
          eq(systemSettings.key, key)
        ));
      
      if (existing) {
        // 更新现有设置
        await db
          .update(systemSettings)
          .set({
            value,
            updatedBy,
            updatedAt: new Date(),
          })
          .where(eq(systemSettings.id, existing.id));
      } else {
        // 创建新设置
        const validated = insertSystemSettingSchema.parse({
          category,
          key,
          value,
          description,
          updatedBy,
        });
        
        await db.insert(systemSettings).values(validated);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to set setting:', error);
      return false;
    }
  }

  /**
   * 批量设置配置
   */
  async setSettings(
    settings: Array<{
      category: string;
      key: string;
      value: unknown;
      description?: string;
    }>,
    updatedBy?: string
  ): Promise<boolean> {
    try {
      for (const setting of settings) {
        await this.setSetting(
          setting.category,
          setting.key,
          setting.value,
          setting.description,
          updatedBy
        );
      }
      return true;
    } catch (error) {
      console.error('Failed to set settings:', error);
      return false;
    }
  }

  /**
   * 删除设置
   */
  async deleteSetting(category: string, key: string): Promise<boolean> {
    try {
      const db = await getDb();
      await db
        .delete(systemSettings)
        .where(and(
          eq(systemSettings.category, category),
          eq(systemSettings.key, key)
        ));
      return true;
    } catch (error) {
      console.error('Failed to delete setting:', error);
      return false;
    }
  }

  /**
   * 初始化默认系统设置
   */
  async initializeDefaultSettings(updatedBy?: string): Promise<boolean> {
    const defaultSettings = [
      // 基础设置
      { category: 'basic', key: 'siteName', value: 'Tennis Link', description: '网站名称' },
      { category: 'basic', key: 'siteDescription', value: '智能网球学习平台', description: '网站描述' },
      { category: 'basic', key: 'maintenanceMode', value: false, description: '维护模式' },
      { category: 'basic', key: 'contactEmail', value: 'support@tennislink.com', description: '联系邮箱' },
      { category: 'basic', key: 'contactPhone', value: '', description: '联系电话' },
      
      // 支付设置
      { category: 'payment', key: 'wechatPayEnabled', value: true, description: '启用微信支付' },
      { category: 'payment', key: 'alipayEnabled', value: true, description: '启用支付宝' },
      { category: 'payment', key: 'testMode', value: true, description: '测试模式' },
      { category: 'payment', key: 'refundPolicy', value: '课程开始前24小时可申请退款', description: '退款政策' },
      
      // 通知设置
      { category: 'notification', key: 'emailNotifications', value: true, description: '启用邮件通知' },
      { category: 'notification', key: 'smsNotifications', value: false, description: '启用短信通知' },
      { category: 'notification', key: 'pushNotifications', value: true, description: '启用推送通知' },
      { category: 'notification', key: 'bookingReminderHours', value: 24, description: '预约提醒提前小时数' },
      
      // 安全设置
      { category: 'security', key: 'enableRateLimit', value: true, description: '启用速率限制' },
      { category: 'security', key: 'sessionTimeout', value: 3600, description: '会话超时时间（秒）' },
      { category: 'security', key: 'enableTwoFactor', value: false, description: '启用双因素认证' },
      { category: 'security', key: 'maxLoginAttempts', value: 5, description: '最大登录尝试次数' },
      { category: 'security', key: 'lockoutDuration', value: 900, description: '账户锁定时间（秒）' },
    ];
    
    return this.setSettings(defaultSettings, updatedBy);
  }
}

// 导出单例实例
export const systemSettingsManager = new SystemSettingsManager();
