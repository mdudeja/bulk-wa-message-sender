"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import useSession from "@/lib/hooks/use-session"
import { toast } from "sonner"

export function NavigationSocketDisconnect() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { session } = useSession()

  useEffect(() => {
    if (session && session.isLoggedIn) {
      const disconnect = async () => {
        const res = await fetch("/api/socket/disconnect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ clientUserId: session.user.username }),
        })

        const json = await res.json()

        if (res.status !== 200) {
          console.error("Error disconnecting socket")
          toast.error(json.error)
        }

        if (json.disconnectedClients) {
          toast.success(json.message)
        }
      }

      disconnect()
    }
  }, [pathname, searchParams, session])

  return null
}
