"use server"

import { fetchReceiversByQueueIdForFrontend } from "@/lib/controllers/QueueReceiverController"
import { getIsUserLoggedIn } from "@/lib/getSession"

export async function getRecipientDetails(queueId: string) {
  const userloggedIn = await getIsUserLoggedIn()

  if (!userloggedIn) {
    return []
  }

  return fetchReceiversByQueueIdForFrontend(queueId)
}
