import { prisma } from "@/lib/db";

export const instant = false;

export default async function NewsletterAdmin() {
  const subscribers = await prisma.newsletterSubscriber.findMany({ orderBy: { subscribedAt: "desc" }, take: 200 });
  return (
    <div>
      <h1 className="font-display text-4xl text-navy">Newsletter</h1>
      <p className="mt-2 text-sm text-ink-soft">Subscriptions are stored here. Resend audience sync runs only when RESEND_AUDIENCE_ID and an API key are set.</p>
      <table className="mt-6 w-full bg-white text-left text-sm">
        <thead><tr className="text-xs uppercase tracking-[0.12em] text-mist"><th className="p-2">Email</th><th>Status</th><th>Consent</th><th>Subscribed</th></tr></thead>
        <tbody>
          {subscribers.map((subscriber) => (
            <tr key={subscriber.id} className="border-t border-line">
              <td className="p-2">{subscriber.email}</td>
              <td>{subscriber.subscriptionStatus}</td>
              <td>{subscriber.consentStatus}</td>
              <td>{subscriber.subscribedAt.toISOString().slice(0, 10)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {subscribers.length === 0 ? <p className="mt-4 text-sm text-ink-soft">No subscribers yet.</p> : null}
    </div>
  );
}
