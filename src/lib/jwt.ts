import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const JWT_SECRET_KEY = process.env.JWT_SECRET || "qlmt-lienchieu-super-secret-key-12345!@#";
const key = new TextEncoder().encode(JWT_SECRET_KEY);

export async function signJWT(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(key);
}

export async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Lấy thông tin user hiện tại từ cookie auth_token
 * Trả về null nếu không có token hoặc token không hợp lệ
 */
export async function getCurrentUser(): Promise<{ id: string; username: string; role: string } | null> {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth_token");

    if (!authToken?.value) {
      return null;
    }

    const payload = await verifyJWT(authToken.value);
    if (!payload) {
      return null;
    }

    return {
      id: (payload.id || payload.userId) as string,
      username: payload.username as string,
      role: payload.role as string,
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}
