import { NextResponse, type NextRequest } from "next/server"
import { getIsUserAdmin, getIsUserLoggedIn } from "@/lib/getSession"

const adminOnlyEndpoints = ["/admindash"]

export async function middleware(request: NextRequest) {
  const userloggedIn = await getIsUserLoggedIn()
  const isAdmin = await getIsUserAdmin()

  const url = request.nextUrl.clone()

  if (
    !userloggedIn ||
    (adminOnlyEndpoints.includes(request.nextUrl.pathname) && !isAdmin)
  ) {
    url.pathname = "/login"
    if (request.nextUrl.pathname !== "/") {
      url.searchParams.append("redirect", request.nextUrl.pathname)
    }
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|images|login).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
}
