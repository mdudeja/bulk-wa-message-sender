import { GlobalRef } from "@/lib/GlobalRef"
import { Server, Socket } from "socket.io"
import { WwebClient } from "@/lib/controllers/WWebClientController"
import { updateQueueById } from "./UserQueuesController"
import { randomUUID } from "crypto"

class SocketController {
  clients: {
    for_path: string
    client: Socket
    clientUserId?: string
    sessionId?: string
  }[]
  ios: Server[]

  constructor() {
    this.clients = []
    this.ios = []
  }

  attachMiddleware(server: Server) {
    server.use((socket, next) => {
      const sessionId = socket.handshake.auth.sessionID
      const username = socket.handshake.auth.clientUserId

      if (!username) {
        return next(new Error("No username found in auth"))
      }

      ;(socket as any).sessionID = sessionId ?? randomUUID()
      ;(socket as any).clientUserId = username
      next()
    })
  }

  init(path: string, port: number) {
    const exists = this.ios.find((i) => i.path() === path)

    if (exists) {
      console.log(`Socket server already exists at ${path}`)
      return
    }

    const server = new Server({
      path: path,
      addTrailingSlash: false,
      cors: {
        origin: "*",
      },
    }).listen(port)

    this.attachMiddleware(server)

    server.on("connection", async (socket) => {
      const sessionId = (socket as any).sessionID
      const clientUserId = (socket as any).clientUserId
      console.log("socket connected", sessionId, clientUserId)

      this.clients.push({
        for_path: path,
        client: socket,
        clientUserId: clientUserId,
        sessionId: sessionId,
      })

      socket.emit("session", {
        sessionID: sessionId,
        clientUserId: clientUserId,
      })

      socket.on("disconnect", () => {
        console.log("socket disconnected", socket.id)
        this.clients = this.clients.filter(
          (c) => c.sessionId !== (socket as any).sessionID
        )
      })

      socket.on("clientUserId", async (data) => {
        const targetClient = this.clients.find(
          (c) => c.sessionId === (socket as any).sessionID
        )
        if (!targetClient) {
          return
        }
        targetClient.clientUserId = data.clientUserId
        if (!data.skipPrepare) {
          await WwebClient.prepare(data.clientUserId)
        }
      })

      socket.on("processQueue", async (data) => {
        const targetClient = this.clients.find(
          (c) => c.sessionId === (socket as any).sessionID
        )
        if (!targetClient) {
          return
        }
        await updateQueueById(data.queueId, { status: "in-progress" })
        WwebClient.processQueue(targetClient.clientUserId ?? "", data.queueId)
      })

      socket.on("pauseQueue", async (data) => {
        console.log("pauseQueue", data)
        const targetClient = this.clients.find(
          (c) => c.sessionId === (socket as any).sessionID
        )
        if (!targetClient) {
          return
        }
        await updateQueueById(data.queueId, { status: "paused" })
        WwebClient.pauseProcessing(data.queueId)
      })

      socket.on("resumeQueue", async (data) => {
        console.log("resumeQueue", data)
        const targetClient = this.clients.find(
          (c) => c.sessionId === (socket as any).sessionID
        )
        if (!targetClient) {
          return
        }
        await updateQueueById(data.queueId, { status: "in-progress" })
        WwebClient.resumeProcessing(data.queueId)
      })

      socket.on("stopQueue", async (data) => {
        console.log("stopQueue", data)
        const targetClient = this.clients.find(
          (c) => c.sessionId === (socket as any).sessionID
        )
        if (!targetClient) {
          return
        }
        await updateQueueById(data.queueId, { status: "completed" })
        WwebClient.pauseProcessing(data.queueId)
      })
    })

    this.ios.push(server)

    console.log(`Socket server started at ${path} on port ${port}`)
  }

  sendMessageByClientUserIdAndPath(
    path: string,
    clientUserId: string,
    event: string,
    data: any
  ) {
    const client = this.clients.find(
      (c) => c.for_path === path && c.clientUserId === clientUserId
    )

    if (!client) {
      console.log(
        `No client found for path ${path} and clientUserId ${clientUserId}`
      )
      return
    }

    try {
      client.client.emit(event, data)
    } catch (e) {
      console.log("Error emitting message to socket")
      console.log("event", event)
      console.log("data", data)
    }
  }

  isAuthed(clientUserId: string) {
    return WwebClient.isAuthed(clientUserId)
  }

  disconnectByClientUserId(clientUserId: string): boolean {
    const clients = this.clients.filter((c) => c.clientUserId === clientUserId)

    clients.forEach((c) => {
      c.client.disconnect()
    })

    return clients.length > 0
  }
}

const socketControllerRef = new GlobalRef<SocketController>("SocketController")

if (!socketControllerRef.value) {
  socketControllerRef.value = new SocketController()
}

export const socketController = socketControllerRef.value
