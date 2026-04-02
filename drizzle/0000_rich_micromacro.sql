CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'cancelled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."certification_status" AS ENUM('pending_review', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."certification_type" AS ENUM('professional', 'safety', 'coach', 'experience');--> statement-breakpoint
CREATE TYPE "public"."coach_status" AS ENUM('pending', 'approved', 'rejected', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."course_type" AS ENUM('one_on_one', 'small_group', 'large_group', 'kids', 'adults', 'beginner', 'advanced', 'competition', 'fitness', 'technique');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TYPE "public"."learning_goal" AS ENUM('fat_loss', 'entertainment', 'skill_improvement', 'competition');--> statement-breakpoint
CREATE TYPE "public"."modification_type" AS ENUM('username', 'email', 'phone', 'avatar');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('unread', 'read', 'archived');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('system', 'booking', 'coach_review', 'matchup', 'tournament', 'payment', 'vip');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."post_type" AS ENUM('text', 'image', 'video');--> statement-breakpoint
CREATE TYPE "public"."profit_sharing_status" AS ENUM('pending', 'completed', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."profit_sharing_type" AS ENUM('course', 'venue', 'tournament', 'other');--> statement-breakpoint
CREATE TYPE "public"."settlement_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."tournament_status" AS ENUM('upcoming', 'ongoing', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('student', 'coach', 'admin');--> statement-breakpoint
CREATE TYPE "public"."venue_type" AS ENUM('outdoor', 'indoor', 'mixed');--> statement-breakpoint
CREATE TYPE "public"."verification_type" AS ENUM('register', 'login', 'bind_phone', 'bind_email', 'reset_password');--> statement-breakpoint
CREATE TYPE "public"."vip_status" AS ENUM('active', 'expired', 'cancelled');--> statement-breakpoint
CREATE TABLE "ai_analysis_records" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"coach_id" varchar(36),
	"video_url" text NOT NULL,
	"video_thumbnail" text,
	"analysis_type" varchar(50) NOT NULL,
	"analysis_result" jsonb,
	"improvement_suggestions" text,
	"score" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" varchar(36) NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"coach_id" varchar(36) NOT NULL,
	"scheduled_date" timestamp with time zone NOT NULL,
	"duration" integer NOT NULL,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"payment_amount" numeric(10, 2),
	"transaction_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" varchar(36) NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"message_type" varchar(50) DEFAULT 'text' NOT NULL,
	"content" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_rooms" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" varchar(36) NOT NULL,
	"booking_id" varchar(36),
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "coach_certifications" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"type" "certification_type" NOT NULL,
	"file_key" text NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_url" text,
	"status" "certification_status" DEFAULT 'pending_review' NOT NULL,
	"reviewed_by" varchar(36),
	"reviewed_at" timestamp with time zone,
	"review_comment" text,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "coach_reviews" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" varchar(36) NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coaches" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"status" "coach_status" DEFAULT 'pending' NOT NULL,
	"experience_years" integer DEFAULT 0,
	"certifications" jsonb,
	"specialties" jsonb,
	"teaching_style" text,
	"teaching_areas" jsonb,
	"hourly_rate" numeric(10, 2),
	"total_lessons" integer DEFAULT 0,
	"average_rating" numeric(3, 2) DEFAULT '0.00',
	"review_count" integer DEFAULT 0,
	"available_days" jsonb,
	"available_time_slots" jsonb,
	"bank_info" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "community_comments" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar(36) NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"parent_id" varchar(36),
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_likes" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar(36) NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_posts" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"type" "post_type" DEFAULT 'text' NOT NULL,
	"content" text NOT NULL,
	"images" jsonb,
	"video" text,
	"tags" jsonb,
	"like_count" integer DEFAULT 0,
	"comment_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" varchar(36) NOT NULL,
	"type" "course_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"duration" integer NOT NULL,
	"max_students" integer DEFAULT 1,
	"price" numeric(10, 2) NOT NULL,
	"level" integer DEFAULT 1,
	"tags" jsonb,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "matchup_participants" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"matchup_id" varchar(36) NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"status" "booking_status" DEFAULT 'confirmed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matchups" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" varchar(36) NOT NULL,
	"venue_id" varchar(36),
	"scheduled_date" timestamp with time zone NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"skill_level" integer,
	"max_players" integer NOT NULL,
	"current_players" integer DEFAULT 1,
	"description" text,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"status" "notification_status" DEFAULT 'unread' NOT NULL,
	"related_id" varchar(36),
	"related_type" varchar(50),
	"action_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "payment_orders" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"order_no" varchar(64) NOT NULL,
	"type" varchar(50) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"payment_method" varchar(50),
	"transaction_id" varchar(255),
	"buyer_id" varchar(255),
	"buyer_account" varchar(255),
	"paid_amount" numeric(10, 2),
	"paid_at" timestamp with time zone,
	"refund_amount" numeric(10, 2),
	"refunded_at" timestamp with time zone,
	"refund_reason" text,
	"metadata" jsonb,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "payment_orders_order_no_unique" UNIQUE("order_no")
);
--> statement-breakpoint
CREATE TABLE "profit_sharing_recipients" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"coach_id" varchar(36),
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"account_type" varchar(50) NOT NULL,
	"account_info" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "profit_sharing_records" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" varchar(36),
	"venue_booking_id" varchar(36),
	"tournament_participant_id" varchar(36),
	"transaction_id" varchar(255) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"recipient_id" varchar(36) NOT NULL,
	"rule_id" varchar(36),
	"status" "profit_sharing_status" DEFAULT 'pending' NOT NULL,
	"type" "profit_sharing_type" NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "profit_sharing_rules" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "profit_sharing_type" NOT NULL,
	"percentage" numeric(5, 2) NOT NULL,
	"fixed_amount" numeric(10, 2),
	"min_amount" numeric(10, 2),
	"max_amount" numeric(10, 2),
	"conditions" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "settlement_profit_sharing_links" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"settlement_id" varchar(36) NOT NULL,
	"profit_sharing_record_id" varchar(36) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settlement_records" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_id" varchar(36) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" "settlement_status" DEFAULT 'pending' NOT NULL,
	"settlement_date" timestamp with time zone,
	"payment_method" varchar(50),
	"transaction_id" varchar(255),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tournament_participants" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" varchar(36) NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"registration_date" timestamp with time zone DEFAULT now() NOT NULL,
	"payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"payment_amount" numeric(10, 2),
	"transaction_id" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "tournaments" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(50) NOT NULL,
	"category" varchar(50),
	"venue_id" varchar(36),
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"registration_deadline" timestamp with time zone NOT NULL,
	"max_players" integer NOT NULL,
	"current_players" integer DEFAULT 0,
	"entry_fee" numeric(10, 2),
	"prize_pool" numeric(10, 2),
	"rules" text,
	"status" "tournament_status" DEFAULT 'upcoming' NOT NULL,
	"poster" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_modification_logs" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"type" "modification_type" NOT NULL,
	"old_value" text,
	"new_value" text,
	"month" varchar(7) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_vip_subscriptions" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"membership_id" varchar(36) NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"status" "vip_status" DEFAULT 'active' NOT NULL,
	"payment_amount" numeric(10, 2),
	"payment_status" "payment_status" DEFAULT 'paid' NOT NULL,
	"transaction_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(50),
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"password" text,
	"name" varchar(128) NOT NULL,
	"avatar" text,
	"role" "user_role" DEFAULT 'student' NOT NULL,
	"gender" "gender",
	"birth_date" timestamp with time zone,
	"city" varchar(100),
	"district" varchar(100),
	"skill_level" integer DEFAULT 1,
	"learning_goal" "learning_goal",
	"bio" text,
	"wechat_openid" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone"),
	CONSTRAINT "users_wechat_openid_unique" UNIQUE("wechat_openid")
);
--> statement-breakpoint
CREATE TABLE "venue_bookings" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" varchar(36) NOT NULL,
	"slot_id" varchar(36) NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"booking_date" timestamp with time zone NOT NULL,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"payment_amount" numeric(10, 2),
	"transaction_id" varchar(255),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "venue_slots" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" varchar(36) NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "venue_type" NOT NULL,
	"address" text NOT NULL,
	"city" varchar(100) NOT NULL,
	"district" varchar(100) NOT NULL,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"description" text,
	"facilities" jsonb,
	"images" jsonb,
	"opening_hours" jsonb,
	"phone" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "verification_codes" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"target" varchar(255) NOT NULL,
	"type" "verification_type" NOT NULL,
	"code" varchar(6) NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vip_memberships" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"duration" integer NOT NULL,
	"benefits" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "ai_analysis_records" ADD CONSTRAINT "ai_analysis_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_analysis_records" ADD CONSTRAINT "ai_analysis_records_coach_id_coaches_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_coach_id_coaches_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_room_id_chat_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."chat_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_certifications" ADD CONSTRAINT "coach_certifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_certifications" ADD CONSTRAINT "coach_certifications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_reviews" ADD CONSTRAINT "coach_reviews_coach_id_coaches_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_reviews" ADD CONSTRAINT "coach_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coaches" ADD CONSTRAINT "coaches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_parent_id_community_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."community_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_likes" ADD CONSTRAINT "community_likes_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_likes" ADD CONSTRAINT "community_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_coach_id_coaches_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matchup_participants" ADD CONSTRAINT "matchup_participants_matchup_id_matchups_id_fk" FOREIGN KEY ("matchup_id") REFERENCES "public"."matchups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matchup_participants" ADD CONSTRAINT "matchup_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matchups" ADD CONSTRAINT "matchups_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matchups" ADD CONSTRAINT "matchups_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profit_sharing_recipients" ADD CONSTRAINT "profit_sharing_recipients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profit_sharing_recipients" ADD CONSTRAINT "profit_sharing_recipients_coach_id_coaches_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profit_sharing_records" ADD CONSTRAINT "profit_sharing_records_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profit_sharing_records" ADD CONSTRAINT "profit_sharing_records_venue_booking_id_venue_bookings_id_fk" FOREIGN KEY ("venue_booking_id") REFERENCES "public"."venue_bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profit_sharing_records" ADD CONSTRAINT "profit_sharing_records_tournament_participant_id_tournament_participants_id_fk" FOREIGN KEY ("tournament_participant_id") REFERENCES "public"."tournament_participants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profit_sharing_records" ADD CONSTRAINT "profit_sharing_records_recipient_id_profit_sharing_recipients_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."profit_sharing_recipients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profit_sharing_records" ADD CONSTRAINT "profit_sharing_records_rule_id_profit_sharing_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."profit_sharing_rules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement_profit_sharing_links" ADD CONSTRAINT "settlement_profit_sharing_links_settlement_id_settlement_records_id_fk" FOREIGN KEY ("settlement_id") REFERENCES "public"."settlement_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement_profit_sharing_links" ADD CONSTRAINT "settlement_profit_sharing_links_profit_sharing_record_id_profit_sharing_records_id_fk" FOREIGN KEY ("profit_sharing_record_id") REFERENCES "public"."profit_sharing_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement_records" ADD CONSTRAINT "settlement_records_recipient_id_profit_sharing_recipients_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."profit_sharing_recipients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_participants" ADD CONSTRAINT "tournament_participants_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_participants" ADD CONSTRAINT "tournament_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_modification_logs" ADD CONSTRAINT "user_modification_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_vip_subscriptions" ADD CONSTRAINT "user_vip_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_vip_subscriptions" ADD CONSTRAINT "user_vip_subscriptions_membership_id_vip_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."vip_memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_bookings" ADD CONSTRAINT "venue_bookings_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_bookings" ADD CONSTRAINT "venue_bookings_slot_id_venue_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."venue_slots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_bookings" ADD CONSTRAINT "venue_bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_slots" ADD CONSTRAINT "venue_slots_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_analysis_records_user_id_idx" ON "ai_analysis_records" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_analysis_records_coach_id_idx" ON "ai_analysis_records" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "ai_analysis_records_created_at_idx" ON "ai_analysis_records" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "bookings_course_id_idx" ON "bookings" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "bookings_user_id_idx" ON "bookings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bookings_coach_id_idx" ON "bookings" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "bookings_scheduled_date_idx" ON "bookings" USING btree ("scheduled_date");--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "chat_messages_room_id_idx" ON "chat_messages" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "chat_messages_user_id_idx" ON "chat_messages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "chat_messages_created_at_idx" ON "chat_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "chat_rooms_course_id_idx" ON "chat_rooms" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "chat_rooms_booking_id_idx" ON "chat_rooms" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "chat_rooms_type_idx" ON "chat_rooms" USING btree ("type");--> statement-breakpoint
