/**
 * 数据库表结构定义
 * 定义了所有的数据库表结构、索引和类型验证
 */
import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
  decimal,
  pgEnum,
  date,
  numeric,
} from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

// ==================== 枚举定义 ====================

// 用户角色枚举
export const userRoleEnum = pgEnum("user_role", ["student", "coach", "admin"]);
// 性别枚举
export const genderEnum = pgEnum("gender", ["male", "female", "other"]);
// 预约状态枚举
export const bookingStatusEnum = pgEnum("booking_status", ["pending", "confirmed", "cancelled", "completed"]);
// 课程类型枚举
export const courseTypeEnum = pgEnum("course_type", [
  "one_on_one", // 一对一私教
  "small_group", // 小班课（2-4人）
  "large_group", // 大班课（5人以上）
  "kids", // 儿童课程
  "adults", // 成人课程
  "beginner", // 初学者课程
  "advanced", // 进阶课程
  "competition", // 竞赛课程
  "fitness", // 健身课程
  "technique" // 技术专项课程
]);
// 场地类型枚举
export const venueTypeEnum = pgEnum("venue_type", ["outdoor", "indoor", "mixed"]);
// 帖子类型枚举
export const postTypeEnum = pgEnum("post_type", ["text", "image", "video"]);
// 赛事状态枚举
export const tournamentStatusEnum = pgEnum("tournament_status", ["upcoming", "ongoing", "completed", "cancelled"]);
// VIP状态枚举
export const vipStatusEnum = pgEnum("vip_status", ["active", "expired", "cancelled"]);
// 教练状态枚举
export const coachStatusEnum = pgEnum("coach_status", ["pending", "approved", "rejected", "suspended"]);
// 支付状态枚举
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "failed", "refunded"]);
// 证书类型枚举
export const certificationTypeEnum = pgEnum("certification_type", ["professional", "safety", "coach", "experience"]);
// 证书审核状态枚举
export const certificationStatusEnum = pgEnum("certification_status", ["pending_review", "approved", "rejected"]);
// 验证码类型枚举
export const verificationTypeEnum = pgEnum("verification_type", ["register", "login", "bind_phone", "bind_email", "reset_password"]);
// 修改类型枚举
export const modificationTypeEnum = pgEnum("modification_type", ["username", "email", "phone", "avatar"]);
// 学习目标枚举
export const learningGoalEnum = pgEnum("learning_goal", ["fat_loss", "entertainment", "skill_improvement", "competition"]);
// 通知类型枚举
export const notificationTypeEnum = pgEnum("notification_type", [
  "system", // 系统通知
  "booking", // 预约相关通知
  "coach_review", // 教练评价通知
  "matchup", // 约球相关通知
  "tournament", // 赛事相关通知
  "payment", // 支付相关通知
  "vip" // VIP会员相关通知
]);
// 通知状态枚举
export const notificationStatusEnum = pgEnum("notification_status", ["unread", "read", "archived"]);

// 分账状态枚举
export const profitSharingStatusEnum = pgEnum("profit_sharing_status", ["pending", "completed", "failed", "refunded"]);

// 结算状态枚举
export const settlementStatusEnum = pgEnum("settlement_status", ["pending", "processing", "completed", "failed"]);

// 分账类型枚举
export const profitSharingTypeEnum = pgEnum("profit_sharing_type", ["course", "venue", "tournament", "other"]);

// ==================== 用户相关表 ====================

// 用户表
export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 36 }) // 用户ID（UUID）
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    username: varchar("username", { length: 50 }).unique(), // 用户名（唯一）
    email: varchar("email", { length: 255 }).notNull().unique(), // 邮箱（唯一）
    phone: varchar("phone", { length: 20 }).unique(), // 手机号（唯一）
    password: text("password"), // 密码（加密后）
    name: varchar("name", { length: 128 }).notNull(), // 真实姓名
    avatar: text("avatar"), // 头像URL
    role: userRoleEnum("role").notNull().default("student"), // 角色
    gender: genderEnum("gender"), // 性别
    birthDate: timestamp("birth_date", { withTimezone: true }), // 出生日期
    city: varchar("city", { length: 100 }), // 城市
    district: varchar("district", { length: 100 }), // 区域
    skillLevel: integer("skill_level").default(1), // 球技水平（1-10）
    learningGoal: learningGoalEnum("learning_goal"), // 学习目标
    bio: text("bio"), // 个人简介
    wechatOpenid: varchar("wechat_openid", { length: 100 }).unique(), // 微信OpenID
    isActive: boolean("is_active").default(true).notNull(), // 是否激活
    createdAt: timestamp("created_at", { withTimezone: true }) // 创建时间
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }), // 更新时间
  },
  (table) => ({
    usernameIdx: index("users_username_idx").on(table.username), // 用户名索引
    emailIdx: index("users_email_idx").on(table.email), // 邮箱索引
    phoneIdx: index("users_phone_idx").on(table.phone), // 手机号索引
    roleIdx: index("users_role_idx").on(table.role), // 角色索引
    wechatOpenidIdx: index("users_wechat_openid_idx").on(table.wechatOpenid), // 微信OpenID索引
  })
);

// ==================== 验证码表 ====================

// 验证码表（用于邮箱和手机验证码）
export const verificationCodes = pgTable(
  "verification_codes",
  {
    id: varchar("id", { length: 36 }) // 验证码ID（UUID）
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    target: varchar("target", { length: 255 }).notNull(), // 邮箱或手机号
    type: verificationTypeEnum("type").notNull(), // 验证码类型
    code: varchar("code", { length: 6 }).notNull(), // 6位验证码
    isUsed: boolean("is_used").default(false).notNull(), // 是否已使用
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), // 过期时间
    createdAt: timestamp("created_at", { withTimezone: true }) // 创建时间
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    targetIdx: index("verification_codes_target_idx").on(table.target), // 目标索引
    typeIdx: index("verification_codes_type_idx").on(table.type), // 类型索引
    expiresAtIdx: index("verification_codes_expires_at_idx").on(table.expiresAt), // 过期时间索引
  })
);

// ==================== 用户修改记录表 ====================

// 用户修改记录表（记录用户修改头像、用户名、手机号、邮箱的次数）
export const userModificationLogs = pgTable(
  "user_modification_logs",
  {
    id: varchar("id", { length: 36 }) // 记录ID（UUID）
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }), // 用户ID
    type: modificationTypeEnum("type").notNull(), // 修改类型：username, email, phone, avatar
    oldValue: text("old_value"), // 修改前的值
    newValue: text("new_value"), // 修改后的值
    month: varchar("month", { length: 7 }).notNull(), // 格式：YYYY-MM，用于统计月度修改次数
    createdAt: timestamp("created_at", { withTimezone: true }) // 创建时间
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("user_modification_logs_user_id_idx").on(table.userId), // 用户ID索引
    typeIdx: index("user_modification_logs_type_idx").on(table.type), // 类型索引
    monthIdx: index("user_modification_logs_month_idx").on(table.month), // 月份索引
    userIdMonthIdx: index("user_modification_logs_user_id_month_idx").on(table.userId, table.month), // 用户ID+月份联合索引
  })
);

// ==================== 通知相关表 ====================

// 通知表
export const notifications = pgTable(
  "notifications",
  {
    id: varchar("id", { length: 36 }) // 通知ID（UUID）
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }), // 接收通知的用户ID
    type: notificationTypeEnum("type").notNull(), // 通知类型
    title: varchar("title", { length: 255 }).notNull(), // 通知标题
    message: text("message").notNull(), // 通知内容
    status: notificationStatusEnum("status").notNull().default("unread"), // 通知状态
    relatedId: varchar("related_id", { length: 36 }), // 相关实体ID（如预约ID、课程ID等）
    relatedType: varchar("related_type", { length: 50 }), // 相关实体类型
    actionUrl: text("action_url"), // 操作链接
    createdAt: timestamp("created_at", { withTimezone: true }) // 创建时间
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }), // 更新时间
  },
  (table) => ({
    userIdIdx: index("notifications_user_id_idx").on(table.userId), // 用户ID索引
    typeIdx: index("notifications_type_idx").on(table.type), // 类型索引
    statusIdx: index("notifications_status_idx").on(table.status), // 状态索引
    createdAtIdx: index("notifications_created_at_idx").on(table.createdAt), // 创建时间索引
    userIdStatusIdx: index("notifications_user_id_status_idx").on(table.userId, table.status), // 用户ID+状态联合索引
  })
);

