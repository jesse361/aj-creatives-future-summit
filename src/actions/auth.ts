"use server";

import { redirect } from "next/navigation";
import { clearAdminCookie, passwordsMatch, readAdminSession, setAdminCookie } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";

export async function loginAction(_prev: { message: string }, formData: FormData) {
  const ip = await clientIp();
  const limited = rateLimit(`login:${ip}`, 8, 15 * 60 * 1000);
  if (!limited.ok) return { message: "Too many sign-in attempts. Please wait and try again." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const expectedEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const expectedPassword = process.env.ADMIN_PASSWORD ?? "";
  if (!expectedEmail || !expectedPassword || email !== expectedEmail || !passwordsMatch(password, expectedPassword)) {
    return { message: "Those administrator details were not recognized." };
  }
  await setAdminCookie();
  redirect("/admin");
}

export async function logoutAction() {
  if (!(await readAdminSession())) redirect("/admin/login");
  await clearAdminCookie();
  redirect("/admin/login");
}
