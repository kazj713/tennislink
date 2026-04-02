/**
 * 用户资料API
 * 获取和更新用户资料
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { userManager } from '@/storage/database/userManager';
import { userModificationLogManager } from '@/storage/database/userModificationLogManager';
import { verificationCodeManager } from '@/storage/database/verificationCodeManager';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 本地开发环境的模拟用户数据
const MOCK_USERS = [
  {
    id: 'admin-001',
    email: 'admin@tennislink.com',
    name: '系统管理员',
    role: 'admin',
    phone: '13800000000',
    avatar: null,
    username: 'admin',
    gender: null,
    birthDate: null,
    city: '北京',
    district: null,
    skillLevel: null,
    bio: null,
    learningGoal: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'coach-001',
    email: 'coach@tennislink.com',
    name: '测试教练',
    role: 'coach',
    phone: '13800000001',
    avatar: null,
    username: 'coach',
    gender: 'male',
    birthDate: '1990-01-01',
    city: '北京',
    district: '朝阳区',
    skillLevel: 8,
    bio: '专业网球教练，拥有10年教学经验',
    learningGoal: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'student-001',
    email: 'student@tennislink.com',
    name: '测试学员',
    role: 'student',
    phone: '13800000002',
    avatar: null,
    username: 'student',
    gender: 'female',
    birthDate: '1995-05-15',
    city: '上海',
    district: '浦东新区',
    skillLevel: 3,
    bio: '网球爱好者，希望提升技术',
    learningGoal: 'skill_improvement',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// 检查是否是本地开发环境
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * 从Cookie中获取当前用户ID
 * @returns 用户ID或null
 */
async function getCurrentUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(
      token.value,
      new TextEncoder().encode(JWT_SECRET)
    );

    return payload.userId as string;
  } catch (error) {
    return null;
  }
}

/**
 * GET /api/user/profile
 * 获取当前用户资料
 */
export async function GET(request: NextRequest) {
  try {
    // 获取当前用户ID
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    let user;

    // 本地开发环境使用模拟数据
    if (isDevelopment) {
      user = MOCK_USERS.find(u => u.id === userId);
    } else {
      // 生产环境使用数据库
      user = await userManager.getUserById(userId);
    }

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user
    });

  } catch (error: any) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: '获取用户资料失败' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/profile
 * 更新用户资料
 * 请求体:
 * {
 *   "avatar": "https://example.com/avatar.jpg", // 可选
 *   "name": "new_username", // 可选，需要验证码
 *   "gender": "male", // 可选
 *   "birthDate": "2000-01-01", // 可选
 *   "city": "北京", // 可选
 *   "district": "朝阳区", // 可选
 *   "skillLevel": 5, // 可选
 *   "learningGoal": "skill_improvement", // 可选
 *   "bio": "个人简介", // 可选
 *   "code": "123456" // 如果修改name需要验证码
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    // 获取当前用户ID
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    // 获取用户信息
    const user = await userManager.getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { avatar, name, gender, birthDate, city, district, skillLevel, learningGoal, bio, code } = body;

    // 准备更新数据
    const updateData: any = {};

    // 更新头像（每月仅限一次）
    if (avatar !== undefined && avatar !== user.avatar) {
      const canModifyAvatar = await userModificationLogManager.canModify(userId, 'avatar');
      if (!canModifyAvatar) {
        return NextResponse.json(
          { error: '每月只能修改一次头像' },
          { status: 429 }
        );
      }

      // 记录修改
      await userModificationLogManager.logModification(
        userId,
        'avatar',
        user.avatar,
        avatar
      );

      updateData.avatar = avatar;
    }

    // 更新用户名（需要验证码，每月仅限一次）
    if (name !== undefined && name !== user.name) {
      // 验证验证码
      if (!code) {
        return NextResponse.json(
          { error: '修改用户名需要验证码' },
          { status: 400 }
        );
      }

      // 使用邮箱验证验证码（如果用户有邮箱）
      const verificationTarget = user.email || user.phone;
      if (!verificationTarget) {
        return NextResponse.json(
          { error: '请先绑定邮箱或手机号' },
          { status: 400 }
        );
      }

      const isCodeValid = await verificationCodeManager.verify(
        verificationTarget,
        code,
        'bind_email'
      );

      if (!isCodeValid) {
        return NextResponse.json(
          { error: '验证码错误或已过期' },
          { status: 400 }
        );
      }

      // 检查是否可以修改
      const canModifyUsername = await userModificationLogManager.canModify(userId, 'username');
      if (!canModifyUsername) {
        return NextResponse.json(
          { error: '每月只能修改一次用户名' },
          { status: 429 }
        );
      }

      // 记录修改
      await userModificationLogManager.logModification(
        userId,
        'username',
        user.name,
        name
      );

      updateData.name = name;
    }

    // 更新其他基本信息
    if (gender !== undefined) updateData.gender = gender;
    if (birthDate !== undefined) updateData.birthDate = birthDate;
    if (city !== undefined) updateData.city = city;
    if (district !== undefined) updateData.district = district;
    if (skillLevel !== undefined) updateData.skillLevel = skillLevel;
    if (learningGoal !== undefined) updateData.learningGoal = learningGoal;
    if (bio !== undefined) updateData.bio = bio;

    // 执行更新
    if (Object.keys(updateData).length > 0) {
      await userManager.update(userId, updateData);
    }

    // 获取更新后的用户信息
    const updatedUser = await userManager.getUserById(userId);
    if (!updatedUser) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // 移除密码字段
    const { password, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
      message: '更新成功'
    });

  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: '更新用户资料失败' },
      { status: 500 }
    );
  }
}