// ==================== 教练相关表 ====================

// 教练详情表
export const coaches = pgTable(
  "coaches",
  {
    id: varchar("id", { length: 36 }) // 教练ID（UUID）
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }), // 关联的用户ID
    status: coachStatusEnum("status").notNull().default("pending"), // 教练状态
    experienceYears: integer("experience_years").default(0), // 经验年限
    certifications: jsonb("certifications"), // 证书列表（JSON数组）
    specialties: jsonb("specialties"), // 专长领域（JSON数组）
    teachingStyle: text("teaching_style"), // 教学风格
    teachingAreas: jsonb("teaching_areas"), // 可教学区域（JSON数组）
    hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }), // 每小时费用
    totalLessons: integer("total_lessons").default(0), // 总课程数
    averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0.00"), // 平均评分
    reviewCount: integer("review_count").default(0), // 评价数量
    availableDays: jsonb("available_days"), // 可用日期 [1-7，1=周一]
    availableTimeSlots: jsonb("available_time_slots"), // 可用时间段（JSON数组）
    bankInfo: jsonb("bank_info"), // 银行账户信息（用于收款）
    createdAt: timestamp("created_at", { withTimezone: true }) // 创建时间
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }), // 更新时间
  },
  (table) => ({
    userIdIdx: index("coaches_user_id_idx").on(table.userId), // 用户ID索引
    statusIdx: index("coaches_status_idx").on(table.status), // 状态索引
  })
);

// 教练评价表
export const coachReviews = pgTable(
  "coach_reviews",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    coachId: varchar("coach_id", { length: 36 }).notNull().references(() => coaches.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(), // 1-5
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    coachIdIdx: index("coach_reviews_coach_id_idx").on(table.coachId),
    userIdIdx: index("coach_reviews_user_id_idx").on(table.userId),
  })
);

// ==================== 课程相关表 ====================

// 课程类型表
export const courses = pgTable(
  "courses",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    coachId: varchar("coach_id", { length: 36 }).notNull().references(() => coaches.id, { onDelete: "cascade" }),
    type: courseTypeEnum("type").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    duration: integer("duration").notNull(), // 课程时长（分钟）
    maxStudents: integer("max_students").default(1),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    level: integer("level").default(1), // 适合水平 1-10
    tags: jsonb("tags"), // 标签
    isPublic: boolean("is_public").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    coachIdIdx: index("courses_coach_id_idx").on(table.coachId),
    typeIdx: index("courses_type_idx").on(table.type),
  })
);

// 课程预约表
export const bookings = pgTable(
  "bookings",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    courseId: varchar("course_id", { length: 36 }).notNull().references(() => courses.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    coachId: varchar("coach_id", { length: 36 }).notNull().references(() => coaches.id, { onDelete: "cascade" }),
    scheduledDate: timestamp("scheduled_date", { withTimezone: true }).notNull(),
    duration: integer("duration").notNull(),
    status: bookingStatusEnum("status").notNull().default("pending"),
    notes: text("notes"),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
    paymentAmount: decimal("payment_amount", { precision: 10, scale: 2 }),
    transactionId: varchar("transaction_id", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    courseIdIdx: index("bookings_course_id_idx").on(table.courseId),
    userIdIdx: index("bookings_user_id_idx").on(table.userId),
    coachIdIdx: index("bookings_coach_id_idx").on(table.coachId),
    scheduledDateIdx: index("bookings_scheduled_date_idx").on(table.scheduledDate),
    statusIdx: index("bookings_status_idx").on(table.status),
  })
);

// ==================== 场地相关表 ====================

// 场地表
export const venues = pgTable(
  "venues",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 255 }).notNull(),
    type: venueTypeEnum("type").notNull(),
    address: text("address").notNull(),
    city: varchar("city", { length: 100 }).notNull(),
    district: varchar("district", { length: 100 }).notNull(),
    latitude: decimal("latitude", { precision: 10, scale: 8 }),
    longitude: decimal("longitude", { precision: 11, scale: 8 }),
    description: text("description"),
    facilities: jsonb("facilities"), // 设施列表
    images: jsonb("images"), // 场地图片
    openingHours: jsonb("opening_hours"), // 营业时间
    phone: varchar("phone", { length: 20 }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    cityIdx: index("venues_city_idx").on(table.city),
    typeIdx: index("venues_type_idx").on(table.type),
  })
);

// 场地时段表
export const venueSlots = pgTable(
  "venue_slots",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    venueId: varchar("venue_id", { length: 36 }).notNull().references(() => venues.id, { onDelete: "cascade" }),
    date: timestamp("date", { withTimezone: true }).notNull(),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    isAvailable: boolean("is_available").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    venueIdIdx: index("venue_slots_venue_id_idx").on(table.venueId),
    dateIdx: index("venue_slots_date_idx").on(table.date),
  })
);

// 场地预约表
export const venueBookings = pgTable(
  "venue_bookings",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    venueId: varchar("venue_id", { length: 36 }).notNull().references(() => venues.id, { onDelete: "cascade" }),
    slotId: varchar("slot_id", { length: 36 }).notNull().references(() => venueSlots.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    bookingDate: timestamp("booking_date", { withTimezone: true }).notNull(),
    status: bookingStatusEnum("status").notNull().default("pending"),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
    paymentAmount: decimal("payment_amount", { precision: 10, scale: 2 }),
    transactionId: varchar("transaction_id", { length: 255 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    venueIdIdx: index("venue_bookings_venue_id_idx").on(table.venueId),
    slotIdIdx: index("venue_bookings_slot_id_idx").on(table.slotId),
    userIdIdx: index("venue_bookings_user_id_idx").on(table.userId),
    bookingDateIdx: index("venue_bookings_booking_date_idx").on(table.bookingDate),
  })
);

// ==================== 社区相关表 ====================

// 社区动态表
export const communityPosts = pgTable(
  "community_posts",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    type: postTypeEnum("type").notNull().default("text"),
    content: text("content").notNull(),
    images: jsonb("images"), // 图片列表
    video: text("video"), // 视频URL
    tags: jsonb("tags"), // 标签
    likeCount: integer("like_count").default(0),
    commentCount: integer("comment_count").default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index("community_posts_user_id_idx").on(table.userId),
    createdAtIdx: index("community_posts_created_at_idx").on(table.createdAt),
  })
);

// 社区评论表
export const communityComments = pgTable(
  "community_comments",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    postId: varchar("post_id", { length: 36 }).notNull().references(() => communityPosts.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    parentId: varchar("parent_id", { length: 36 }).references(() => communityComments.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    postIdIdx: index("community_comments_post_id_idx").on(table.postId),
    userIdIdx: index("community_comments_user_id_idx").on(table.userId),
    parentIdIdx: index("community_comments_parent_id_idx").on(table.parentId),
  })
) as any;

// 社区点赞表
export const communityLikes = pgTable(
  "community_likes",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    postId: varchar("post_id", { length: 36 }).notNull().references(() => communityPosts.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    postIdIdx: index("community_likes_post_id_idx").on(table.postId),
    userIdIdx: index("community_likes_user_id_idx").on(table.userId),
    uniqueLike: index("community_likes_unique_idx").on(table.postId, table.userId),
  })
);

// ==================== 约球相关表 ====================

