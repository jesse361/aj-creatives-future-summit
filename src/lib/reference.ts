import { randomBytes } from "node:crypto";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function createReference() {
  const bytes = randomBytes(10);
  let value = "WHY-";
  for (const byte of bytes) value += alphabet[byte % alphabet.length];
  return value;
}

export function createToken() {
  return randomBytes(32).toString("hex");
}

export function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!user || !domain) return "";
  return `${user.slice(0, 1)}***@${domain}`;
}
