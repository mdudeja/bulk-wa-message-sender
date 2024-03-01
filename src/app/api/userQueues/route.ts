import {
  addUserQueue,
  deleteUserQueue,
  fetchQueueByUserAndName,
} from "@/lib/controllers/UserQueuesController"
import { convertUploadedFileToContacts } from "@/lib/controllers/uploadedFileToContacts"
import {
  addMultipleQueueReceivers,
  deleteReceiversByQueueName,
} from "@/lib/controllers/QueueReceiverController"
import { getCurrentUser, getIsUserLoggedIn } from "@/lib/getSession"
import { TUserQueue } from "@/lib/interfaces/UserQueues"
import { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  const userLoggedIn = await getIsUserLoggedIn()
  const user = await getCurrentUser()

  if (!userLoggedIn || !user) {
    return new Response("Unauthorized", { status: 401 })
  }

  const searchParams = req.nextUrl.searchParams
  const queueName = searchParams.get("queueName")

  const queue = await fetchQueueByUserAndName(user.username, queueName ?? "")

  return new Response(JSON.stringify(queue), {
    status: 200,
  })
}

export async function POST(req: NextRequest) {
  const userLoggedIn = await getIsUserLoggedIn()
  const queue: TUserQueue = await req.json()

  if (!userLoggedIn) {
    return new Response("Unauthorized", { status: 401 })
  }

  const added = await addUserQueue(queue)

  if (!added) {
    return new Response("Failed to add queue", { status: 500 })
  }

  const receiversData: { name: string; phone: string }[] =
    await convertUploadedFileToContacts(added.file)

  const receiversAdded = await addMultipleQueueReceivers(
    receiversData.map((receiver) => ({
      queueId: added._id?.toString() ?? "",
      queueName: added.queueName,
      name: receiver.name,
      phoneNumber: receiver.phone,
      processed: false,
      delivered: false,
      responses: [],
    }))
  )

  if (!receiversAdded) {
    return new Response("Failed to add queue", { status: 500 })
  }

  return new Response("Queue added successfully", { status: 200 })
}

export async function DELETE(req: NextRequest) {
  const userLoggedIn = await getIsUserLoggedIn()
  const user = await getCurrentUser()

  const { queueName } = await req.json()

  if (!userLoggedIn || !user) {
    return new Response("Unauthorized", { status: 401 })
  }

  const deletedReceivers = await deleteReceiversByQueueName(queueName)

  if (!deletedReceivers) {
    return new Response("Failed to delete queue", { status: 500 })
  }

  const deleted = await deleteUserQueue(queueName, user.username)

  if (!deleted) {
    return new Response("Failed to delete queue", { status: 500 })
  }

  return new Response("Queue deleted successfully", { status: 200 })
}
