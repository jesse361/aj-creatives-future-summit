"use server";

import { createHash, randomBytes } from "node:crypto";
import { redirect, unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/db";
import { createAdminSession, destroyAdminSession } from "@/lib/auth";
import { appUrl } from "@/lib/app-url";
import { sendPasswordResetEmail } from "@/lib/email";
import { hashPassword, verifyPassword } from "@/lib/password";
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
    if (!user || !valid || user.status !== "ACTIVE") return { message: "Invalid email or password." };
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

export async function requestResetAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  try {
    await assertRateLimit(await clientKey("reset"), 5, 60 * 60 * 1000);
    const emailConfigured = Boolean((process.env.RESEND_API_KEY || process.env.EMAIL_PROVIDER_API_KEY) && process.env.EMAIL_FROM);
    if (!emailConfigured) return { message: "Password recovery email is not configured. Create or reset the administrator from the server." };
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const user = email ? await prisma.adminUser.findUnique({ where: { email } }) : null;
    if (user && user.status === "ACTIVE") {
      const token = randomBytes(32).toString("hex");
      const resetTokenHash = createHash("sha256").update(token).digest("hex");
      await prisma.adminUser.update({
        where: { id: user.id },
        data: { resetTokenHash, resetExpires: new Date(Date.now() + 60 * 60 * 1000) },
      });
      await sendPasswordResetEmail({ email: user.email, url: `${appUrl()}/admin/reset?token=${token}` });
    }
    return { message: "If an active administrator uses that email, a reset link is on its way." };
  } catch (error) {
    if (error instanceof RateLimitError) return { message: "Too many reset attempts. Please wait and try again." };
    return { message: "Password recovery could not be started." };
  }
}

export async function resetPasswordAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  if (password.length < 12) return { message: "Use at least 12 characters." };
  const resetTokenHash = createHash("sha256").update(token).digest("hex");
  const user = await prisma.adminUser.findFirst({ where: { resetTokenHash, resetExpires: { gt: new Date() }, status: "ACTIVE" } });
  if (!user) return { message: "This reset link is invalid or has expired." };
  await prisma.adminUser.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(password), resetTokenHash: null, resetExpires: null },
  });
  await prisma.adminSession.deleteMany({ where: { userId: user.id } });
  redirect("/admin/login");
}
