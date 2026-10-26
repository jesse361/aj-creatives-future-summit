import { AdminForm } from "@/components/admin-form";
import { prisma } from "@/lib/db";
import { inputClass, labelClass } from "@/lib/styles";
import { mediaConfigured } from "@/lib/uploads";
import { uploadMedia } from "@/server/actions/admin-settings";

export const instant = false;

export default async function MediaAdmin() {
  const assets = await prisma.mediaAsset.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return (
    <div className="grid gap-8">
      <h1 className="font-display text-4xl text-navy">Media</h1>
      <p className="text-sm text-ink-soft">{mediaConfigured() ? "Uploads go to Vercel Blob." : "Blob storage is not configured. Uploads are refused until BLOB_READ_WRITE_TOKEN is set."}</p>
      <AdminForm action={uploadMedia} submitLabel="Upload">
        <label className={labelClass}>Image<input className={inputClass} type="file" name="file" accept="image/jpeg,image/png,image/webp" required /></label>
        <label className={labelClass}>Alt text<input className={inputClass} name="alt" required /></label>
      </AdminForm>
      <ul className="grid gap-3 text-sm">
        {assets.map((asset) => (
          <li key={asset.id} className="border border-line bg-white p-3">
            <p>{asset.alt}</p>
            <p className="break-all text-electric">{asset.url}</p>
          </li>
        ))}
        {assets.length === 0 ? <li className="text-ink-soft">No uploads yet.</li> : null}
      </ul>
    </div>
  );
}
