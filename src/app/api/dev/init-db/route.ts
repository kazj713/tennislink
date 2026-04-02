import { NextResponse } from "next/server";
import { db } from "@/storage/database/instance";
import { sql } from "drizzle-orm";

/**
 * 数据库初始化API
 * 创建所有必需的数据库表
 * POST /api/dev/init-db
 * GET /api/dev/init-db
 */
export async function POST() {
  return initDatabase();
}

export async function GET() {
  return initDatabase();
}

async function initDatabase() {
  try {
    console.log("开始初始化数据库...");

    // 检查并创建users表
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          username VARCHAR(50) UNIQUE,
          email VARCHAR(255) NOT NULL UNIQUE,
          phone VARCHAR(20) UNIQUE,
          password TEXT,
          name VARCHAR(128) NOT NULL,
          avatar TEXT,
          role VARCHAR(20) NOT NULL DEFAULT 'student',
          gender VARCHAR(10),
          birth_date TIMESTAMP WITH TIME ZONE,
          city VARCHAR(100),
          district VARCHAR(100),
          skill_level INTEGER DEFAULT 1,
          bio TEXT,
          is_active BOOLEAN DEFAULT true NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE
        );
      `);
      console.log("✅ users表创建成功");

      // 创建索引
      try {
        await db.execute(sql`CREATE INDEX IF NOT EXISTS users_username_idx ON users(username);`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS users_phone_idx ON users(phone);`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);`);
        console.log("✅ users表索引创建成功");
      } catch (indexError) {
        console.log("⚠️  users表索引创建警告（可能已存在）:", indexError);
      }
    } catch (error) {
      console.error("❌ users表创建失败:", error);
    }

    // 检查并创建verification_codes表
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS verification_codes (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          target VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          code VARCHAR(6) NOT NULL,
          is_used BOOLEAN DEFAULT false NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
      `);
      console.log("✅ verification_codes表创建成功");

      // 创建索引
      try {
        await db.execute(sql`CREATE INDEX IF NOT EXISTS verification_codes_target_idx ON verification_codes(target);`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS verification_codes_type_idx ON verification_codes(type);`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS verification_codes_expires_at_idx ON verification_codes(expires_at);`);
        console.log("✅ verification_codes表索引创建成功");
      } catch (indexError) {
        console.log("⚠️  verification_codes表索引创建警告（可能已存在）:", indexError);
      }
    } catch (error) {
      console.error("❌ verification_codes表创建失败:", error);
    }

    // 检查并创建user_modification_logs表
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS user_modification_logs (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL,
          old_value TEXT,
          new_value TEXT,
          month VARCHAR(7) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
      `);
      console.log("✅ user_modification_logs表创建成功");

      // 创建索引
      try {
        await db.execute(sql`CREATE INDEX IF NOT EXISTS user_modification_logs_user_id_idx ON user_modification_logs(user_id);`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS user_modification_logs_type_idx ON user_modification_logs(type);`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS user_modification_logs_month_idx ON user_modification_logs(month);`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS user_modification_logs_user_id_month_idx ON user_modification_logs(user_id, month);`);
        console.log("✅ user_modification_logs表索引创建成功");
      } catch (indexError) {
        console.log("⚠️  user_modification_logs表索引创建警告（可能已存在）:", indexError);
      }
    } catch (error) {
      console.error("❌ user_modification_logs表创建失败:", error);
    }

    // 检查并创建coaches表
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS coaches (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          experience_years INTEGER DEFAULT 0,
          certifications JSONB,
          specialties JSONB,
          teaching_style TEXT,
          teaching_areas JSONB,
          hourly_rate DECIMAL(10, 2),
          total_lessons INTEGER DEFAULT 0,
          average_rating DECIMAL(3, 2) DEFAULT '0.00',
          review_count INTEGER DEFAULT 0,
          available_days JSONB,
          available_time_slots JSONB,
          bank_info JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE
        );
      `);
      console.log("✅ coaches表创建成功");
    } catch (error) {
      console.error("❌ coaches表创建失败:", error);
    }

    // 检查并创建venues表
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS venues (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          type VARCHAR(20) NOT NULL,
          address TEXT NOT NULL,
          city VARCHAR(100) NOT NULL,
          district VARCHAR(100) NOT NULL,
          latitude DECIMAL(10, 8),
          longitude DECIMAL(11, 8),
          description TEXT,
          facilities JSONB,
          images JSONB,
          opening_hours JSONB,
          phone VARCHAR(20),
          is_active BOOLEAN DEFAULT true NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE
        );
      `);
      console.log("✅ venues表创建成功");
    } catch (error) {
      console.error("❌ venues表创建失败:", error);
    }

    // 检查并创建venue_slots表
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS venue_slots (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          venue_id VARCHAR(36) NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
          date TIMESTAMP WITH TIME ZONE NOT NULL,
          start_time TIMESTAMP WITH TIME ZONE NOT NULL,
          end_time TIMESTAMP WITH TIME ZONE NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          is_available BOOLEAN DEFAULT true NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
      `);
      console.log("✅ venue_slots表创建成功");
    } catch (error) {
      console.error("❌ venue_slots表创建失败:", error);
    }

    // 检查并创建courses表
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS courses (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          coach_id VARCHAR(36) NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
          type VARCHAR(20) NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          duration INTEGER NOT NULL,
          max_students INTEGER DEFAULT 1,
          price DECIMAL(10, 2) NOT NULL,
          level INTEGER DEFAULT 1,
          tags JSONB,
          is_public BOOLEAN DEFAULT true NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE
        );
      `);
      console.log("✅ courses表创建成功");
    } catch (error) {
      console.error("❌ courses表创建失败:", error);
    }

    // 检查并创建bookings表
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS bookings (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          course_id VARCHAR(36) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
          user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          coach_id VARCHAR(36) NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
          scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
          duration INTEGER NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          notes TEXT,
          payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
          payment_amount DECIMAL(10, 2),
          transaction_id VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE
        );
      `);
      console.log("✅ bookings表创建成功");
    } catch (error) {
      console.error("❌ bookings表创建失败:", error);
    }

    // 检查并创建chat_rooms表
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS chat_rooms (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          course_id VARCHAR(36) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
          booking_id VARCHAR(36) REFERENCES bookings(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          is_active BOOLEAN DEFAULT true NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE
        );
      `);
      console.log("✅ chat_rooms表创建成功");
    } catch (error) {
      console.error("❌ chat_rooms表创建失败:", error);
    }

    // 检查并创建chat_messages表
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          room_id VARCHAR(36) NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
          user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          message_type VARCHAR(50) NOT NULL DEFAULT 'text',
          content TEXT NOT NULL,
          is_read BOOLEAN DEFAULT false NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
      `);
      console.log("✅ chat_messages表创建成功");
    } catch (error) {
      console.error("❌ chat_messages表创建失败:", error);
    }

    // 创建索引
    try {
      await db.execute(sql`CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS coaches_user_id_idx ON coaches(user_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS venues_city_idx ON venues(city);`);
      console.log("✅ 索引创建成功");
    } catch (error) {
      console.error("❌ 索引创建失败:", error);
    }

    return NextResponse.json({
      success: true,
      message: "数据库初始化成功",
    });
  } catch (error) {
    console.error("数据库初始化失败:", error);
    return NextResponse.json(
      {
        success: false,
        message: "数据库初始化失败",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
