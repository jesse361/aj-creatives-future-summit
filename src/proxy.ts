import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/admin") || pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  const session = request.cookies.get("fs_session")?.value;
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