// 约球表
export const matchups = pgTable(
  "matchups",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    creatorId: varchar("creator_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    venueId: varchar("venue_id", { length: 36 }).references(() => venues.id, { onDelete: "set null" }),
    scheduledDate: timestamp("scheduled_date", { withTimezone: true }).notNull(),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    skillLevel: integer("skill_level"), // 要求水平
    maxPlayers: integer("max_players").notNull(),
    currentPlayers: integer("current_players").default(1),
    description: text("description"),
    status: bookingStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    creatorIdIdx: index("matchups_creator_id_idx").on(table.creatorId),
    venueIdIdx: index("matchups_venue_id_idx").on(table.venueId),
    scheduledDateIdx: index("matchups_scheduled_date_idx").on(table.scheduledDate),
  })
);

// 约球参与者表
export const matchupParticipants = pgTable(
  "matchup_participants",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    matchupId: varchar("matchup_id", { length: 36 }).notNull().references(() => matchups.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    status: bookingStatusEnum("status").notNull().default("confirmed"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    matchupIdIdx: index("matchup_participants_matchup_id_idx").on(table.matchupId),
    userIdIdx: index("matchup_participants_user_id_idx").on(table.userId),
    uniqueParticipant: index("matchup_participants_unique_idx").on(table.matchupId, table.userId),
  })
);

// ==================== 赛事相关表 ====================

// 赛事表
export const tournaments = pgTable(
  "tournaments",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    type: varchar("type", { length: 50 }).notNull(), // 单打/双打
    category: varchar("category", { length: 50 }), // 青少年/成人/专业
    venueId: varchar("venue_id", { length: 36 }).references(() => venues.id, { onDelete: "set null" }),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }),
    registrationDeadline: timestamp("registration_deadline", { withTimezone: true }).notNull(),
    maxParticipants: integer("max_players").notNull(),
    currentParticipants: integer("current_players").default(0),
    entryFee: decimal("entry_fee", { precision: 10, scale: 2 }),
    prizePool: decimal("prize_pool", { precision: 10, scale: 2 }),
    rules: text("rules"),
    status: tournamentStatusEnum("status").notNull().default("upcoming"),
    poster: text("poster"), // 赛事海报
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    venueIdIdx: index("tournaments_venue_id_idx").on(table.venueId),
    startDateIdx: index("tournaments_start_date_idx").on(table.startDate),
    statusIdx: index("tournaments_status_idx").on(table.status),
  })
);

// 赛事参与者表
export const tournamentParticipants = pgTable(
  "tournament_participants",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tournamentId: varchar("tournament_id", { length: 36 }).notNull().references(() => tournaments.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    registrationDate: timestamp("registration_date", { withTimezone: true })
      .defaultNow()
      .notNull(),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
    paymentAmount: decimal("payment_amount", { precision: 10, scale: 2 }),
    transactionId: varchar("transaction_id", { length: 255 }),
  },
  (table) => ({
    tournamentIdIdx: index("tournament_participants_tournament_id_idx").on(table.tournamentId),
    userIdIdx: index("tournament_participants_user_id_idx").on(table.userId),
    uniqueParticipant: index("tournament_participants_unique_idx").on(table.tournamentId, table.userId),
  })
);

// ==================== VIP会员相关表 ====================

// VIP会员套餐表
export const vipMemberships = pgTable(
  "vip_memberships",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    duration: integer("duration").notNull(), // 会员时长（天）
    benefits: jsonb("benefits"), // 权益列表
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    isActiveIdx: index("vip_memberships_is_active_idx").on(table.isActive),
  })
);

// 用户VIP订阅表
export const userVipSubscriptions = pgTable(
  "user_vip_subscriptions",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    membershipId: varchar("membership_id", { length: 36 }).notNull().references(() => vipMemberships.id, { onDelete: "cascade" }),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    status: vipStatusEnum("status").notNull().default("active"),
    paymentAmount: decimal("payment_amount", { precision: 10, scale: 2 }),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("paid"),
    transactionId: varchar("transaction_id", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("user_vip_subscriptions_user_id_idx").on(table.userId),
    membershipIdIdx: index("user_vip_subscriptions_membership_id_idx").on(table.membershipId),
    statusIdx: index("user_vip_subscriptions_status_idx").on(table.status),
  })
);

// ==================== AI 分析相关表 ====================

// AI 分析记录表
export const aiAnalysisRecords = pgTable(
  "ai_analysis_records",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    coachId: varchar("coach_id", { length: 36 }).references(() => coaches.id, { onDelete: "set null" }),
    videoUrl: text("video_url").notNull(), // 视频存储的 key
    videoThumbnail: text("video_thumbnail"), // 视频缩略图
    analysisType: varchar("analysis_type", { length: 50 }).notNull(), // 分析类型
    analysisResult: jsonb("analysis_result"), // 分析结果
    improvementSuggestions: text("improvement_suggestions"), // 改进建议
    score: integer("score"), // 动作评分
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("ai_analysis_records_user_id_idx").on(table.userId),
    coachIdIdx: index("ai_analysis_records_coach_id_idx").on(table.coachId),
    createdAtIdx: index("ai_analysis_records_created_at_idx").on(table.createdAt),
  })
);

// ==================== 教练证书相关表 ====================

// 教练证书表
export const coachCertifications = pgTable(
  "coach_certifications",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }), // 关联用户
    type: certificationTypeEnum("type").notNull(), // 证书类型
    fileKey: text("file_key").notNull(), // 文件存储 key
    fileName: varchar("file_name", { length: 255 }).notNull(), // 原始文件名
    fileUrl: text("file_url"), // 文件访问 URL
    status: certificationStatusEnum("status").notNull().default("pending_review"), // 审核状态
    reviewedBy: varchar("reviewed_by", { length: 36 }).references(() => users.id, { onDelete: "set null" }), // 审核人
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }), // 审核时间
    reviewComment: text("review_comment"), // 审核意见
    rejectionReason: text("rejection_reason"), // 拒绝原因
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index("coach_certifications_user_id_idx").on(table.userId),
    typeIdx: index("coach_certifications_type_idx").on(table.type),
    statusIdx: index("coach_certifications_status_idx").on(table.status),
    reviewedByIdx: index("coach_certifications_reviewed_by_idx").on(table.reviewedBy),
  })
);

// ==================== 聊天室相关表 ====================

// 聊天室表
export const chatRooms = pgTable(
  "chat_rooms",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    courseId: varchar("course_id", { length: 36 }).notNull().references(() => courses.id, { onDelete: "cascade" }),
    bookingId: varchar("booking_id", { length: 36 }).references(() => bookings.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(), // 聊天室名称
    type: varchar("type", { length: 50 }).notNull(), // private, group
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    courseIdIdx: index("chat_rooms_course_id_idx").on(table.courseId),
    bookingIdIdx: index("chat_rooms_booking_id_idx").on(table.bookingId),
    typeIdx: index("chat_rooms_type_idx").on(table.type),
  })
);

// 聊天消息表
export const chatMessages = pgTable(
  "chat_messages",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    roomId: varchar("room_id", { length: 36 }).notNull().references(() => chatRooms.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    messageType: varchar("message_type", { length: 50 }).notNull().default("text"), // text, image, file
    content: text("content").notNull(), // 消息内容（文本或文件URL）
    isRead: boolean("is_read").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    roomIdIdx: index("chat_messages_room_id_idx").on(table.roomId),
    userIdIdx: index("chat_messages_user_id_idx").on(table.userId),
    createdAtIdx: index("chat_messages_created_at_idx").on(table.createdAt),
  })
);

// ==================== 分账相关表 ====================

// 分账规则表
export const profitSharingRules = pgTable(
  "profit_sharing_rules",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 255 }).notNull(), // 规则名称
    type: profitSharingTypeEnum("type").notNull(), // 分账类型
    percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(), // 分账比例
    fixedAmount: decimal("fixed_amount", { precision: 10, scale: 2 }), // 固定金额
    minAmount: decimal("min_amount", { precision: 10, scale: 2 }), // 最小分账金额
    maxAmount: decimal("max_amount", { precision: 10, scale: 2 }), // 最大分账金额
    conditions: jsonb("conditions"), // 分账条件
    isActive: boolean("is_active").default(true).notNull(), // 是否激活
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    typeIdx: index("profit_sharing_rules_type_idx").on(table.type),
    isActiveIdx: index("profit_sharing_rules_is_active_idx").on(table.isActive),
  })
);

