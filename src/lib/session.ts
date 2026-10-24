import { jwtVerify, SignJWT } from "jose";

export const ADMIN_COOKIE = "fs_admin_session";

function key(secret: string) {
  return new TextEncoder().encode(secret);
}

export async function signAdminToken(secret: string) {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("admin")
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(key(secret));
}

export async function verifyAdminToken(token: string, secret: string) {
  if (!secret || secret.length < 16) return false;
  try {
    const { payload } = await jwtVerify(token, key(secret));
    return payload.role === "admin";
  } catch {
    return false;
  }
}
