"use server"

import { WwebClient } from "@/lib/controllers/WWebClient"

export async function getQr(clientId: string) {
  return WwebClient.getQr(clientId)
}