// 分账接收方表
export const profitSharingRecipients = pgTable(
  "profit_sharing_recipients",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }), // 关联用户
    coachId: varchar("coach_id", { length: 36 }).references(() => coaches.id, { onDelete: "set null" }), // 关联教练
    name: varchar("name", { length: 255 }).notNull(), // 接收方名称
    type: varchar("type", { length: 50 }).notNull(), // 接收方类型（coach, venue, platform等）
    accountType: varchar("account_type", { length: 50 }).notNull(), // 账户类型（bank, wechat, alipay等）
    accountInfo: jsonb("account_info").notNull(), // 账户信息
    isActive: boolean("is_active").default(true).notNull(), // 是否激活
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index("profit_sharing_recipients_user_id_idx").on(table.userId),
    coachIdIdx: index("profit_sharing_recipients_coach_id_idx").on(table.coachId),
    typeIdx: index("profit_sharing_recipients_type_idx").on(table.type),
    isActiveIdx: index("profit_sharing_recipients_is_active_idx").on(table.isActive),
  })
);

// 分账记录表
export const profitSharingRecords = pgTable(
  "profit_sharing_records",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    bookingId: varchar("booking_id", { length: 36 }).references(() => bookings.id, { onDelete: "set null" }), // 关联预约
    venueBookingId: varchar("venue_booking_id", { length: 36 }).references(() => venueBookings.id, { onDelete: "set null" }), // 关联场地预约
    tournamentParticipantId: varchar("tournament_participant_id", { length: 36 }).references(() => tournamentParticipants.id, { onDelete: "set null" }), // 关联赛事参与
    transactionId: varchar("transaction_id", { length: 255 }).notNull(), // 交易ID
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // 分账金额
    recipientId: varchar("recipient_id", { length: 36 }).notNull().references(() => profitSharingRecipients.id, { onDelete: "cascade" }), // 接收方
    ruleId: varchar("rule_id", { length: 36 }).references(() => profitSharingRules.id, { onDelete: "set null" }), // 分账规则
    status: profitSharingStatusEnum("status").notNull().default("pending"), // 分账状态
    type: profitSharingTypeEnum("type").notNull(), // 分账类型
    notes: text("notes"), // 备注
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    recipientIdIdx: index("profit_sharing_records_recipient_id_idx").on(table.recipientId),
    statusIdx: index("profit_sharing_records_status_idx").on(table.status),
    typeIdx: index("profit_sharing_records_type_idx").on(table.type),
    transactionIdIdx: index("profit_sharing_records_transaction_id_idx").on(table.transactionId),
  })
);

// 结算记录表
export const settlementRecords = pgTable(
  "settlement_records",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    recipientId: varchar("recipient_id", { length: 36 }).notNull().references(() => profitSharingRecipients.id, { onDelete: "cascade" }), // 接收方
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // 结算金额
    status: settlementStatusEnum("status").notNull().default("pending"), // 结算状态
    settlementDate: timestamp("settlement_date", { withTimezone: true }), // 结算日期
    paymentMethod: varchar("payment_method", { length: 50 }), // 支付方式
    transactionId: varchar("transaction_id", { length: 255 }), // 交易ID
    notes: text("notes"), // 备注
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    recipientIdIdx: index("settlement_records_recipient_id_idx").on(table.recipientId),
    statusIdx: index("settlement_records_status_idx").on(table.status),
    settlementDateIdx: index("settlement_records_settlement_date_idx").on(table.settlementDate),
  })
);

// 结算 - 分账关联表
export const settlementProfitSharingLinks = pgTable(
  "settlement_profit_sharing_links",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    settlementId: varchar("settlement_id", { length: 36 }).notNull().references(() => settlementRecords.id, { onDelete: "cascade" }), // 结算记录 ID
    profitSharingRecordId: varchar("profit_sharing_record_id", { length: 36 }).notNull().references(() => profitSharingRecords.id, { onDelete: "cascade" }), // 分账记录 ID
  },
  (table) => ({
    settlementIdIdx: index("settlement_profit_sharing_links_settlement_id_idx").on(table.settlementId),
    profitSharingRecordIdIdx: index("settlement_profit_sharing_links_profit_sharing_record_id_idx").on(table.profitSharingRecordId),
  })
);

// ==================== 支付订单相关表 ====================

// 支付订单表
export const paymentOrders = pgTable(
  "payment_orders",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }), // 用户 ID
    orderNo: varchar("order_no", { length: 64 }).notNull().unique(), // 订单号（唯一）
    type: varchar("type", { length: 50 }).notNull(), // 订单类型：booking, membership, course, product
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // 订单金额（分）
    status: paymentStatusEnum("status").notNull().default("pending"), // 支付状态
    paymentMethod: varchar("payment_method", { length: 50 }), // 支付方式：wechat, alipay
    transactionId: varchar("transaction_id", { length: 255 }), // 第三方支付交易号
    buyerId: varchar("buyer_id", { length: 255 }), // 买家标识
    buyerAccount: varchar("buyer_account", { length: 255 }), // 买家账号
    paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }), // 实付金额
    paidAt: timestamp("paid_at", { withTimezone: true }), // 支付时间
    refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }), // 退款金额
    refundedAt: timestamp("refunded_at", { withTimezone: true }), // 退款时间
    refundReason: text("refund_reason"), // 退款原因
    metadata: jsonb("metadata"), // 订单元数据（存储业务相关信息）
    expiresAt: timestamp("expires_at", { withTimezone: true }), // 订单过期时间
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index("payment_orders_user_id_idx").on(table.userId),
    orderNoIdx: index("payment_orders_order_no_idx").on(table.orderNo),
    typeIdx: index("payment_orders_type_idx").on(table.type),
    statusIdx: index("payment_orders_status_idx").on(table.status),
    transactionIdIdx: index("payment_orders_transaction_id_idx").on(table.transactionId),
    createdAtIdx: index("payment_orders_created_at_idx").on(table.createdAt),
  })
);

// ==================== Zod Schemas ====================

const { createInsertSchema: createCoercedInsertSchema } = createSchemaFactory({
  coerce: { date: true },
});

// Refund Requests
export const refundRequestStatusEnum = pgEnum("refund_request_status", [
  "pending_auto",
  "pending_manual",
  "approved",
  "rejected",
  "refunded",
]);

export const refundReasonTypeEnum = pgEnum("refund_reason_type", [
  "personal",
  "schedule_change",
  "weather",
  "other",
]);

