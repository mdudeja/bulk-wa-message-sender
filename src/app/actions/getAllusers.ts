"use server"

import { getAllUsers } from "@/lib/controllers/UserController"
import { getIsUserAdmin, getIsUserLoggedIn } from "@/lib/getSession"

export async function getAllUsersAction() {
  const userloggedIn = await getIsUserLoggedIn()
  const isAdmin = await getIsUserAdmin()

  if (!userloggedIn || !isAdmin) {
    return []
  }

  return getAllUsers()
}
