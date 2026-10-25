import { randomBytes } from "node:crypto";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function createReference() {
  const bytes = randomBytes(8);
  let value = "FS27-";
  for (const byte of bytes) value += alphabet[byte % alphabet.length];
  return value;
}

export function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!user || !domain) return "";
  return `${user.slice(0, 1)}***@${domain}`;
}
