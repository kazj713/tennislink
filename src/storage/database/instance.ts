import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '@/lib/env';

// 数据库连接配置
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  // 仅对远程数据库连接启用SSL，本地连接禁用SSL
  ssl: env.DATABASE_URL?.includes('localhost') || env.DATABASE_URL?.includes('127.0.0.1')
    ? false
    : env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  // 连接池配置
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 健康检查
pool.on('connect', (client) => {
  console.log('✅ 数据库连接成功');
});

pool.on('error', (err) => {
  console.error('❌ 数据库连接错误:', err);
});

const db = drizzle(pool);

export { db, pool };

export async function getDb() {
  return db;
}