export const refundRequests = pgTable(
  "refund_requests",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    paymentOrderId: varchar("payment_order_id", { length: 36 }).references(() => paymentOrders.id, { onDelete: "set null" }),
    bookingId: varchar("booking_id", { length: 36 }),
    reason: text("reason").notNull(),
    reasonType: refundReasonTypeEnum("reason_type").notNull().default("personal"),
    status: refundRequestStatusEnum("status").notNull().default("pending_auto"),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    adminNote: text("admin_note"),
    reviewedBy: varchar("reviewed_by", { length: 36 }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    refundedAt: timestamp("refunded_at", { withTimezone: true }),
    refundTransactionId: varchar("refund_transaction_id", { length: 255 }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_refund_requests_user_id").on(table.userId),
    index("idx_refund_requests_payment_order_id").on(table.paymentOrderId),
    index("idx_refund_requests_status").on(table.status),
    index("idx_refund_requests_created_at").on(table.createdAt),
  ]
);

export type RefundRequest = typeof refundRequests.$inferSelect;
export type InsertRefundRequest = typeof refundRequests.$inferInsert;

// Users
export const insertUserSchema = createCoercedInsertSchema(users).pick({
  username: true,
  email: true,
  phone: true,
  password: true,
  name: true,
  avatar: true,
  role: true,
  gender: true,
  birthDate: true,
  city: true,
  district: true,
  skillLevel: true,
  learningGoal: true,
  bio: true,
  wechatOpenid: true,
  isActive: true,
});

export const updateUserSchema = createCoercedInsertSchema(users)
  .pick({
    email: true,
    phone: true,
    password: true,
    name: true,
    avatar: true,
    gender: true,
    birthDate: true,
    city: true,
    district: true,
    skillLevel: true,
    learningGoal: true,
    bio: true,
    wechatOpenid: true,
    isActive: true,
  })
  .partial();

// VerificationCodes
export const insertVerificationCodeSchema = createCoercedInsertSchema(verificationCodes).pick({
  target: true,
  type: true,
  code: true,
  expiresAt: true,
});

export const updateVerificationCodeSchema = createCoercedInsertSchema(verificationCodes)
  .pick({
    isUsed: true,
  })
  .partial();

// UserModificationLogs
export const insertUserModificationLogSchema = createCoercedInsertSchema(userModificationLogs).pick({
  userId: true,
  type: true,
  oldValue: true,
  newValue: true,
  month: true,
});

// Coaches
export const insertCoachSchema = createCoercedInsertSchema(coaches).pick({
  userId: true,
  status: true,
  experienceYears: true,
  certifications: true,
  specialties: true,
  teachingStyle: true,
  teachingAreas: true,
  hourlyRate: true,
  availableDays: true,
  availableTimeSlots: true,
  bankInfo: true,
});

export const updateCoachSchema = createCoercedInsertSchema(coaches)
  .pick({
    status: true,
    experienceYears: true,
    certifications: true,
    specialties: true,
    teachingStyle: true,
    teachingAreas: true,
    hourlyRate: true,
    availableDays: true,
    availableTimeSlots: true,
    bankInfo: true,
  })
  .partial();

// Coach Reviews
export const insertCoachReviewSchema = createCoercedInsertSchema(coachReviews).pick({
  coachId: true,
  userId: true,
  rating: true,
  comment: true,
});

// Courses
export const insertCourseSchema = createCoercedInsertSchema(courses).pick({
  coachId: true,
  type: true,
  title: true,
  description: true,
  duration: true,
  maxStudents: true,
  price: true,
  level: true,
  tags: true,
  isPublic: true,
});

export const updateCourseSchema = createCoercedInsertSchema(courses)
  .pick({
    type: true,
    title: true,
    description: true,
    duration: true,
    maxStudents: true,
    price: true,
    level: true,
    tags: true,
    isPublic: true,
  })
  .partial();

// Bookings
export const insertBookingSchema = createCoercedInsertSchema(bookings).pick({
  courseId: true,
  userId: true,
  coachId: true,
  scheduledDate: true,
  duration: true,
  notes: true,
});

export const updateBookingSchema = createCoercedInsertSchema(bookings)
  .pick({
    status: true,
    paymentStatus: true,
    paymentAmount: true,
    transactionId: true,
    notes: true,
  })
  .partial();

// Venues
export const insertVenueSchema = createCoercedInsertSchema(venues).pick({
  name: true,
  type: true,
  address: true,
  city: true,
  district: true,
  latitude: true,
  longitude: true,
  description: true,
  facilities: true,
  images: true,
  openingHours: true,
  phone: true,
  isActive: true,
});

export const updateVenueSchema = createCoercedInsertSchema(venues)
  .pick({
    name: true,
    type: true,
    address: true,
    city: true,
    district: true,
    latitude: true,
    longitude: true,
    description: true,
    facilities: true,
    images: true,
    openingHours: true,
    phone: true,
    isActive: true,
  })
  .partial();

// Venue Slots
export const insertVenueSlotSchema = createCoercedInsertSchema(venueSlots).pick({
  venueId: true,
  date: true,
  startTime: true,
  endTime: true,
  price: true,
  isAvailable: true,
});

export const updateVenueSlotSchema = createCoercedInsertSchema(venueSlots)
  .pick({
    price: true,
    isAvailable: true,
  })
  .partial();

// Venue Bookings
export const insertVenueBookingSchema = createCoercedInsertSchema(venueBookings).pick({
  venueId: true,
  slotId: true,
  userId: true,
  bookingDate: true,
  notes: true,
});

export const updateVenueBookingSchema = createCoercedInsertSchema(venueBookings)
  .pick({
    status: true,
    paymentStatus: true,
    paymentAmount: true,
    transactionId: true,
    notes: true,
  })
  .partial();

// Community Posts
export const insertCommunityPostSchema = createCoercedInsertSchema(communityPosts).pick({
  userId: true,
  type: true,
  content: true,
  images: true,
  video: true,
  tags: true,
});

export const updateCommunityPostSchema = createCoercedInsertSchema(communityPosts)
  .pick({
    type: true,
    content: true,
    images: true,
    video: true,
    tags: true,
  })
  .partial();

// Community Comments
export const insertCommunityCommentSchema = createCoercedInsertSchema(communityComments).pick({
  postId: true,
  userId: true,
  parentId: true,
  content: true,
});

// Community Likes
export const insertCommunityLikeSchema = createCoercedInsertSchema(communityLikes).pick({
  postId: true,
  userId: true,
});

// Matchups
export const insertMatchupSchema = createCoercedInsertSchema(matchups).pick({
  creatorId: true,
  venueId: true,
  scheduledDate: true,
  startTime: true,
  endTime: true,
  skillLevel: true,
  maxPlayers: true,
  description: true,
  status: true,
});

export const updateMatchupSchema = createCoercedInsertSchema(matchups)
  .pick({
    venueId: true,
    scheduledDate: true,
    startTime: true,
    endTime: true,
    skillLevel: true,
    maxPlayers: true,
    description: true,
    status: true,
  })
  .partial();

// Matchup Participants
export const insertMatchupParticipantSchema = createCoercedInsertSchema(matchupParticipants).pick({
  matchupId: true,
  userId: true,
  status: true,
});

// Tournaments
export const insertTournamentSchema = createCoercedInsertSchema(tournaments).pick({
  name: true,
  description: true,
  type: true,
  category: true,
  venueId: true,
  startDate: true,
  endDate: true,
  registrationDeadline: true,
  maxParticipants: true,
  entryFee: true,
  prizePool: true,
  rules: true,
  status: true,
  poster: true,
});

export const updateTournamentSchema = createCoercedInsertSchema(tournaments)
  .pick({
    name: true,
    description: true,
    type: true,
    category: true,
    venueId: true,
    startDate: true,
    endDate: true,
    registrationDeadline: true,
    maxParticipants: true,
    currentParticipants: true,
    entryFee: true,
    prizePool: true,
    rules: true,
    status: true,
    poster: true,
  })
  .partial();

// Tournament Participants
export const insertTournamentParticipantSchema = createCoercedInsertSchema(tournamentParticipants).pick({
  tournamentId: true,
  userId: true,
  paymentAmount: true,
  transactionId: true,
});

export const updateTournamentParticipantSchema = createCoercedInsertSchema(tournamentParticipants)
  .pick({
    paymentStatus: true,
    transactionId: true,
  })
  .partial();

// VIP Memberships
export const insertVipMembershipSchema = createCoercedInsertSchema(vipMemberships).pick({
  name: true,
  description: true,
  price: true,
  duration: true,
  benefits: true,
  isActive: true,
});

export const updateVipMembershipSchema = createCoercedInsertSchema(vipMemberships)
  .pick({
    name: true,
    description: true,
    price: true,
    duration: true,
    benefits: true,
    isActive: true,
  })
  .partial();

// User VIP Subscriptions
export const insertUserVipSubscriptionSchema = createCoercedInsertSchema(userVipSubscriptions).pick({
  userId: true,
  membershipId: true,
  startDate: true,
  endDate: true,
  status: true,
  paymentAmount: true,
  paymentStatus: true,
  transactionId: true,
});

// AI Analysis Records
export const insertAiAnalysisRecordSchema = createCoercedInsertSchema(aiAnalysisRecords).pick({
  userId: true,
  coachId: true,
  videoUrl: true,
  videoThumbnail: true,
  analysisType: true,
  analysisResult: true,
  improvementSuggestions: true,
  score: true,
});

// Coach Certifications
export const insertCoachCertificationSchema = createCoercedInsertSchema(coachCertifications).pick({
  userId: true,
  type: true,
  fileKey: true,
  fileName: true,
  fileUrl: true,
  status: true,
  reviewedBy: true,
  reviewComment: true,
  rejectionReason: true,
});

export const updateCoachCertificationSchema = createCoercedInsertSchema(coachCertifications)
  .pick({
    status: true,
    reviewedBy: true,
    reviewedAt: true,
    reviewComment: true,
    rejectionReason: true,
  })
  .partial();

// Chat Rooms
export const insertChatRoomSchema = createCoercedInsertSchema(chatRooms).pick({
  courseId: true,
  bookingId: true,
  name: true,
  type: true,
  isActive: true,
});

export const updateChatRoomSchema = createCoercedInsertSchema(chatRooms)
  .pick({
    name: true,
    type: true,
    isActive: true,
  })
  .partial();

// Chat Messages
export const insertChatMessageSchema = createCoercedInsertSchema(chatMessages).pick({
  roomId: true,
  userId: true,
  messageType: true,
  content: true,
  isRead: true,
});

export const updateChatMessageSchema = createCoercedInsertSchema(chatMessages)
  .pick({
    messageType: true,
    content: true,
    isRead: true,
  })
  .partial();

// Notifications
export const insertNotificationSchema = createCoercedInsertSchema(notifications).pick({
  userId: true,
  type: true,
  title: true,
  message: true,
  status: true,
  relatedId: true,
  relatedType: true,
  actionUrl: true,
});

export const updateNotificationSchema = createCoercedInsertSchema(notifications)
  .pick({
    status: true,
    relatedId: true,
    relatedType: true,
    actionUrl: true,
  })
  .partial();

// Profit Sharing Rules
export const insertProfitSharingRuleSchema = createCoercedInsertSchema(profitSharingRules).pick({
  name: true,
  type: true,
  percentage: true,
  fixedAmount: true,
  minAmount: true,
  maxAmount: true,
  conditions: true,
  isActive: true,
});

export const updateProfitSharingRuleSchema = createCoercedInsertSchema(profitSharingRules)
  .pick({
    name: true,
    type: true,
    percentage: true,
    fixedAmount: true,
    minAmount: true,
    maxAmount: true,
    conditions: true,
    isActive: true,
  })
  .partial();

// Profit Sharing Recipients
export const insertProfitSharingRecipientSchema = createCoercedInsertSchema(profitSharingRecipients).pick({
  userId: true,
  coachId: true,
  name: true,
  type: true,
  accountType: true,
  accountInfo: true,
  isActive: true,
});

export const updateProfitSharingRecipientSchema = createCoercedInsertSchema(profitSharingRecipients)
  .pick({
    userId: true,
    coachId: true,
    name: true,
    type: true,
    accountType: true,
    accountInfo: true,
    isActive: true,
  })
  .partial();

// Profit Sharing Records
export const insertProfitSharingRecordSchema = createCoercedInsertSchema(profitSharingRecords).pick({
  bookingId: true,
  venueBookingId: true,
  tournamentParticipantId: true,
  transactionId: true,
  amount: true,
  recipientId: true,
  ruleId: true,
  status: true,
  type: true,
  notes: true,
});

export const updateProfitSharingRecordSchema = createCoercedInsertSchema(profitSharingRecords)
  .pick({
    status: true,
    notes: true,
  })
  .partial();

// Settlement Records
export const insertSettlementRecordSchema = createCoercedInsertSchema(settlementRecords).pick({
  recipientId: true,
  amount: true,
  status: true,
  settlementDate: true,
  paymentMethod: true,
  transactionId: true,
  notes: true,
});

export const updateSettlementRecordSchema = createCoercedInsertSchema(settlementRecords)
  .pick({
    status: true,
    settlementDate: true,
    paymentMethod: true,
    transactionId: true,
    notes: true,
  })
  .partial();

// Settlement Profit Sharing Links
export const insertSettlementProfitSharingLinkSchema = createCoercedInsertSchema(settlementProfitSharingLinks).pick({
  settlementId: true,
  profitSharingRecordId: true,
});

// Payment Orders
export const insertPaymentOrderSchema = createCoercedInsertSchema(paymentOrders).pick({
  userId: true,
  orderNo: true,
  type: true,
  amount: true,
  status: true,
  paymentMethod: true,
  transactionId: true,
  buyerId: true,
  buyerAccount: true,
  paidAmount: true,
  paidAt: true,
  refundAmount: true,
  refundedAt: true,
  refundReason: true,
  metadata: true,
  expiresAt: true,
});

export const updatePaymentOrderSchema = createCoercedInsertSchema(paymentOrders)
  .pick({
    status: true,
    paymentMethod: true,
    transactionId: true,
    buyerId: true,
    buyerAccount: true,
    paidAmount: true,
    paidAt: true,
    refundAmount: true,
    refundedAt: true,
    refundReason: true,
    metadata: true,
    expiresAt: true,
  })
  .partial();

// ==================== TypeScript Types ====================

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

export type VerificationCode = typeof verificationCodes.$inferSelect;
export type InsertVerificationCode = z.infer<typeof insertVerificationCodeSchema>;
export type UpdateVerificationCode = z.infer<typeof updateVerificationCodeSchema>;

export type UserModificationLog = typeof userModificationLogs.$inferSelect;
export type InsertUserModificationLog = z.infer<typeof insertUserModificationLogSchema>;

export type Coach = typeof coaches.$inferSelect;
export type InsertCoach = z.infer<typeof insertCoachSchema>;
export type UpdateCoach = z.infer<typeof updateCoachSchema>;

export type CoachReview = typeof coachReviews.$inferSelect;
export type InsertCoachReview = z.infer<typeof insertCoachReviewSchema>;

export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type UpdateCourse = z.infer<typeof updateCourseSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type UpdateBooking = z.infer<typeof updateBookingSchema>;

export type Venue = typeof venues.$inferSelect;
export type InsertVenue = z.infer<typeof insertVenueSchema>;
export type UpdateVenue = z.infer<typeof updateVenueSchema>;

export type VenueSlot = typeof venueSlots.$inferSelect;
export type InsertVenueSlot = z.infer<typeof insertVenueSlotSchema>;
export type UpdateVenueSlot = z.infer<typeof updateVenueSlotSchema>;

export type VenueBooking = typeof venueBookings.$inferSelect;
export type InsertVenueBooking = z.infer<typeof insertVenueBookingSchema>;
export type UpdateVenueBooking = z.infer<typeof updateVenueBookingSchema>;

export type CommunityPost = typeof communityPosts.$inferSelect;
export type InsertCommunityPost = z.infer<typeof insertCommunityPostSchema>;
export type UpdateCommunityPost = z.infer<typeof updateCommunityPostSchema>;

export type CommunityComment = typeof communityComments.$inferSelect;
export type InsertCommunityComment = z.infer<typeof insertCommunityCommentSchema>;

export type CommunityLike = typeof communityLikes.$inferSelect;
export type InsertCommunityLike = z.infer<typeof insertCommunityLikeSchema>;

export type Matchup = typeof matchups.$inferSelect;
export type InsertMatchup = z.infer<typeof insertMatchupSchema>;
export type UpdateMatchup = z.infer<typeof updateMatchupSchema>;

export type MatchupParticipant = typeof matchupParticipants.$inferSelect;
export type InsertMatchupParticipant = z.infer<typeof insertMatchupParticipantSchema>;

export type Tournament = typeof tournaments.$inferSelect;
export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type UpdateTournament = z.infer<typeof updateTournamentSchema>;

export type TournamentParticipant = typeof tournamentParticipants.$inferSelect;
export type InsertTournamentParticipant = z.infer<typeof insertTournamentParticipantSchema>;
export type UpdateTournamentParticipant = z.infer<typeof updateTournamentParticipantSchema>;

export type VipMembership = typeof vipMemberships.$inferSelect;
export type InsertVipMembership = z.infer<typeof insertVipMembershipSchema>;
export type UpdateVipMembership = z.infer<typeof updateVipMembershipSchema>;

export type UserVipSubscription = typeof userVipSubscriptions.$inferSelect;
export type InsertUserVipSubscription = z.infer<typeof insertUserVipSubscriptionSchema>;

export type AiAnalysisRecord = typeof aiAnalysisRecords.$inferSelect;
export type InsertAiAnalysisRecord = z.infer<typeof insertAiAnalysisRecordSchema>;

// Coach Certifications
export type CoachCertification = typeof coachCertifications.$inferSelect;
export type InsertCoachCertification = z.infer<typeof insertCoachCertificationSchema>;
export type UpdateCoachCertification = z.infer<typeof updateCoachCertificationSchema>;

// Chat Rooms
export type ChatRoom = typeof chatRooms.$inferSelect;
export type InsertChatRoom = z.infer<typeof insertChatRoomSchema>;
export type UpdateChatRoom = z.infer<typeof updateChatRoomSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type UpdateChatMessage = z.infer<typeof updateChatMessageSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type UpdateNotification = z.infer<typeof updateNotificationSchema>;

// Profit Sharing Rules
export type ProfitSharingRule = typeof profitSharingRules.$inferSelect;
export type InsertProfitSharingRule = z.infer<typeof insertProfitSharingRuleSchema>;
export type UpdateProfitSharingRule = z.infer<typeof updateProfitSharingRuleSchema>;

// Profit Sharing Recipients
export type ProfitSharingRecipient = typeof profitSharingRecipients.$inferSelect;
export type InsertProfitSharingRecipient = z.infer<typeof insertProfitSharingRecipientSchema>;
export type UpdateProfitSharingRecipient = z.infer<typeof updateProfitSharingRecipientSchema>;

// Profit Sharing Records
export type ProfitSharingRecord = typeof profitSharingRecords.$inferSelect;
export type InsertProfitSharingRecord = z.infer<typeof insertProfitSharingRecordSchema>;
export type UpdateProfitSharingRecord = z.infer<typeof updateProfitSharingRecordSchema>;

// Settlement Records
export type SettlementRecord = typeof settlementRecords.$inferSelect;
export type InsertSettlementRecord = z.infer<typeof insertSettlementRecordSchema>;
export type UpdateSettlementRecord = z.infer<typeof updateSettlementRecordSchema>;

// Settlement Profit Sharing Links
export type SettlementProfitSharingLink = typeof settlementProfitSharingLinks.$inferSelect;
export type InsertSettlementProfitSharingLink = z.infer<typeof insertSettlementProfitSharingLinkSchema>;

// Payment Orders
export type PaymentOrder = typeof paymentOrders.$inferSelect;
export type InsertPaymentOrder = z.infer<typeof insertPaymentOrderSchema>;
export type UpdatePaymentOrder = z.infer<typeof updatePaymentOrderSchema>;

// ==================== 系统设置表 ====================

// 系统设置表
export const systemSettings = pgTable(
  "system_settings",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    category: varchar("category", { length: 50 }).notNull(), // 设置分类：basic, payment, notification, security
    key: varchar("key", { length: 100 }).notNull(), // 设置键名
    value: jsonb("value").notNull(), // 设置值（JSON格式）
    description: text("description"), // 设置描述
    isEditable: boolean("is_editable").default(true).notNull(), // 是否可编辑
    updatedBy: varchar("updated_by", { length: 36 }).references(() => users.id, { onDelete: "set null" }), // 最后更新者
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    categoryIdx: index("system_settings_category_idx").on(table.category),
    keyIdx: index("system_settings_key_idx").on(table.key),
    uniqueCategoryKey: index("system_settings_category_key_idx").on(table.category, table.key),
    // 注意：Drizzle ORM 的 unique 约束通过 .unique() 在列定义中添加
  })
);

