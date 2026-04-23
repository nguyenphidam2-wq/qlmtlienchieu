import { SignJWT, jwtVerify } from "jose";

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
