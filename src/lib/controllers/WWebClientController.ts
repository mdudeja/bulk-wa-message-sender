import { Client, MessageAck, NoAuth } from "whatsapp-web.js"
import { socketController } from "@/lib/controllers/SocketController"
import { GlobalRef } from "@/lib/GlobalRef"
import {
  fetchPendingReceiversByQueueId,
  updateReceiverById,
  updateReceiverResponsesByPhoneNumber,
} from "./QueueReceiverController"
import { TUserQueue } from "../interfaces/UserQueues"
import { fetchQueueById, updateQueueById } from "./UserQueuesController"

class WWebClient {
  private clients: {
    id: string
    client?: Client
    authed?: boolean
    ready?: boolean
    in_progress?: boolean
    currentQueueId?: string
    promiseGenerators?: (() => Promise<void>)[]
    is_paused?: boolean
  }[]

  constructor() {
    this.clients = []
  }

  async attachListeners(client: Client, clientId: string) {
    if (!client) {
      return
    }

    client.on("qr", (qr) => {
      socketController.sendMessageByClientUserIdAndPath(
        "/socket/qr",
        clientId,
        "qr",
        qr
      )
    })

    client.on("authenticated", () => {
      this.clients = this.clients.map((c) => {
        if (c.id === clientId) {
          return { ...c, authed: true }
        }

        return c
      })
    })

    client.on("message", (message) => {
      const targetClient = this.clients.find((c) => c.id === clientId)
      updateReceiverResponsesByPhoneNumber(
        targetClient?.currentQueueId ?? "",
        message.from?.replace("@c.us", "") ?? "",
        message.body ?? ""
      )
      socketController.sendMessageByClientUserIdAndPath(
        "/socket/messages",
        clientId,
        "responseReceived",
        {
          response: message.body,
          phoneNumber: message.from.replace("@c.us", ""),
        }
      )
    })

    // client.on("message_create", (message) => {
    //   console.log("MESSAGE CREATED", message)
    //   const targetClient = this.clients.find((c) => c.id === clientId)
    //   updateReceiverResponsesByPhoneNumber(
    //     targetClient?.currentQueueId ?? "",
    //     message.from?.replace("@c.us", "") ?? "",
    //     message.body ?? ""
    //   )
    //   socketController.sendMessageByClientUserIdAndPath(
    //     "/socket/messages",
    //     clientId,
    //     "responseReceived",
    //     {
    //       response: message.body,
    //       phoneNumber: message.from.replace("@c.us", ""),
    //     }
    //   )
    // })

    client.on("disconnected", (reason) => {
      this.clients = this.clients.filter((c) => c.id !== clientId)
      client.destroy()
    })

    client.on("ready", () => {
      socketController.sendMessageByClientUserIdAndPath(
        "/socket/qr",
        clientId,
        "isReady",
        true
      )
      this.clients = this.clients.map((c) =>
        c.id === clientId ? { ...c, ready: true } : c
      )
    })

    return client
  }

  async prepare(clientId: string) {
    const existingClient = this.clients.find((c) => c.id === clientId)
    if (existingClient) {
      return
    }

    const client = new Client({
      authStrategy: new NoAuth(),
    })

    client.initialize()

    const c = await this.attachListeners(client, clientId)

    this.clients.push({ id: clientId, client: c })
  }

  updateClients(clientItem: {
    id: string
    client?: Client
    authed?: boolean
    ready?: boolean
    in_progress?: boolean
  }) {
    this.clients = this.clients.map((c) =>
      c.id === clientItem.id ? clientItem : c
    )
  }

  async processQueue(clientId: string, queueId: string): Promise<void> {
    const clientItem = this.clients.find((c) => c.id === clientId)
    const queue = await fetchQueueById(queueId)

    if (!queue) {
      socketController.sendMessageByClientUserIdAndPath(
        "/socket/messages",
        clientId,
        "error",
        "Queue not found"
      )
      return
    }

    if (
      !clientItem ||
      !clientItem.authed ||
      !clientItem.ready ||
      clientItem.in_progress ||
      clientItem.is_paused ||
      queue.status === "paused" ||
      queue.status === "completed"
    ) {
      socketController.sendMessageByClientUserIdAndPath(
        "/socket/messages",
        clientId,
        "error",
        "Client not authorized or Queue Already in Progress or Paused or Completed"
      )
      return
    }

    clientItem.in_progress = true
    clientItem.currentQueueId = queueId

    this.updateClients(clientItem)

    const client = clientItem.client

    if (!client) {
      socketController.sendMessageByClientUserIdAndPath(
        "/socket/messages",
        clientId,
        "error",
        "Client not found"
      )
      return
    }

    const contacts = await fetchPendingReceiversByQueueId(queue._id ?? "")

    if (!contacts) {
      socketController.sendMessageByClientUserIdAndPath(
        "/socket/messages",
        clientId,
        "error",
        "Failed to fetch contacts"
      )
      return
    }

    if (contacts.length === 0) {
      socketController.sendMessageByClientUserIdAndPath(
        "/socket/messages",
        clientId,
        "allMessagesSent",
        "No more Contacts left to send message to"
      )

      await updateQueueById(queue._id ?? "", { status: "completed" })

      return
    }

    clientItem.promiseGenerators = contacts.map((contact) => {
      return () =>
        new Promise<void>(async (resolve) =>
          setTimeout(async () => {
            console.log("SENDING MESSAGE TO", contact.name, contact.phoneNumber)
            const res = await client.sendMessage(
              contact.phoneNumber + "@c.us",
              queue.message.replace(/{{name}}/g, contact.name ?? "")
            )
            socketController.sendMessageByClientUserIdAndPath(
              "/socket/messages",
              clientId,
              "messageSent",
              {
                name: contact.name,
                phoneNumber: contact.phoneNumber,
                ack: res.ack,
              }
            )
            await updateReceiverById(contact._id ?? "", {
              processed: true,
              delivered: res.ack !== MessageAck.ACK_ERROR,
            })
            resolve()
          }, (Math.random() * 5 + 3) * 1000)
        )
    })

    this.updateClients(clientItem)

    for (const promiseGenerator of clientItem.promiseGenerators ?? []) {
      if (!clientItem.is_paused) {
        await promiseGenerator()
      }
    }

    clientItem.in_progress = false
    this.updateClients(clientItem)
    this.processQueue(clientId, queueId)
  }

  isAuthed(clientId: string) {
    const client = this.clients.find((c) => c.id === clientId)
    return !!(client && client.authed)
  }

  pauseProcessing(queueId: string) {
    const client = this.clients.find((c) => c.currentQueueId === queueId)
    if (client) {
      client.is_paused = true
      client.in_progress = false
      client.promiseGenerators = []
      this.updateClients(client)
    }
  }

  resumeProcessing(queueId: string) {
    const client = this.clients.find((c) => c.currentQueueId === queueId)
    if (client) {
      client.is_paused = false
      this.updateClients(client)
    }
  }
}

const wwebClientRef = new GlobalRef<WWebClient>("WwebClient")

if (!wwebClientRef.value) {
  wwebClientRef.value = new WWebClient()
}

export const WwebClient = wwebClientRef.value
