import { scryptSync, timingSafeEqual } from "crypto";

export function passwordsMatch(input: string, expected: string) {
  const salt = process.env.AUTH_SECRET || "future-summit";
  const left = scryptSync(input, salt, 32);
  const right = scryptSync(expected, salt, 32);
  return timingSafeEqual(left, right);
}