// System Settings Schemas
export const insertSystemSettingSchema = createCoercedInsertSchema(systemSettings).pick({
  category: true,
  key: true,
  value: true,
  description: true,
  isEditable: true,
  updatedBy: true,
});

export const updateSystemSettingSchema = createCoercedInsertSchema(systemSettings)
  .pick({
    value: true,
    description: true,
    isEditable: true,
    updatedBy: true,
  })
  .partial();

// System Settings Types
export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type UpdateSystemSetting = z.infer<typeof updateSystemSettingSchema>;

// ==================== 场地预约系统 (Court Booking) ====================

// 场地预约状态枚举
const courtBookingStatusEnum = pgEnum("court_booking_status", [
  "pending_payment",
  "pending",
  "confirmed",
  "cancelled",
  "completed"
]);

// 场地表
export const courts = pgTable(
  "courts",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    clubId: varchar("club_id", { length: 36 }).notNull(),
    courtNumber: varchar("court_number", { length: 50 }).notNull(),
    name: varchar("name", { length: 255 }),
    courtType: varchar("court_type", { length: 20 }).notNull().default("indoor"),
    surfaceType: varchar("surface_type", { length: 20 }).notNull().default("hard"),
    description: text("description"),
    images: jsonb("images"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    clubIdx: index("courts_club_idx").on(table.clubId),
    courtNumberIdx: index("courts_court_number_idx").on(table.courtNumber),
  })
);

