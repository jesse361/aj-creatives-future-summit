"use server";

import { updateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { TAGS } from "@/lib/constants";
import { writeAudit } from "@/lib/audit";
import { getCurrentAdmin } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { isSafeImageSrc } from "@/lib/safe-url";
import { checkbox, faqSchema, fieldErrors, pageSchema, passwordChangeSchema, settingsSchema, socialsFromForm, testimonialSchema } from "@/lib/validation";
import { saveImageUpload } from "@/lib/uploads";
import { guard } from "@/server/actions/guard";
import type { FormState } from "@/lib/types";

function refreshPages() {
  updateTag(TAGS.pages);
  updateTag(TAGS.settings);
  updateTag(TAGS.events);
}

export async function saveSettings(_previous: FormState, formData: FormData): Promise<FormState> {
  const { admin, error } = await guard("settings");
  if (!admin || error) return { ok: false, message: error ?? "Unauthorized" };
  const parsed = settingsSchema.safeParse({
    brandName: formData.get("brandName"),
    legalName: formData.get("legalName"),
    tagline: formData.get("tagline"),
    secondaryTagline: formData.get("secondaryTagline"),
    logoUrl: formData.get("logoUrl") ?? "",
    contactEmail: String(formData.get("contactEmail") ?? ""),
    contactPhone: formData.get("contactPhone") ?? "",
    address: formData.get("address") ?? "",
    socialLinks: socialsFromForm(formData),
    defaultCurrency: String(formData.get("defaultCurrency") ?? "GHS").toUpperCase(),
    announcementEnabled: checkbox(formData.get("announcementEnabled")),
    announcement: formData.get("announcement") ?? "",
    footerContent: formData.get("footerContent") ?? "",
    seoTitle: formData.get("seoTitle") ?? "",
    seoDescription: formData.get("seoDescription") ?? "",
    registrationHoldMinutes: formData.get("registrationHoldMinutes") ?? 30,
  });
  if (!parsed.success) return { ok: false, message: "Check the settings.", fieldErrors: fieldErrors(parsed.error) };
  if (parsed.data.logoUrl && !isSafeImageSrc(parsed.data.logoUrl)) return { ok: false, message: "The logo must be a site path or https image." };
  await prisma.siteSettings.upsert({ where: { id: "site" }, update: parsed.data, create: { id: "site", ...parsed.data } });
  await writeAudit(admin, "settings.update", "SiteSettings", "site", "Site settings updated");
  refreshPages();
  return { ok: true, message: "Settings saved." };
}

export async function savePage(_previous: FormState, formData: FormData): Promise<FormState> {
  const { admin, error } = await guard("content");
  if (!admin || error) return { ok: false, message: error ?? "Unauthorized" };
  const parsed = pageSchema.safeParse({ key: formData.get("key"), title: formData.get("title"), body: formData.get("body") });
  if (!parsed.success) return { ok: false, message: "Check the page content.", fieldErrors: fieldErrors(parsed.error) };
  await prisma.pageContent.upsert({ where: { key: parsed.data.key }, update: parsed.data, create: parsed.data });
  await writeAudit(admin, "page.update", "PageContent", parsed.data.key, parsed.data.title);
  refreshPages();
  return { ok: true, message: "Page saved." };
}

export async function saveFaq(_previous: FormState, formData: FormData): Promise<FormState> {
  const { admin, error } = await guard("content");
  if (!admin || error) return { ok: false, message: error ?? "Unauthorized" };
  const parsed = faqSchema.safeParse({
    question: formData.get("question"),
    answer: formData.get("answer"),
    category: formData.get("category"),
    displayOrder: formData.get("displayOrder") ?? 0,
    published: checkbox(formData.get("published")),
  });
  if (!parsed.success) return { ok: false, message: "Check the question.", fieldErrors: fieldErrors(parsed.error) };
  const id = String(formData.get("id") ?? "");
  const saved = id ? await prisma.faq.update({ where: { id }, data: parsed.data }) : await prisma.faq.create({ data: parsed.data });
  await writeAudit(admin, id ? "faq.update" : "faq.create", "Faq", saved.id, saved.question);
  refreshPages();
  return { ok: true, message: "Question saved." };
}

export async function deleteFaq(formData: FormData) {
  const { admin, error } = await guard("content");
  if (!admin || error) return;
  const id = String(formData.get("id") ?? "");
  await prisma.faq.delete({ where: { id } }).catch(() => null);
  await writeAudit(admin, "faq.delete", "Faq", id, "FAQ removed");
  refreshPages();
}

export async function deleteTestimonial(formData: FormData) {
  const { admin, error } = await guard("content");
  if (!admin || error) return;
  const id = String(formData.get("id") ?? "");
  await prisma.testimonial.delete({ where: { id } }).catch(() => null);
  await writeAudit(admin, "testimonial.delete", "Testimonial", id, "Testimonial removed");
  refreshPages();
}

export async function saveTestimonial(_previous: FormState, formData: FormData): Promise<FormState> {
  const { admin, error } = await guard("content");
  if (!admin || error) return { ok: false, message: error ?? "Unauthorized" };
  const parsed = testimonialSchema.safeParse({
    quote: formData.get("quote"),
    name: formData.get("name"),
    role: formData.get("role") ?? "",
    eventName: formData.get("eventName") ?? "",
    status: formData.get("status"),
    displayOrder: formData.get("displayOrder") ?? 0,
  });
  if (!parsed.success) return { ok: false, message: "Check the testimonial. Only approved quotes appear on the site.", fieldErrors: fieldErrors(parsed.error) };
  const id = String(formData.get("id") ?? "");
  const saved = id ? await prisma.testimonial.update({ where: { id }, data: parsed.data }) : await prisma.testimonial.create({ data: parsed.data });
  await writeAudit(admin, id ? "testimonial.update" : "testimonial.create", "Testimonial", saved.id, saved.status);
  refreshPages();
  return { ok: true, message: saved.status === "APPROVED" ? "Testimonial approved." : "Testimonial saved and kept off the public site." };
}

export async function uploadMedia(_previous: FormState, formData: FormData): Promise<FormState> {
  const { admin, error } = await guard("content");
  if (!admin || error) return { ok: false, message: error ?? "Unauthorized" };
  const file = formData.get("file");
  const alt = String(formData.get("alt") ?? "").trim();
  if (!(file instanceof File)) return { ok: false, message: "Choose an image." };
  if (alt.length < 3) return { ok: false, message: "Add a short description of the image." };
  try {
    const saved = await saveImageUpload(file, "media");
    await prisma.mediaAsset.create({ data: { url: saved.url, pathname: saved.pathname, alt, mimeType: saved.mimeType, size: saved.size } });
    await writeAudit(admin, "media.upload", "MediaAsset", saved.pathname, alt);
    return { ok: true, message: "Image uploaded. Copy the URL into an event, speaker, or sponsor field." };
  } catch (uploadError) {
    return { ok: false, message: uploadError instanceof Error ? uploadError.message : "Upload failed." };
  }
}

export async function changePassword(_previous: FormState, formData: FormData): Promise<FormState> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, message: "You need to sign in again." };
  const parsed = passwordChangeSchema.safeParse({ currentPassword: formData.get("currentPassword"), nextPassword: formData.get("nextPassword") });
  if (!parsed.success) return { ok: false, message: "Use your current password and a new password of at least 12 characters." };
  const user = await prisma.adminUser.findUnique({ where: { id: admin.id } });
  if (!user || !(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) return { ok: false, message: "The current password is not correct." };
  const name = String(formData.get("name") ?? user.name).trim() || user.name;
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { name, passwordHash: await hashPassword(parsed.data.nextPassword) },
  });
  await writeAudit(admin, "profile.password", "AdminUser", admin.id, "Password changed");
  return { ok: true, message: "Password updated." };
}
