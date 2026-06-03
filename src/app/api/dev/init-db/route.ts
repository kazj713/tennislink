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

    // 检查并创建community_posts表
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS community_posts (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(20) NOT NULL DEFAULT 'text',
          content TEXT NOT NULL,
          images JSONB,
          video TEXT,
          tags JSONB,
          like_count INTEGER DEFAULT 0,
          comment_count INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE
        );
      `);
      console.log("✅ community_posts表创建成功");
    } catch (error) {
      console.error("❌ community_posts表创建失败:", error);
    }

    // 检查并创建community_comments表
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS community_comments (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          post_id VARCHAR(36) NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
          user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          parent_id VARCHAR(36) REFERENCES community_comments(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
      `);
      console.log("✅ community_comments表创建成功");
    } catch (error) {
      console.error("❌ community_comments表创建失败:", error);
    }

    // 检查并创建community_likes表
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS community_likes (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          post_id VARCHAR(36) NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
          user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
      `);
      console.log("✅ community_likes表创建成功");
    } catch (error) {
      console.error("❌ community_likes表创建失败:", error);
    }

    // 检查并创建matchups表
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS matchups (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          creator_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          venue_id VARCHAR(36) REFERENCES venues(id) ON DELETE SET NULL,
          scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
          start_time TIMESTAMP WITH TIME ZONE NOT NULL,
          end_time TIMESTAMP WITH TIME ZONE NOT NULL,
          skill_level INTEGER,
          max_players INTEGER NOT NULL,
          current_players INTEGER DEFAULT 1,
          description TEXT,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE
        );
      `);
      console.log("✅ matchups表创建成功");
    } catch (error) {
      console.error("❌ matchups表创建失败:", error);
    }

    // 检查并创建matchup_participants表
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS matchup_participants (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          matchup_id VARCHAR(36) NOT NULL REFERENCES matchups(id) ON DELETE CASCADE,
          user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
      `);
      console.log("✅ matchup_participants表创建成功");
    } catch (error) {
      console.error("❌ matchup_participants表创建失败:", error);
    }

    // 检查并创建tournaments表
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS tournaments (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          type VARCHAR(50) NOT NULL,
          category VARCHAR(50),
          venue_id VARCHAR(36) REFERENCES venues(id) ON DELETE SET NULL,
          start_date TIMESTAMP WITH TIME ZONE NOT NULL,
          end_date TIMESTAMP WITH TIME ZONE,
          registration_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
          max_players INTEGER NOT NULL,
          current_players INTEGER DEFAULT 0,
          entry_fee DECIMAL(10,2),
          prize_pool DECIMAL(10,2),
          rules TEXT,
          status VARCHAR(20) NOT NULL DEFAULT 'upcoming',
          poster TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE
        );
      `);
      console.log("✅ tournaments表创建成功");
    } catch (error) {
      console.error("❌ tournaments表创建失败:", error);
    }

    // 检查并创建tournament_participants表
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS tournament_participants (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          tournament_id VARCHAR(36) NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
          user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
          payment_amount DECIMAL(10,2),
          transaction_id VARCHAR(255)
        );
      `);
      console.log("✅ tournament_participants表创建成功");
    } catch (error) {
      console.error("❌ tournament_participants表创建失败:", error);
    }

    // 检查并创建vip_memberships表
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS vip_memberships (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          price DECIMAL(10,2) NOT NULL,
          duration INTEGER NOT NULL,
          benefits JSONB,
          is_active BOOLEAN DEFAULT true NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE
        );
      `);
      console.log("✅ vip_memberships表创建成功");
    } catch (error) {
      console.error("❌ vip_memberships表创建失败:", error);
    }

    // 检查并创建user_vip_subscriptions表
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS user_vip_subscriptions (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          membership_id VARCHAR(36) NOT NULL REFERENCES vip_memberships(id) ON DELETE CASCADE,
          start_date TIMESTAMP WITH TIME ZONE NOT NULL,
          end_date TIMESTAMP WITH TIME ZONE NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'active',
          payment_amount DECIMAL(10,2),
          payment_status VARCHAR(20) NOT NULL DEFAULT 'paid',
          transaction_id VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
      `);
      console.log("✅ user_vip_subscriptions表创建成功");
    } catch (error) {
      console.error("❌ user_vip_subscriptions表创建失败:", error);
    }

    // 检查并创建ai_analysis_records表
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS ai_analysis_records (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          coach_id VARCHAR(36) REFERENCES coaches(id) ON DELETE SET NULL,
          video_url TEXT NOT NULL,
          video_thumbnail TEXT,
          analysis_type VARCHAR(50) NOT NULL,
          analysis_result JSONB,
          improvement_suggestions TEXT,
          score INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
      `);
      console.log("✅ ai_analysis_records表创建成功");
    } catch (error) {
      console.error("❌ ai_analysis_records表创建失败:", error);
    }

    // 检查并创建coach_certifications表
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS coach_certifications (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL,
          file_key TEXT NOT NULL,
          file_name VARCHAR(255) NOT NULL,
          file_url TEXT,
          status VARCHAR(30) NOT NULL DEFAULT 'pending_review',
          reviewed_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
          reviewed_at TIMESTAMP WITH TIME ZONE,
          review_comment TEXT,
          rejection_reason TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE
        );
      `);
      console.log("✅ coach_certifications表创建成功");
    } catch (error) {
      console.error("❌ coach_certifications表创建失败:", error);
    }

    // 检查并创建notifications表
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS notifications (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(30) NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'unread',
          related_id VARCHAR(36),
          related_type VARCHAR(50),
          action_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE
        );
      `);
      console.log("✅ notifications表创建成功");
    } catch (error) {
      console.error("❌ notifications表创建失败:", error);
    }

    // 检查并创建payment_orders表
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS payment_orders (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          order_no VARCHAR(64) NOT NULL UNIQUE,
          type VARCHAR(50) NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          payment_method VARCHAR(50),
          transaction_id VARCHAR(255),
          buyer_id VARCHAR(255),
          buyer_account VARCHAR(255),
          paid_amount DECIMAL(10,2),
          paid_at TIMESTAMP WITH TIME ZONE,
          refund_amount DECIMAL(10,2),
          refunded_at TIMESTAMP WITH TIME ZONE,
          refund_reason TEXT,
          metadata JSONB,
          expires_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE
        );
      `);
      console.log("✅ payment_orders表创建成功");
    } catch (error) {
      console.error("❌ payment_orders表创建失败:", error);
    }

    // 检查并创建refund_requests表
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS refund_requests (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          payment_order_id VARCHAR(36) REFERENCES payment_orders(id) ON DELETE SET NULL,
          booking_id VARCHAR(36),
          reason TEXT NOT NULL,
          reason_type VARCHAR(30) NOT NULL DEFAULT 'personal',
          status VARCHAR(30) NOT NULL DEFAULT 'pending_auto',
          amount DECIMAL(10,2) NOT NULL,
          admin_note TEXT,
          reviewed_by VARCHAR(36),
          reviewed_at TIMESTAMP WITH TIME ZONE,
          refunded_at TIMESTAMP WITH TIME ZONE,
          refund_transaction_id VARCHAR(255),
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE
        );
      `);
      console.log("✅ refund_requests表创建成功");
    } catch (error) {
      console.error("❌ refund_requests表创建失败:", error);
    }

    // 检查并创建wallets表
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS wallets (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR(36) NOT NULL UNIQUE,
          balance DECIMAL(12,2) DEFAULT 0 NOT NULL,
          frozen_amount DECIMAL(12,2) DEFAULT 0 NOT NULL,
          total_recharged DECIMAL(14,2) DEFAULT 0 NOT NULL,
          total_spent DECIMAL(14,2) DEFAULT 0 NOT NULL,
          status VARCHAR(20) DEFAULT 'active' NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE
        );
      `);
      console.log("✅ wallets表创建成功");
    } catch (error) {
      console.error("❌ wallets表创建失败:", error);
    }

    // 检查并创建wallet_transactions表
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS wallet_transactions (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR(36) NOT NULL,
          wallet_id VARCHAR(36) NOT NULL,
          transaction_no VARCHAR(64),
          type VARCHAR(20) NOT NULL,
          amount DECIMAL(12,2) NOT NULL,
          balance_before DECIMAL(12,2) NOT NULL,
          balance_after DECIMAL(12,2) NOT NULL,
          description TEXT,
          related_order_id VARCHAR(36),
          related_order_type VARCHAR(20),
          status VARCHAR(20) DEFAULT 'completed' NOT NULL,
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
      `);
      console.log("✅ wallet_transactions表创建成功");
    } catch (error) {
      console.error("❌ wallet_transactions表创建失败:", error);
    }

    // 检查并创建system_settings表
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS system_settings (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          category VARCHAR(50) NOT NULL,
          key VARCHAR(100) NOT NULL,
          value JSONB NOT NULL,
          description TEXT,
          is_editable BOOLEAN DEFAULT true NOT NULL,
          updated_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE
        );
      `);
      console.log("✅ system_settings表创建成功");
    } catch (error) {
      console.error("❌ system_settings表创建失败:", error);
    }

    // 检查并创建clubs表
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS clubs (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          address TEXT NOT NULL,
          city VARCHAR(100) NOT NULL,
          district VARCHAR(100),
          latitude NUMERIC(10,8),
          longitude NUMERIC(11,8),
          phone VARCHAR(20),
          manager_id VARCHAR(36),
          images JSONB,
          facilities JSONB,
          opening_hours JSONB,
          is_active BOOLEAN DEFAULT true NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE
        );
      `);
      console.log("✅ clubs表创建成功");
    } catch (error) {
      console.error("❌ clubs表创建失败:", error);
    }

    // 检查并创建courts表
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS courts (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          club_id VARCHAR(36) NOT NULL,
          court_number VARCHAR(50) NOT NULL,
          name VARCHAR(255),
          court_type VARCHAR(20) NOT NULL DEFAULT 'indoor',
          surface_type VARCHAR(20) NOT NULL DEFAULT 'hard',
          description TEXT,
          images JSONB,
          is_active BOOLEAN DEFAULT true NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE
        );
      `);
      console.log("✅ courts表创建成功");
    } catch (error) {
      console.error("❌ courts表创建失败:", error);
    }

    // 检查并创建court_bookings表
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS court_bookings (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          booking_no VARCHAR(64) NOT NULL UNIQUE,
          user_id VARCHAR(36) NOT NULL,
          court_id VARCHAR(36) NOT NULL,
          booking_date DATE NOT NULL,
          start_time VARCHAR(5) NOT NULL,
          end_time VARCHAR(5) NOT NULL,
          total_hours NUMERIC(4,2) NOT NULL,
          total_amount NUMERIC(10,2) NOT NULL,
          status VARCHAR(30) NOT NULL DEFAULT 'pending_payment',
          payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
          cancel_reason TEXT,
          cancelled_by VARCHAR(36),
          cancelled_at TIMESTAMP WITH TIME ZONE,
          notes TEXT,
          notification_sent BOOLEAN DEFAULT false NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE,
          payment_order_id VARCHAR(36)
        );
      `);
      console.log("✅ court_bookings表创建成功");
    } catch (error) {
      console.error("❌ court_bookings表创建失败:", error);
    }

    // 检查并创建court_pricing表
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS court_pricing (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          court_id VARCHAR(36) NOT NULL,
          time_slot VARCHAR(20) NOT NULL,
          start_time VARCHAR(5) NOT NULL,
          end_time VARCHAR(5) NOT NULL,
          singles_price NUMERIC(10,2) NOT NULL,
          doubles_price NUMERIC(10,2) NOT NULL,
          is_active BOOLEAN DEFAULT true NOT NULL,
          effective_date DATE DEFAULT NOW() NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE
        );
      `);
      console.log("✅ court_pricing表创建成功");
    } catch (error) {
      console.error("❌ court_pricing表创建失败:", error);
    }

    // 检查并创建court_blocks表
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS court_blocks (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          court_id VARCHAR(36) NOT NULL,
          block_date DATE NOT NULL,
          start_time VARCHAR(5) NOT NULL,
          end_time VARCHAR(5) NOT NULL,
          reason TEXT NOT NULL,
          blocked_by VARCHAR(36) NOT NULL,
          is_recurring BOOLEAN DEFAULT false NOT NULL,
          recurrence_rule JSONB,
          is_active BOOLEAN DEFAULT true NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE
        );
      `);
      console.log("✅ court_blocks表创建成功");
    } catch (error) {
      console.error("❌ court_blocks表创建失败:", error);
    }

    // 检查并创建profit_sharing_rules表
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS profit_sharing_rules (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          percentage DECIMAL(5,2) NOT NULL,
          fixed_amount DECIMAL(10,2),
          min_amount DECIMAL(10,2),
          max_amount DECIMAL(10,2),
          conditions JSONB,
          is_active BOOLEAN DEFAULT true NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE
        );
      `);
      console.log("✅ profit_sharing_rules表创建成功");
    } catch (error) {
      console.error("❌ profit_sharing_rules表创建失败:", error);
    }

    // 检查并创建profit_sharing_recipients表
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS profit_sharing_recipients (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          coach_id VARCHAR(36) REFERENCES coaches(id) ON DELETE SET NULL,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          account_type VARCHAR(50) NOT NULL,
          account_info JSONB NOT NULL,
          is_active BOOLEAN DEFAULT true NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE
        );
      `);
      console.log("✅ profit_sharing_recipients表创建成功");
    } catch (error) {
      console.error("❌ profit_sharing_recipients表创建失败:", error);
    }

    // 检查并创建profit_sharing_records表
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS profit_sharing_records (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          booking_id VARCHAR(36) REFERENCES bookings(id) ON DELETE SET NULL,
          venue_booking_id VARCHAR(36) REFERENCES court_bookings(id) ON DELETE SET NULL,
          tournament_participant_id VARCHAR(36) REFERENCES tournament_participants(id) ON DELETE SET NULL,
          transaction_id VARCHAR(255) NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          recipient_id VARCHAR(36) NOT NULL REFERENCES profit_sharing_recipients(id) ON DELETE CASCADE,
          rule_id VARCHAR(36) REFERENCES profit_sharing_rules(id) ON DELETE SET NULL,
          status VARCHAR(30) NOT NULL DEFAULT 'pending',
          type VARCHAR(50) NOT NULL,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE
        );
      `);
      console.log("✅ profit_sharing_records表创建成功");
    } catch (error) {
      console.error("❌ profit_sharing_records表创建失败:", error);
    }

    // 检查并创建settlement_records表
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS settlement_records (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          recipient_id VARCHAR(36) NOT NULL REFERENCES profit_sharing_recipients(id) ON DELETE CASCADE,
          amount DECIMAL(10,2) NOT NULL,
          status VARCHAR(30) NOT NULL DEFAULT 'pending',
          settlement_date TIMESTAMP WITH TIME ZONE,
          payment_method VARCHAR(50),
          transaction_id VARCHAR(255),
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE
        );
      `);
      console.log("✅ settlement_records表创建成功");
    } catch (error) {
      console.error("❌ settlement_records表创建失败:", error);
    }

    // 检查并创建settlement_profit_sharing_links表
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS settlement_profit_sharing_links (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          settlement_id VARCHAR(36) NOT NULL REFERENCES settlement_records(id) ON DELETE CASCADE,
          profit_sharing_record_id VARCHAR(36) NOT NULL REFERENCES profit_sharing_records(id) ON DELETE CASCADE
        );
      `);
      console.log("✅ settlement_profit_sharing_links表创建成功");
    } catch (error) {
      console.error("❌ settlement_profit_sharing_links表创建失败:", error);
    }

    // 创建索引
    try {
      // 原有表索引
      await db.execute(sql`CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS coaches_user_id_idx ON coaches(user_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS venues_city_idx ON venues(city);`);

      // 社区相关索引
      await db.execute(sql`CREATE INDEX IF NOT EXISTS community_posts_user_id_idx ON community_posts(user_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS community_posts_type_idx ON community_posts(type);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS community_posts_created_at_idx ON community_posts(created_at DESC);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS community_comments_post_id_idx ON community_comments(post_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS community_comments_user_id_idx ON community_comments(user_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS community_comments_parent_id_idx ON community_comments(parent_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS community_likes_post_id_idx ON community_likes(post_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS community_likes_user_id_idx ON community_likes(user_id);`);
      await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS community_likes_unique ON community_likes(post_id, user_id);`);

      // 约球相关索引
      await db.execute(sql`CREATE INDEX IF NOT EXISTS matchups_creator_id_idx ON matchups(creator_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS matchups_venue_id_idx ON matchups(venue_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS matchups_scheduled_date_idx ON matchups(scheduled_date);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS matchups_status_idx ON matchups(status);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS matchup_participants_matchup_id_idx ON matchup_participants(matchup_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS matchup_participants_user_id_idx ON matchup_participants(user_id);`);

      // 赛事相关索引
      await db.execute(sql`CREATE INDEX IF NOT EXISTS tournaments_status_idx ON tournaments(status);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS tournaments_venue_id_idx ON tournaments(venue_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS tournaments_start_date_idx ON tournaments(start_date);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS tournament_participants_tournament_id_idx ON tournament_participants(tournament_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS tournament_participants_user_id_idx ON tournament_participants(user_id);`);

      // VIP会员索引
      await db.execute(sql`CREATE INDEX IF NOT EXISTS vip_memberships_is_active_idx ON vip_memberships(is_active);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS user_vip_subscriptions_user_id_idx ON user_vip_subscriptions(user_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS user_vip_subscriptions_membership_id_idx ON user_vip_subscriptions(membership_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS user_vip_subscriptions_status_idx ON user_vip_subscriptions(status);`);

      // AI分析索引
      await db.execute(sql`CREATE INDEX IF NOT EXISTS ai_analysis_records_user_id_idx ON ai_analysis_records(user_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS ai_analysis_records_coach_id_idx ON ai_analysis_records(coach_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS ai_analysis_records_type_idx ON ai_analysis_records(analysis_type);`);

      // 教练证书索引
      await db.execute(sql`CREATE INDEX IF NOT EXISTS coach_certifications_user_id_idx ON coach_certifications(user_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS coach_certifications_status_idx ON coach_certifications(status);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS coach_certifications_type_idx ON coach_certifications(type);`);

      // 通知索引
      await db.execute(sql`CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS notifications_type_idx ON notifications(type);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS notifications_status_idx ON notifications(status);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at DESC);`);

      // 支付订单索引
      await db.execute(sql`CREATE INDEX IF NOT EXISTS payment_orders_user_id_idx ON payment_orders(user_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS payment_orders_order_no_idx ON payment_orders(order_no);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS payment_orders_status_idx ON payment_orders(status);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS payment_orders_type_idx ON payment_orders(type);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS payment_orders_transaction_id_idx ON payment_orders(transaction_id);`);

      // 退款申请索引
      await db.execute(sql`CREATE INDEX IF NOT EXISTS refund_requests_user_id_idx ON refund_requests(user_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS refund_requests_payment_order_id_idx ON refund_requests(payment_order_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS refund_requests_status_idx ON refund_requests(status);`);

      // 钱包索引
      await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS wallets_user_id_unique ON wallets(user_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS wallet_transactions_wallet_id_idx ON wallet_transactions(wallet_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS wallet_transactions_user_id_idx ON wallet_transactions(user_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS wallet_transactions_type_idx ON wallet_transactions(type);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS wallet_transactions_transaction_no_idx ON wallet_transactions(transaction_no);`);

      // 系统设置索引
      await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS system_settings_category_key_unique ON system_settings(category, key);`);

      // 俱乐部索引
      await db.execute(sql`CREATE INDEX IF NOT EXISTS clubs_city_idx ON clubs(city);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS clubs_manager_id_idx ON clubs(manager_id);`);

      // 场地预订系统索引
      await db.execute(sql`CREATE INDEX IF NOT EXISTS courts_club_id_idx ON courts(club_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS courts_court_number_idx ON courts(club_id, court_number);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS court_bookings_court_id_idx ON court_bookings(court_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS court_bookings_user_id_idx ON court_bookings(user_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS court_bookings_booking_date_idx ON court_bookings(booking_date);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS court_bookings_status_idx ON court_bookings(status);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS court_pricing_court_id_idx ON court_pricing(court_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS court_blocks_court_id_idx ON court_blocks(court_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS court_blocks_block_date_idx ON court_blocks(block_date);`);

      // 分账结算索引
      await db.execute(sql`CREATE INDEX IF NOT EXISTS profit_sharing_rules_type_idx ON profit_sharing_rules(type);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS profit_sharing_recipients_user_id_idx ON profit_sharing_recipients(user_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS profit_sharing_recipients_coach_id_idx ON profit_sharing_recipients(coach_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS profit_sharing_records_booking_id_idx ON profit_sharing_records(booking_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS profit_sharing_records_venue_booking_id_idx ON profit_sharing_records(venue_booking_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS profit_sharing_records_recipient_id_idx ON profit_sharing_records(recipient_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS profit_sharing_records_status_idx ON profit_sharing_records(status);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS settlement_records_recipient_id_idx ON settlement_records(recipient_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS settlement_records_status_idx ON settlement_records(status);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS settlement_profit_sharing_links_settlement_id_idx ON settlement_profit_sharing_links(settlement_id);`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS settlement_profit_sharing_links_profit_sharing_record_id_idx ON settlement_profit_sharing_links(profit_sharing_record_id);`);

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
