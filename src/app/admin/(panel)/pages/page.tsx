import { AdminForm } from "@/components/admin-form";
import { prisma } from "@/lib/db";
import { BENEFITS } from "@/lib/constants";
import { inputClass, labelClass } from "@/lib/styles";
import { deleteFaq, saveFaq, savePage, saveTestimonial } from "@/server/actions/admin-settings";

export const instant = false;

const keys = ["about", "home-about", "benefits", "privacy", "terms"] as const;

export default async function PagesAdmin({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
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
        <ul className="text-sm">{faqs.map((faq) => <li key={faq.id}>{faq.question} · {faq.published ? "published" : "hidden"}</li>)}</ul>
        <AdminForm action={saveFaq} submitLabel="Add question">
          <label className={labelClass}>Question<input className={inputClass} name="question" required /></label>
          <label className={labelClass}>Answer<textarea className={inputClass} name="answer" required /></label>
          <label className={labelClass}>Category<input className={inputClass} name="category" defaultValue="General" /></label>
          <label className={labelClass}>Order<input className={inputClass} type="number" name="displayOrder" defaultValue={0} /></label>
          <label className="flex gap-2 text-sm"><input type="checkbox" name="published" defaultChecked /> Published</label>
        </AdminForm>
        {faqs[0] ? <form action={deleteFaq}><input type="hidden" name="id" value={faqs[0].id} /><button className="text-sm text-red-800">Delete first question</button></form> : null}
      </section>
      <section className="grid gap-4">
        <h2 className="font-display text-2xl">Testimonials</h2>
        <p className="text-sm text-ink-soft">Draft quotes stay off the public site. Approve only a real attendee statement.</p>
        <ul className="text-sm">{testimonials.map((item) => <li key={item.id}>{item.name} · {item.status}</li>)}</ul>
        <AdminForm action={saveTestimonial} submitLabel="Save testimonial">
          <label className={labelClass}>Quote<textarea className={inputClass} name="quote" required /></label>
          <label className={labelClass}>Name<input className={inputClass} name="name" required /></label>
          <label className={labelClass}>Role<input className={inputClass} name="role" /></label>
          <label className={labelClass}>Event<input className={inputClass} name="eventName" /></label>
          <label className={labelClass}>Order<input className={inputClass} type="number" name="displayOrder" defaultValue={0} /></label>
          <label className={labelClass}>Status<select className={inputClass} name="status" defaultValue="DRAFT"><option value="DRAFT">Draft</option><option value="APPROVED">Approved</option><option value="HIDDEN">Hidden</option></select></label>
        </AdminForm>
      </section>
    </div>
  );
}
