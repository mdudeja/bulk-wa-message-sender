"use server"

import { fetchRecipientCounts } from "@/lib/controllers/QueueReceiverController"
import { getIsUserLoggedIn } from "@/lib/getSession"

export async function getRecipientCounts(queueId: string) {
  const userloggedIn = await getIsUserLoggedIn()

  if (!userloggedIn) {
    return {
      total: 0,
      processed: 0,
      responsesReceived: 0,
    }
  }

  return fetchRecipientCounts(queueId)
}
