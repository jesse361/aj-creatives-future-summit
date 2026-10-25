import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function saveImageUpload(file: File) {
  if (!file || file.size === 0) return "";
  if (file.size > 2_000_000) throw new Error("Images must be 2 MB or smaller.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const extension = imageExtension(bytes);
  if (!extension) throw new Error("Upload a JPEG, PNG, or WebP image.");
  const filename = `${randomBytes(16).toString("hex")}.${extension}`;
  const directory = path.join(process.cwd(), "public", "uploads");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), bytes);
  return `/uploads/${filename}`;
}

function imageExtension(bytes: Buffer) {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  if (bytes.length > 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}
