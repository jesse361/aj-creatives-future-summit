"use server";

import { revalidatePath } from "next/cache";
import { createInquiry } from "@/lib/contact";
import { clientIp } from "@/lib/request";
import type { ContactInput } from "@/lib/validation";

export async function submitContactAction(input: ContactInput) {
  const result = await createInquiry(input, { ip: await clientIp() });
  if (result.ok) revalidatePath("/admin/inquiries");
  return result;
}
