import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const hasToken = req.cookies.has("authjs.session-token") || req.cookies.has("__Secure-authjs.session-token")
  const isLoggedIn = !!hasToken

  const publicPaths = ["/login", "/signup", "/api/auth"]
  const isPublicPath = publicPaths.some((p) => pathname.startsWith(p))
  const isSharePath = pathname.startsWith("/api/share/")
  const isAdminPath = pathname.startsWith("/admin")
  const isApiPath = pathname.startsWith("/api/")

  if (isSharePath) return NextResponse.next()

  if (isAdminPath && !isApiPath) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", req.url))
    return NextResponse.next()
  }

  if (isApiPath && !isPublicPath) return NextResponse.next()

  if (!isPublicPath && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (isLoggedIn && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public|uploads).*)"],
}