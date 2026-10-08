import { NextResponse, type NextRequest } from "next/server";

import { isAdminRequestAllowed } from "@/lib/admin-auth";

/** Guard the admin pages (and the Server Actions posted to them). */
export function proxy(request: NextRequest) {
  if (isAdminRequestAllowed(request.headers.get("authorization"))) return NextResponse.next();

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Malevents admin", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
