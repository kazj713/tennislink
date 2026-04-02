import { hash, compare } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// 验证JWT密钥配置
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error(
    "JWT_SECRET environment variable is required and must be at least 32 characters long. " +
    "Please set a secure random string in your .env.local file."
  );
}

// 将密钥转换为 Uint8Array (jose 库要求)
const getSecretKey = () => new TextEncoder().encode(JWT_SECRET);

/**
 * 密码加密
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

/**
 * 密码验证
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(password, hashedPassword);
}

/**
 * 生成JWT Token
 */
export async function signToken(payload: {
  userId: string;
  email: string;
  role: string;
}): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecretKey());
}

/**
 * 验证JWT Token (从 cookie 获取)
 */
export async function verifyToken(): Promise<{
  userId: string;
  email: string;
  role: string;
} | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as { userId: string; email: string; role: string };
  } catch (error) {
    return null;
  }
}

/**
 * 验证JWT Token (传入 token)
 */
export async function verifyJWTToken(token: string): Promise<{
  userId: string;
  email: string;
  role: string;
} | null> {
  try {
    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as { userId: string; email: string; role: string };
  } catch (error) {
    return null;
  }
}
