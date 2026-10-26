import { randomBytes } from "node:crypto";
import { put, del } from "@vercel/blob";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";

export function imageKind(bytes: Buffer) {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { ext: "jpg", mime: "image/jpeg" };
  if (bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return { ext: "png", mime: "image/png" };
  if (bytes.length > 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return { ext: "webp", mime: "image/webp" };
  return null;
}

export function mediaConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function saveImageUpload(file: File, folder: string) {
  if (!file || file.size === 0) throw new Error("Choose an image to upload.");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Images must be 2 MB or smaller.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const kind = imageKind(bytes);
  if (!kind) throw new Error("Upload a JPEG, PNG, or WebP image.");
  if (!mediaConfigured()) {
    throw new Error("Image storage is not configured. Add BLOB_READ_WRITE_TOKEN before uploading.");
  }
  const pathname = `whyus/${folder}/${randomBytes(16).toString("hex")}.${kind.ext}`;
  const blob = await put(pathname, bytes, {
    access: "public",
    contentType: kind.mime,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  return { url: blob.url, pathname: blob.pathname, mimeType: kind.mime, size: bytes.length };
}

export async function removeStoredImage(pathname: string) {
  if (!pathname || !mediaConfigured()) return;
  await del(pathname, { token: process.env.BLOB_READ_WRITE_TOKEN });
}
