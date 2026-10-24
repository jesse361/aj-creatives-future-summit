"use server";

import { revalidatePath } from "next/cache";
import { createRegistration } from "@/lib/registrations";
import { clientIp } from "@/lib/request";
import type { RegistrationInput } from "@/lib/validation";

export async function submitRegistrationAction(input: RegistrationInput) {
  const result = await createRegistration(input, { ip: await clientIp() });
  if (result.ok) {
    revalidatePath("/tickets");
    revalidatePath("/admin/registrations");
  }
  return result;
}
