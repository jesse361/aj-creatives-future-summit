import { releaseExpiredHolds } from "@/lib/payments";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");
  if (!secret || header !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
  const released = await releaseExpiredHolds();
  return Response.json({ released });
}
