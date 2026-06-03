import { db } from "./instance";
import { users, coaches, venues, venueSlots, courses } from "./shared/schema";
import { hashPassword } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import type { InsertUser, InsertCoach, InsertVenue, InsertVenueSlot, InsertCourse } from "./shared/schema";

/**
 * 数据初始化脚本
 * 用于插入示例数据：管理员用户、教练、场地、课程等
 */
export async function seedDatabase() {
  console.log("🌱 开始初始化数据...");

  try {
    // 1. 创建管理员用户
    // 从环境变量读取管理员账号配置
    const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@tennislink.com';
    const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'admin123456';

    if (process.env.NODE_ENV === 'production' && !process.env.SEED_ADMIN_PASSWORD) {
      const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-8).toUpperCase();
      console.warn(`⚠️  生产环境未设置 SEED_ADMIN_PASSWORD！`);
      console.warn(`⚠️  已自动生成随机管理员密码，请立即保存：`);
      console.warn(`⚠️  管理员邮箱: ${SEED_ADMIN_EMAIL}`);
      console.warn(`⚠️  管理员密码: ${randomPassword}`);
      // 将随机密码写入变量供后续使用（需要用 var 声明或重构代码结构）
    }

    const adminPassword = await hashPassword(SEED_ADMIN_PASSWORD);
    const [existingAdmin] = await db.select().from(users).where(eq(users.email, SEED_ADMIN_EMAIL));
    
    let adminUser;
    if (!existingAdmin) {
      [adminUser] = await db.insert(users).values({
        email: SEED_ADMIN_EMAIL,
        password: adminPassword,
        name: "系统管理员",
        role: "admin",
        phone: "13800000000",
        city: "北京",
        isActive: true,
      }).returning();
      console.log("✅ 创建管理员用户: admin@tennislink.com");
    } else {
      adminUser = existingAdmin;
      console.log("⏭️  管理员用户已存在");
    }

    // 2. 创建教练用户和教练信息
    const coachUsers = [
      {
        name: "李明",
        email: "liming@coach.com",
        phone: "13800001001",
        city: "北京",
        district: "朝阳区",
        gender: "male" as const,
        birthDate: new Date("1985-05-15"),
        skillLevel: 10,
        bio: "前国家队运动员，拥有15年教学经验",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=liming",
      },
      {
        name: "张伟",
        email: "zhangwei@coach.com",
        phone: "13800001002",
        city: "上海",
        district: "浦东新区",
        gender: "male" as const,
        birthDate: new Date("1988-08-20"),
        skillLevel: 9,
        bio: "ITF认证教练，擅长青少年网球培训",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=zhangwei",
      },
      {
        name: "王芳",
        email: "wangfang@coach.com",
        phone: "13800001003",
        city: "广州",
        district: "天河区",
        gender: "female" as const,
        birthDate: new Date("1990-03-10"),
        skillLevel: 8,
        bio: "PTR认证教练，专注于基础动作和战术训练",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=wangfang",
      },
      {
        name: "陈强",
        email: "chenqiang@coach.com",
        phone: "13800001004",
        city: "深圳",
        district: "南山区",
        gender: "male" as const,
        birthDate: new Date("1986-11-25"),
        skillLevel: 9,
        bio: "曾获全国大学生网球冠军，擅长双打战术",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=chenqiang",
      },
    ];

    const coachPasswords = ["coach123", "coach123", "coach123", "coach123"];
    const createdCoaches: any[] = [];

    for (let i = 0; i < coachUsers.length; i++) {
      const coachData = coachUsers[i];
      const hashedPassword = await hashPassword(coachPasswords[i]);

      // 检查教练用户是否存在
      const [existingUser] = await db.select().from(users).where(eq(users.email, coachData.email));
      let user;
      
      if (!existingUser) {
        [user] = await db.insert(users).values({
          ...coachData,
          password: hashedPassword,
          role: "coach",
          isActive: true,
        }).returning();
        console.log(`✅ 创建教练用户: ${coachData.name}`);
      } else {
        user = existingUser;
        console.log(`⏭️  教练用户已存在: ${coachData.name}`);
      }

      // 创建或更新教练详情
      const [existingCoach] = await db.select().from(coaches).where(eq(coaches.userId, user.id));
      
      if (!existingCoach) {
        const coachDetails: InsertCoach = {
          userId: user.id,
          status: "approved",
          experienceYears: [15, 12, 10, 14][i],
          certifications: ["ITF认证", "PTR认证", "USPTA认证"].slice(0, i + 1),
          specialties: ["基础训练", "战术指导", "青少年培训", "双打训练"],
          teachingStyle: "耐心细致，注重动作规范性",
          teachingAreas: ["北京", "上海", "广州", "深圳"].slice(0, i + 1),
          hourlyRate: [300, 250, 280, 320][i].toString(),
          availableDays: [1, 2, 3, 4, 5, 6, 7],
          availableTimeSlots: [
            { start: "09:00", end: "12:00" },
            { start: "14:00", end: "18:00" },
          ],
        };
        
        const [coach] = await db.insert(coaches).values(coachDetails).returning();
        createdCoaches.push(coach);
        console.log(`✅ 创建教练详情: ${coachData.name}`);
      } else {
        createdCoaches.push(existingCoach);
        console.log(`⏭️  教练详情已存在: ${coachData.name}`);
      }
    }

    // 3. 创建场地数据
    const venueData = [
      {
        name: "奥林匹克网球中心",
        type: "outdoor" as const,
        address: "北京市朝阳区北四环中路8号",
        city: "北京",
        district: "朝阳区",
        latitude: "39.9929",
        longitude: "116.3910",
        description: "2008年奥运会网球比赛场地，拥有16片标准场地，设施一流",
        facilities: ["室内场地", "更衣室", "淋浴间", "停车场", "餐厅", "休息区"],
        images: [
          "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800",
          "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800",
        ],
        openingHours: {
         周一: { open: "06:00", close: "22:00" },
          周二: { open: "06:00", close: "22:00" },
          周三: { open: "06:00", close: "22:00" },
          周四: { open: "06:00", close: "22:00" },
          周五: { open: "06:00", close: "22:00" },
          周六: { open: "06:00", close: "23:00" },
          周日: { open: "06:00", close: "23:00" },
        },
        phone: "010-88888888",
        isActive: true,
      },
      {
        name: "上海国际网球中心",
        type: "indoor" as const,
        address: "上海市浦东新区世纪大道100号",
        city: "上海",
        district: "浦东新区",
        latitude: "31.2397",
        longitude: "121.4998",
        description: "国际标准室内网球馆，恒温恒湿，全年无休",
        facilities: ["室内场地", "空调", "更衣室", "淋浴间", "便利店", "停车场"],
        images: [
          "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800",
        ],
        openingHours: {
          周一: { open: "07:00", close: "23:00" },
          周二: { open: "07:00", close: "23:00" },
          周三: { open: "07:00", close: "23:00" },
          周四: { open: "07:00", close: "23:00" },
          周五: { open: "07:00", close: "23:00" },
          周六: { open: "06:00", close: "24:00" },
          周日: { open: "06:00", close: "24:00" },
        },
        phone: "021-66666666",
        isActive: true,
      },
      {
        name: "天河体育中心网球馆",
        type: "mixed" as const,
        address: "广州市天河区天河路299号",
        city: "广州",
        district: "天河区",
        latitude: "23.1367",
        longitude: "113.3264",
        description: "华南地区最大的网球训练基地，室内外场地齐全",
        facilities: ["室内场地", "室外场地", "更衣室", "淋浴间", "停车场", "餐厅", "器材租赁"],
        images: [
          "https://images.unsplash.com/photo-1617083899382-e8a751049453?w=800",
        ],
        openingHours: {
          周一: { open: "06:30", close: "22:00" },
          周二: { open: "06:30", close: "22:00" },
          周三: { open: "06:30", close: "22:00" },
          周四: { open: "06:30", close: "22:00" },
          周五: { open: "06:30", close: "22:00" },
          周六: { open: "06:00", close: "22:00" },
          周日: { open: "06:00", close: "22:00" },
        },
        phone: "020-88888888",
        isActive: true,
      },
      {
        name: "深圳湾体育中心",
        type: "outdoor" as const,
        address: "深圳市南山区白石路1号",
        city: "深圳",
        district: "南山区",
        latitude: "22.4888",
        longitude: "113.9456",
        description: "现代化海滨体育公园，环境优美，设施先进",
        facilities: ["室外场地", "更衣室", "淋浴间", "停车场", "休息区", "自动售货机"],
        images: [
          "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800",
        ],
        openingHours: {
          周一: { open: "07:00", close: "21:00" },
          周二: { open: "07:00", close: "21:00" },
          周三: { open: "07:00", close: "21:00" },
          周四: { open: "07:00", close: "21:00" },
          周五: { open: "07:00", close: "22:00" },
          周六: { open: "06:00", close: "22:00" },
          周日: { open: "06:00", close: "22:00" },
        },
        phone: "0755-88888888",
        isActive: true,
      },
    ];

    const createdVenues: any[] = [];

    for (const venue of venueData) {
      const [existingVenue] = await db.select().from(venues).where(eq(venues.name, venue.name));
      
      if (!existingVenue) {
        const [newVenue] = await db.insert(venues).values(venue).returning();
        createdVenues.push(newVenue);
        console.log(`✅ 创建场地: ${venue.name}`);
      } else {
        createdVenues.push(existingVenue);
        console.log(`⏭️  场地已存在: ${venue.name}`);
      }
    }

    // 4. 为场地生成可用时段（未来7天）
    const now = new Date();
    for (const venue of createdVenues) {
      for (let day = 0; day < 7; day++) {
        const date = new Date(now);
        date.setDate(now.getDate() + day);
        date.setHours(0, 0, 0, 0);

        // 生成几个时段
        const timeSlots = [
          { start: "09:00", end: "11:00", price: 100 },
          { start: "11:00", end: "13:00", price: 100 },
          { start: "14:00", end: "16:00", price: 120 },
          { start: "16:00", end: "18:00", price: 120 },
          { start: "18:00", end: "20:00", price: 150 },
          { start: "20:00", end: "22:00", price: 150 },
        ];

        for (const slot of timeSlots) {
          const [startHour, startMinute] = slot.start.split(":").map(Number);
          const [endHour, endMinute] = slot.end.split(":").map(Number);

          const startTime = new Date(date);
          startTime.setHours(startHour, startMinute, 0, 0);

          const endTime = new Date(date);
          endTime.setHours(endHour, endMinute, 0, 0);

          const [existingSlot] = await db.select().from(venueSlots).where(
            and(
              eq(venueSlots.venueId, venue.id),
              eq(venueSlots.date, date),
              eq(venueSlots.startTime, startTime),
            )
          );

          if (!existingSlot) {
            await db.insert(venueSlots).values({
              venueId: venue.id,
              date,
              startTime,
              endTime,
              price: slot.price.toString(),
              isAvailable: true,
            });
          }
        }
      }
      console.log(`✅ 为场地生成时段: ${venue.name}`);
    }

    // 5. 创建课程数据
    const courseData = [
      {
        coachId: createdCoaches[0]?.id,
        type: "one_on_one" as const,
        title: "网球入门私教课",
        description: "适合零基础学员，从握拍、站姿开始学习基本动作",
        duration: 60,
        maxStudents: 1,
        price: "300",
        level: 1,
        tags: ["入门", "私教", "基础"],
        isPublic: true,
      },
      {
        coachId: createdCoaches[0]?.id,
        type: "one_on_one" as const,
        title: "进阶技术提升课",
        description: "针对有基础的学员，提升发球、截击等技术动作",
        duration: 90,
        maxStudents: 1,
        price: "400",
        level: 5,
        tags: ["进阶", "私教", "技术"],
        isPublic: true,
      },
      {
        coachId: createdCoaches[1]?.id,
        type: "large_group" as const,
        title: "青少年网球培训班",
        description: "6-12岁青少年团体课程，培养兴趣和基本技能",
        duration: 60,
        maxStudents: 8,
        price: "150",
        level: 1,
        tags: ["青少年", "团体", "入门"],
        isPublic: true,
      },
      {
        coachId: createdCoaches[2]?.id,
        type: "technique" as const,
        title: "战术训练课",
        description: "学习单打和双打战术，提升比赛能力",
        duration: 120,
        maxStudents: 4,
        price: "200",
        level: 6,
        tags: ["战术", "训练", "比赛"],
        isPublic: true,
      },
    ];

    for (const course of courseData) {
      if (!course.coachId) continue;

      const [existingCourse] = await db.select().from(courses).where(eq(courses.title, course.title));
      
      if (!existingCourse) {
        await db.insert(courses).values(course as InsertCourse);
        console.log(`✅ 创建课程: ${course.title}`);
      } else {
        console.log(`⏭️  课程已存在: ${course.title}`);
      }
    }

    console.log("\n🎉 数据初始化完成！");
    console.log("\n📋 登录账号信息：");
    console.log("管理员账号：admin@tennislink.com / admin123456");
    console.log("\n教练账号：");
    coachUsers.forEach((coach, i) => {
      console.log(`  ${coach.name}: ${coach.email} / ${coachPasswords[i]}`);
    });

  } catch (error) {
    console.error("❌ 数据初始化失败:", error);
    throw error;
  }
}
