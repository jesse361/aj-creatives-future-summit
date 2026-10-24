import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const protectedPath = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (!protectedPath || pathname === "/admin/login") return NextResponse.next();

  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  const secret = process.env.AUTH_SECRET ?? "";
  if (!token || !(await verifyAdminToken(token, secret))) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
