"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/db";
import { createAdminSession, destroyAdminSession } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { assertRateLimit, clientKey, RateLimitError } from "@/lib/rate-limit";
import { safeNextPath } from "@/lib/safe-url";

const DUMMY_HASH = `scrypt$${ "11".repeat(16) }$${ "22".repeat(64) }`;

export type LoginState = { message: string };

export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const nextPath = safeNextPath(String(formData.get("next") ?? ""));
  try {
    await assertRateLimit(await clientKey("login"), 10, 15 * 60 * 1000);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const user = email ? await prisma.adminUser.findUnique({ where: { email } }) : null;
    const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !valid || user.role !== "ADMIN") {
      return { message: "Invalid email or password." };
    }
    await prisma.adminSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    await createAdminSession(user.id);
    redirect(nextPath);
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof RateLimitError) return { message: "Too many sign-in attempts. Please wait and try again." };
    return { message: "Sign-in could not be completed." };
  }
}

export async function logoutAction() {
  await destroyAdminSession();
  redirect("/admin/login");
}
