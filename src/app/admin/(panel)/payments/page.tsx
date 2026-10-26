import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { canManageCommerce } from "@/lib/permissions";
import { formatMoney } from "@/lib/money";
import { paystackConfigured } from "@/lib/paystack";
import { refundPaymentAction } from "@/server/actions/admin-office";

export const instant = false;

export default async function PaymentsAdmin() {
  const admin = await getCurrentAdmin();
  const payments = await prisma.payment.findMany({ include: { registration: { include: { event: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <div>
      <h1 className="font-display text-4xl text-navy">Payments</h1>
      <p className="mt-2 text-sm text-ink-soft">Paystack is {paystackConfigured() ? "configured" : "not configured"}. Refunds are sent to Paystack only after you confirm.</p>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full bg-white text-left text-sm">
          <thead><tr className="text-xs uppercase tracking-[0.12em] text-mist"><th className="p-2">Reference</th><th>Event</th><th>Provider</th><th>Amount</th><th>Status</th><th>Paid</th><th></th></tr></thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-t border-line align-top">
                <td className="p-2">{payment.providerReference || payment.registration.reference}</td>
                <td>{payment.registration.event.title}</td>
                <td>{payment.provider}</td>
                <td>{formatMoney(payment.amount, payment.currency)}</td>
                <td>{payment.paymentStatus}</td>
                <td>{payment.paidAt ? payment.paidAt.toISOString().slice(0, 16) : "—"}</td>
                <td>
                  {admin && canManageCommerce(admin.role) && payment.paymentStatus === "SUCCESS" && paystackConfigured() ? (
                    <form action={refundPaymentAction} className="grid gap-2">
                      <input type="hidden" name="id" value={payment.id} />
                      <label className="text-xs"><input type="checkbox" name="confirmRefund" /> Confirm refund</label>
                      <button className="text-left text-red-800">Refund</button>
                    </form>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 ? <p className="mt-4 text-sm text-ink-soft">No payments yet.</p> : null}
      </div>
    </div>
  );
}
