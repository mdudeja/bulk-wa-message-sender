"use server"

import { fetchQueuesByUser } from "@/lib/controllers/UserQueuesController"
import { getCurrentUser, getIsUserLoggedIn } from "@/lib/getSession"

export async function getUserQueues() {
  const userLoggedIn = await getIsUserLoggedIn()
  const user = await getCurrentUser()

  if (!userLoggedIn || !user) {
    return []
  }

  const queues = await fetchQueuesByUser(user.username)

  return queues || []
}
