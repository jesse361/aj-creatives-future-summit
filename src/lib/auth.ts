import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/constants";

const TWELVE_HOURS = 1000 * 60 * 60 * 12;

export async function createAdminSession(userId: string) {
  const id = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TWELVE_HOURS);
  await prisma.adminSession.create({ data: { id, userId, expiresAt } });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function getCurrentAdmin() {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const session = await prisma.adminSession.findUnique({ where: { id }, include: { user: true } });
  if (!session || session.expiresAt.getTime() <= Date.now() || session.user.role !== "ADMIN") return null;
  return { id: session.user.id, email: session.user.email, role: session.user.role };
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function destroyAdminSession() {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (id) await prisma.adminSession.deleteMany({ where: { id } });
  jar.delete(SESSION_COOKIE);
}