CREATE INDEX "coach_certifications_user_id_idx" ON "coach_certifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "coach_certifications_type_idx" ON "coach_certifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "coach_certifications_status_idx" ON "coach_certifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "coach_certifications_reviewed_by_idx" ON "coach_certifications" USING btree ("reviewed_by");--> statement-breakpoint
CREATE INDEX "coach_reviews_coach_id_idx" ON "coach_reviews" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "coach_reviews_user_id_idx" ON "coach_reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "coaches_user_id_idx" ON "coaches" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "coaches_status_idx" ON "coaches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "community_comments_post_id_idx" ON "community_comments" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "community_comments_user_id_idx" ON "community_comments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "community_comments_parent_id_idx" ON "community_comments" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "community_likes_post_id_idx" ON "community_likes" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "community_likes_user_id_idx" ON "community_likes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "community_likes_unique_idx" ON "community_likes" USING btree ("post_id","user_id");--> statement-breakpoint
CREATE INDEX "community_posts_user_id_idx" ON "community_posts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "community_posts_created_at_idx" ON "community_posts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "courses_coach_id_idx" ON "courses" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "courses_type_idx" ON "courses" USING btree ("type");--> statement-breakpoint
CREATE INDEX "matchup_participants_matchup_id_idx" ON "matchup_participants" USING btree ("matchup_id");--> statement-breakpoint
CREATE INDEX "matchup_participants_user_id_idx" ON "matchup_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "matchup_participants_unique_idx" ON "matchup_participants" USING btree ("matchup_id","user_id");--> statement-breakpoint
CREATE INDEX "matchups_creator_id_idx" ON "matchups" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "matchups_venue_id_idx" ON "matchups" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "matchups_scheduled_date_idx" ON "matchups" USING btree ("scheduled_date");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_type_idx" ON "notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "notifications_status_idx" ON "notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notifications_user_id_status_idx" ON "notifications" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "payment_orders_user_id_idx" ON "payment_orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payment_orders_order_no_idx" ON "payment_orders" USING btree ("order_no");--> statement-breakpoint
CREATE INDEX "payment_orders_type_idx" ON "payment_orders" USING btree ("type");--> statement-breakpoint
CREATE INDEX "payment_orders_status_idx" ON "payment_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payment_orders_transaction_id_idx" ON "payment_orders" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "payment_orders_created_at_idx" ON "payment_orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "profit_sharing_recipients_user_id_idx" ON "profit_sharing_recipients" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "profit_sharing_recipients_coach_id_idx" ON "profit_sharing_recipients" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "profit_sharing_recipients_type_idx" ON "profit_sharing_recipients" USING btree ("type");--> statement-breakpoint
CREATE INDEX "profit_sharing_recipients_is_active_idx" ON "profit_sharing_recipients" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "profit_sharing_records_recipient_id_idx" ON "profit_sharing_records" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "profit_sharing_records_status_idx" ON "profit_sharing_records" USING btree ("status");--> statement-breakpoint
CREATE INDEX "profit_sharing_records_type_idx" ON "profit_sharing_records" USING btree ("type");--> statement-breakpoint
CREATE INDEX "profit_sharing_records_transaction_id_idx" ON "profit_sharing_records" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "profit_sharing_rules_type_idx" ON "profit_sharing_rules" USING btree ("type");--> statement-breakpoint
CREATE INDEX "profit_sharing_rules_is_active_idx" ON "profit_sharing_rules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "settlement_profit_sharing_links_settlement_id_idx" ON "settlement_profit_sharing_links" USING btree ("settlement_id");--> statement-breakpoint
CREATE INDEX "settlement_profit_sharing_links_profit_sharing_record_id_idx" ON "settlement_profit_sharing_links" USING btree ("profit_sharing_record_id");--> statement-breakpoint
CREATE INDEX "settlement_records_recipient_id_idx" ON "settlement_records" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "settlement_records_status_idx" ON "settlement_records" USING btree ("status");--> statement-breakpoint
CREATE INDEX "settlement_records_settlement_date_idx" ON "settlement_records" USING btree ("settlement_date");--> statement-breakpoint
CREATE INDEX "tournament_participants_tournament_id_idx" ON "tournament_participants" USING btree ("tournament_id");--> statement-breakpoint
CREATE INDEX "tournament_participants_user_id_idx" ON "tournament_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tournament_participants_unique_idx" ON "tournament_participants" USING btree ("tournament_id","user_id");--> statement-breakpoint
CREATE INDEX "tournaments_venue_id_idx" ON "tournaments" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "tournaments_start_date_idx" ON "tournaments" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "tournaments_status_idx" ON "tournaments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "user_modification_logs_user_id_idx" ON "user_modification_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_modification_logs_type_idx" ON "user_modification_logs" USING btree ("type");--> statement-breakpoint
CREATE INDEX "user_modification_logs_month_idx" ON "user_modification_logs" USING btree ("month");--> statement-breakpoint
CREATE INDEX "user_modification_logs_user_id_month_idx" ON "user_modification_logs" USING btree ("user_id","month");--> statement-breakpoint
CREATE INDEX "user_vip_subscriptions_user_id_idx" ON "user_vip_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_vip_subscriptions_membership_id_idx" ON "user_vip_subscriptions" USING btree ("membership_id");--> statement-breakpoint
CREATE INDEX "user_vip_subscriptions_status_idx" ON "user_vip_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "users_username_idx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_phone_idx" ON "users" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_wechat_openid_idx" ON "users" USING btree ("wechat_openid");--> statement-breakpoint
CREATE INDEX "venue_bookings_venue_id_idx" ON "venue_bookings" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "venue_bookings_slot_id_idx" ON "venue_bookings" USING btree ("slot_id");--> statement-breakpoint
CREATE INDEX "venue_bookings_user_id_idx" ON "venue_bookings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "venue_bookings_booking_date_idx" ON "venue_bookings" USING btree ("booking_date");--> statement-breakpoint
CREATE INDEX "venue_slots_venue_id_idx" ON "venue_slots" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "venue_slots_date_idx" ON "venue_slots" USING btree ("date");--> statement-breakpoint
CREATE INDEX "venues_city_idx" ON "venues" USING btree ("city");--> statement-breakpoint
CREATE INDEX "venues_type_idx" ON "venues" USING btree ("type");--> statement-breakpoint
CREATE INDEX "verification_codes_target_idx" ON "verification_codes" USING btree ("target");--> statement-breakpoint
CREATE INDEX "verification_codes_type_idx" ON "verification_codes" USING btree ("type");--> statement-breakpoint
CREATE INDEX "verification_codes_expires_at_idx" ON "verification_codes" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "vip_memberships_is_active_idx" ON "vip_memberships" USING btree ("is_active");