import { updateInquiry } from "@/actions/admin";
import { AdminNotice } from "@/components/admin/AdminChrome";
import { inquiryLabel } from "@/lib/constants";
import { prisma } from "@/lib/db";

export const metadata = { title: "Inquiries" };

export default async function InquiriesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const query = await searchParams;
  const inquiries = await prisma.contactInquiry.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div>
      <h1 className="text-4xl">Inquiries</h1>
      <AdminNotice saved={query.saved} error={query.error} />
      <div className="mt-6 grid gap-4">
        {inquiries.length === 0 ? <p className="text-muted">No messages yet.</p> : null}
        {inquiries.map((inquiry) => (
          <article key={inquiry.id} className="surface-card p-5">
            <p className="text-sm text-muted">{inquiryLabel(inquiry.category)} · {inquiry.status}</p>
            <h2 className="mt-1 text-2xl">{inquiry.name}</h2>
            <p className="text-sm">{inquiry.email}</p>
            <p className="mt-3 text-sm leading-6">{inquiry.message}</p>
            <form action={updateInquiry} className="mt-4 flex flex-wrap items-center gap-3">
              <input type="hidden" name="id" value={inquiry.id} />
              <select name="status" defaultValue={inquiry.status} className="rounded-xl border border-line px-3 py-2">
                <option value="NEW">New</option>
                <option value="REVIEWED">Reviewed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
              <button className="btn btn-ghost">Update</button>
            </form>
          </article>
        ))}
      </div>
    </div>
  );
}