// 场地预约表
export const courtBookings = pgTable(
  "court_bookings",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    bookingNo: varchar("booking_no", { length: 64 }).notNull().unique(),
    userId: varchar("user_id", { length: 36 }).notNull(),
    courtId: varchar("court_id", { length: 36 }).notNull(),
    bookingDate: date("booking_date").notNull(),
    startTime: varchar("start_time", { length: 5 }).notNull(),
    endTime: varchar("end_time", { length: 5 }).notNull(),
    totalHours: numeric("total_hours", { precision: 4, scale: 2 }).notNull(),
    totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
    status: courtBookingStatusEnum("status").notNull().default("pending_payment"),
    paymentStatus: varchar("payment_status", { length: 20 }).notNull().default("pending"),
    cancelReason: text("cancel_reason"),
    cancelledBy: varchar("cancelled_by", { length: 36 }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    notes: text("notes"),
    notificationSent: boolean("notification_sent").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    paymentOrderId: varchar("payment_order_id", { length: 36 }),
  },
  (table) => ({
    userIdx: index("court_bookings_user_idx").on(table.userId),
    courtIdx: index("court_bookings_court_idx").on(table.courtId),
    bookingDateIdx: index("court_bookings_booking_date_idx").on(table.bookingDate),
    statusIdx: index("court_bookings_status_idx").on(table.status),
  })
);

// Court Schemas
export const insertCourtSchema = createCoercedInsertSchema(courts).pick({
  clubId: true,
  courtNumber: true,
  name: true,
  courtType: true,
  surfaceType: true,
  description: true,
  images: true,
  isActive: true,
});

export const updateCourtSchema = createCoercedInsertSchema(courts)
  .pick({
    courtNumber: true,
    name: true,
    courtType: true,
    surfaceType: true,
    description: true,
    images: true,
    isActive: true,
  })
  .partial();

// Court Booking Schemas
export const insertCourtBookingSchema = createCoercedInsertSchema(courtBookings).pick({
  bookingNo: true,
  userId: true,
  courtId: true,
  bookingDate: true,
  startTime: true,
  endTime: true,
  totalHours: true,
  totalAmount: true,
  notes: true,
  paymentOrderId: true,
});

export const updateCourtBookingSchema = createCoercedInsertSchema(courtBookings)
  .pick({
    status: true,
    paymentStatus: true,
    cancelReason: true,
    cancelledBy: true,
    notes: true,
    notificationSent: true,
  })
  .partial();

// Types
export type Court = typeof courts.$inferSelect;
export type InsertCourt = z.infer<typeof insertCourtSchema>;
export type UpdateCourt = z.infer<typeof updateCourtSchema>;

// ==================== 俱乐部相关表 ====================

