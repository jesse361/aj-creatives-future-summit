import { prisma } from "@/lib/db";
import { mediaConfigured } from "@/lib/uploads";
import { paystackConfigured } from "@/lib/paystack";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({
      ok: true,
      database: "up",
      payments: paystackConfigured() ? "configured" : "unconfigured",
      email: process.env.RESEND_API_KEY || process.env.EMAIL_PROVIDER_API_KEY ? "configured" : "unconfigured",
      media: mediaConfigured() ? "configured" : "unconfigured",
    });
  } catch {
    return Response.json({ ok: false, database: "down" }, { status: 503 });
  }
}
