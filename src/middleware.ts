import { NextResponse, type NextRequest } from "next/server";

export function middleware(_request: NextRequest) {
  // Authgear's browser SDK owns the user session. Protected APIs independently
  // verify the Authgear bearer token; Supabase Auth cookies are no longer used.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