// 俱乐部表
export const clubs = pgTable(
  "clubs",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    address: text("address").notNull(),
    city: varchar("city", { length: 100 }).notNull(),
    district: varchar("district", { length: 100 }),
    latitude: numeric("latitude", { precision: 10, scale: 8 }),
    longitude: numeric("longitude", { precision: 11, scale: 8 }),
    phone: varchar("phone", { length: 20 }),
    managerId: varchar("manager_id", { length: 36 }),
    images: jsonb("images"),
    facilities: jsonb("facilities"),
    openingHours: jsonb("opening_hours"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    nameIdx: index("clubs_name_idx").on(table.name),
    cityIdx: index("clubs_city_idx").on(table.city),
    managerIdIdx: index("clubs_manager_id_idx").on(table.managerId),
  })
);

// Club Schemas
export const insertClubSchema = createCoercedInsertSchema(clubs).pick({
  name: true,
  description: true,
  address: true,
  city: true,
  district: true,
  latitude: true,
  longitude: true,
  phone: true,
  managerId: true,
  images: true,
  facilities: true,
  openingHours: true,
  isActive: true,
});

export const updateClubSchema = createCoercedInsertSchema(clubs)
  .pick({
    name: true,
    description: true,
    address: true,
    city: true,
    district: true,
    latitude: true,
    longitude: true,
    phone: true,
    managerId: true,
    images: true,
    facilities: true,
    openingHours: true,
    isActive: true,
  })
  .partial();

// Club Types
export type Club = typeof clubs.$inferSelect;
export type InsertClub = z.infer<typeof insertClubSchema>;
export type UpdateClub = z.infer<typeof updateClubSchema>;

// 场地定价表
const timeSlotEnum = pgEnum("time_slot", ["morning", "afternoon", "evening", "night", "all_day"]);

export const courtPricing = pgTable(
  "court_pricing",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    courtId: varchar("court_id", { length: 36 }).notNull(),
    timeSlot: timeSlotEnum("time_slot").notNull(),
    startTime: varchar("start_time", { length: 5 }).notNull(),
    endTime: varchar("end_time", { length: 5 }).notNull(),
    singlesPrice: numeric("singles_price", { precision: 10, scale: 2 }).notNull(),
    doublesPrice: numeric("doubles_price", { precision: 10, scale: 2 }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    effectiveDate: date("effective_date").defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    courtIdx: index("court_pricing_court_idx").on(table.courtId),
    timeSlotIdx: index("court_pricing_time_slot_idx").on(table.timeSlot),
  })
);

// Court Pricing Schemas
export const insertCourtPricingSchema = createCoercedInsertSchema(courtPricing).pick({
  courtId: true,
  timeSlot: true,
  startTime: true,
  endTime: true,
  singlesPrice: true,
  doublesPrice: true,
  isActive: true,
  effectiveDate: true,
});

export const updateCourtPricingSchema = createCoercedInsertSchema(courtPricing)
  .pick({
    timeSlot: true,
    startTime: true,
    endTime: true,
    singlesPrice: true,
    doublesPrice: true,
    isActive: true,
    effectiveDate: true,
  })
  .partial();

// Court Pricing Types
export type CourtPricing = typeof courtPricing.$inferSelect;
export type InsertCourtPricing = z.infer<typeof insertCourtPricingSchema>;
export type UpdateCourtPricing = z.infer<typeof updateCourtPricingSchema>;

// 场地封锁表
export const courtBlocks = pgTable(
  "court_blocks",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    courtId: varchar("court_id", { length: 36 }).notNull(),
    blockDate: date("block_date").notNull(),
    startTime: varchar("start_time", { length: 5 }).notNull(),
    endTime: varchar("end_time", { length: 5 }).notNull(),
    reason: text("reason").notNull(),
    blockedBy: varchar("blocked_by", { length: 36 }).notNull(),
    isRecurring: boolean("is_recurring").default(false).notNull(),
    recurrenceRule: jsonb("recurrence_rule"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    courtIdx: index("court_blocks_court_idx").on(table.courtId),
    blockDateIdx: index("court_blocks_block_date_idx").on(table.blockDate),
  })
);

// Court Block Schemas
export const insertCourtBlockSchema = createCoercedInsertSchema(courtBlocks).pick({
  courtId: true,
  blockDate: true,
  startTime: true,
  endTime: true,
  reason: true,
  blockedBy: true,
  isRecurring: true,
  recurrenceRule: true,
  isActive: true,
});

export const updateCourtBlockSchema = createCoercedInsertSchema(courtBlocks)
  .pick({
    reason: true,
    isRecurring: true,
    recurrenceRule: true,
    isActive: true,
  })
  .partial();

// Court Block Types
export type CourtBlock = typeof courtBlocks.$inferSelect;
export type InsertCourtBlock = z.infer<typeof insertCourtBlockSchema>;
export type UpdateCourtBlock = z.infer<typeof updateCourtBlockSchema>;

export type CourtBooking = typeof courtBookings.$inferSelect;
export type InsertCourtBooking = z.infer<typeof insertCourtBookingSchema>;
export type UpdateCourtBooking = z.infer<typeof updateCourtBookingSchema>;

// ==================== 钱包相关表 ====================

// 钱包表
export const wallets = pgTable(
  "wallets",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 }).notNull(),
    balance: numeric("balance", { precision: 12, scale: 2 }).default("0").notNull(),
    frozenAmount: numeric("frozen_amount", { precision: 12, scale: 2 }).default("0").notNull(),
    totalRecharged: numeric("total_recharged", { precision: 14, scale: 2 }).default("0").notNull(),
    totalSpent: numeric("total_spent", { precision: 14, scale: 2 }).default("0").notNull(),
    status: varchar("status", { length: 20 }).default("active").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    userIdx: index("wallets_user_idx").on(table.userId).unique(),
  })
);

// Wallet Schemas
export const insertWalletSchema = createCoercedInsertSchema(wallets).pick({
  userId: true,
  balance: true,
  status: true,
});

export const updateWalletSchema = createCoercedInsertSchema(wallets)
  .pick({
    balance: true,
    frozenAmount: true,
    totalRecharged: true,
    totalSpent: true,
    status: true,
  })
  .partial();

// Wallet Types
export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type UpdateWallet = z.infer<typeof updateWalletSchema>;

// 钱包交易记录表
export const walletTransactions = pgTable(
  "wallet_transactions",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 }).notNull(),
    walletId: varchar("wallet_id", { length: 36 }).notNull(),
    transactionNo: varchar("transaction_no", { length: 64 }),
    type: varchar("type", { length: 20 }).notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    balanceBefore: numeric("balance_before", { precision: 12, scale: 2 }).notNull(),
    balanceAfter: numeric("balance_after", { precision: 12, scale: 2 }).notNull(),
    description: text("description"),
    relatedOrderId: varchar("related_order_id", { length: 36 }),
    relatedOrderType: varchar("related_order_type", { length: 20 }),
    status: varchar("status", { length: 20 }).default("completed").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("wallet_transactions_user_idx").on(table.userId),
    walletIdx: index("wallet_transactions_wallet_idx").on(table.walletId),
    transactionNoIdx: index("wallet_transactions_transaction_no_idx").on(table.transactionNo),
    typeIdx: index("wallet_transactions_type_idx").on(table.type),
    createdAtIdx: index("wallet_transactions_created_at_idx").on(table.createdAt),
  })
);

// Wallet Transaction Schemas
export const insertWalletTransactionSchema = createCoercedInsertSchema(walletTransactions).pick({
  userId: true,
  walletId: true,
  transactionNo: true,
  type: true,
  amount: true,
  balanceBefore: true,
  balanceAfter: true,
  description: true,
  relatedOrderId: true,
  relatedOrderType: true,
  status: true,
  metadata: true,
});

export const updateWalletTransactionSchema = createCoercedInsertSchema(walletTransactions)
  .pick({
    status: true,
    description: true,
  })
  .partial();

// Wallet Transaction Types
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
export type UpdateWalletTransaction = z.infer<typeof updateWalletTransactionSchema>;
