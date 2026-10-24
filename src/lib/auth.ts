import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, signAdminToken, verifyAdminToken } from "@/lib/session";

export { passwordsMatch } from "@/lib/password";

function authSecret() {
  const secret = process.env.AUTH_SECRET ?? "";
  if (secret.length < 16) {
    throw new Error("AUTH_SECRET must be set to a string of at least 16 characters.");
  }
  return secret;
}

export async function readAdminSession() {
  const secret = process.env.AUTH_SECRET ?? "";
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token || !secret) return false;
  return verifyAdminToken(token, secret);
}

export async function requireAdmin() {
  const allowed = await readAdminSession();
  if (!allowed) redirect("/admin/login");
}

export async function setAdminCookie() {
  const token = await signAdminToken(authSecret());
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearAdminCookie() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
}
