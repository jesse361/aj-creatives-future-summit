import { AdminForm } from "@/components/admin-form";
import { prisma } from "@/lib/db";
import { BENEFITS } from "@/lib/constants";
import { inputClass, labelClass } from "@/lib/styles";
import { deleteFaq, deleteTestimonial, saveFaq, savePage, saveTestimonial } from "@/server/actions/admin-settings";

export const instant = false;

const keys = ["about", "home-about", "benefits", "privacy", "terms"] as const;

export default async function PagesAdmin({ searchParams }: { searchParams: Promise<{ key?: string; faq?: string; testimonial?: string }> }) {
  const params = await searchParams;
  const key = keys.includes(params.key as (typeof keys)[number]) ? params.key! : "about";
  const [page, faqs, testimonials] = await Promise.all([
    prisma.pageContent.findUnique({ where: { key } }),
    prisma.faq.findMany({ orderBy: { displayOrder: "asc" } }),
    prisma.testimonial.findMany({ orderBy: { displayOrder: "asc" } }),
  ]);
  return (
    <div className="grid gap-10">
      <h1 className="font-display text-4xl text-navy">Pages</h1>
      <nav className="flex flex-wrap gap-3 text-sm">{keys.map((item) => <a key={item} className={item === key ? "text-electric" : ""} href={`/admin/pages?key=${item}`}>{item}</a>)}</nav>
      <AdminForm action={savePage}>
        <input type="hidden" name="key" value={key} />
        <label className={labelClass}>Title<input className={inputClass} name="title" defaultValue={page?.title ?? ""} required /></label>
        <label className={labelClass}>
          Body
          <textarea className={`${inputClass} min-h-64`} name="body" defaultValue={page?.body ?? (key === "benefits" ? JSON.stringify(BENEFITS, null, 2) : "")} required />
        </label>
        {key === "benefits" ? <p className="text-xs text-ink-soft">Benefits are JSON: an array of title and description.</p> : null}
      </AdminForm>
      <section className="grid gap-4">
        <h2 className="font-display text-2xl">FAQ</h2>
        <ul className="grid gap-2 text-sm">
          {faqs.map((faq) => (
            <li key={faq.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-2">
              <span>{faq.question} · {faq.published ? "published" : "hidden"}</span>
              <span className="flex gap-3">
                <a className="text-electric" href={`/admin/pages?key=${key}&faq=${faq.id}`}>Edit</a>
                <form action={deleteFaq}><input type="hidden" name="id" value={faq.id} /><button className="text-sm text-red-800" type="submit">Delete</button></form>
              </span>
            </li>
          ))}
        </ul>
        <FaqEditor faq={faqs.find((faq) => faq.id === params.faq) ?? null} />
      </section>
      <section className="grid gap-4">
        <h2 className="font-display text-2xl">Testimonials</h2>
        <p className="text-sm text-ink-soft">Draft quotes stay off the public site. Approve only a real attendee statement.</p>
        <ul className="grid gap-2 text-sm">
          {testimonials.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-2">
              <span>{item.name} · {item.status}</span>
              <span className="flex gap-3">
                <a className="text-electric" href={`/admin/pages?key=${key}&testimonial=${item.id}`}>Edit</a>
                <form action={deleteTestimonial}><input type="hidden" name="id" value={item.id} /><button className="text-sm text-red-800" type="submit">Delete</button></form>
              </span>
            </li>
          ))}
        </ul>
        <TestimonialEditor item={testimonials.find((item) => item.id === params.testimonial) ?? null} />
      </section>
    </div>
  );
}

function FaqEditor({ faq }: { faq: { id: string; question: string; answer: string; category: string; displayOrder: number; published: boolean } | null }) {
  return (
    <AdminForm action={saveFaq} submitLabel={faq ? "Update question" : "Add question"}>
      {faq ? <input type="hidden" name="id" value={faq.id} /> : null}
      <label className={labelClass}>Question<input className={inputClass} name="question" required defaultValue={faq?.question ?? ""} /></label>
      <label className={labelClass}>Answer<textarea className={inputClass} name="answer" required defaultValue={faq?.answer ?? ""} /></label>
      <label className={labelClass}>Category<input className={inputClass} name="category" defaultValue={faq?.category ?? "General"} /></label>
      <label className={labelClass}>Order<input className={inputClass} type="number" name="displayOrder" defaultValue={faq?.displayOrder ?? 0} /></label>
      <label className="flex gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={faq?.published ?? true} /> Published</label>
    </AdminForm>
  );
}

function TestimonialEditor({ item }: { item: { id: string; quote: string; name: string; role: string; eventName: string; displayOrder: number; status: string } | null }) {
  return (
    <AdminForm action={saveTestimonial} submitLabel={item ? "Update testimonial" : "Save testimonial"}>
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <label className={labelClass}>Quote<textarea className={inputClass} name="quote" required defaultValue={item?.quote ?? ""} /></label>
      <label className={labelClass}>Name<input className={inputClass} name="name" required defaultValue={item?.name ?? ""} /></label>
      <label className={labelClass}>Role<input className={inputClass} name="role" defaultValue={item?.role ?? ""} /></label>
      <label className={labelClass}>Event<input className={inputClass} name="eventName" defaultValue={item?.eventName ?? ""} /></label>
      <label className={labelClass}>Order<input className={inputClass} type="number" name="displayOrder" defaultValue={item?.displayOrder ?? 0} /></label>
      <label className={labelClass}>
        Status
        <select className={inputClass} name="status" defaultValue={item?.status ?? "DRAFT"}>
          <option value="DRAFT">Draft</option>
          <option value="APPROVED">Approved</option>
          <option value="HIDDEN">Hidden</option>
        </select>
      </label>
    </AdminForm>
  );
}
