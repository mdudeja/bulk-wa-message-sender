import { defaultSession, sessionOptions } from "@/lib/AppSessionOptions"
import { SessionData } from "@/lib/interfaces/SessionData"
import { getIronSession } from "iron-session"
import { cookies } from "next/headers"

export async function getSession() {
  const session = await getIronSession<SessionData>(
    cookies() as any,
    sessionOptions
  )

  return session
}

export async function getIsUserLoggedIn() {
  const session = await getSession()

  return session.isLoggedIn && session.user && session.user.isActive
}

export async function getIsUserAdmin() {
  const session = await getSession()

  return session.isLoggedIn && session.user && session.user.type === "admin"
}

export async function getCurrentUser() {
  const session = await getSession()

  return session?.user
}
