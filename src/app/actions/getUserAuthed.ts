"use server"

import { socketController } from "@/lib/controllers/SocketController"
import { getCurrentUser, getIsUserLoggedIn, getSession } from "@/lib/getSession"

export async function getUserAuthed() {
  const userLoggedIn = await getIsUserLoggedIn()
  const user = await getCurrentUser()

  if (!userLoggedIn || !user) {
    return {
      userAuthed: false,
    }
  }

  const isAuthed = socketController.isAuthed(user.username)

  return {
    userAuthed: isAuthed,
  }
}
