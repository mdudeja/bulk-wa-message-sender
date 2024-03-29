"use client"

import { getUserAuthed } from "@/app/actions/getUserAuthed"
import { useQuery } from "@tanstack/react-query"
import LoadingComponent from "@/components/LoadingComponent"
import ErrorComponent from "@/components/ErrorComponent"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useCallback, useState } from "react"
import { Socket, io } from "socket.io-client"
import useSession from "@/lib/hooks/use-session"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import QRCodeDisplayerComponent from "./QRCodeDisplayer"
import { NavigationSocketDisconnect } from "./NavigationSocketDisconnect"

export default function UserAuthedComponent() {
  const { session } = useSession()
  const { isPending, isError, data, error, refetch } = useQuery({
    queryKey: ["userAuthed"],
    queryFn: async () => await getUserAuthed(),
  })
  const [qr, setQr] = useState<string>("")
  const [authed, setAuthed] = useState<boolean>(false)
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false)

  const connectSocketForQRCode = useCallback(async () => {
    if (!session || !session?.user?.username) {
      setTimeout(() => {
        connectSocketForQRCode()
      }, 1000)
      return
    }

    const res = await fetch("/api/socket?purpose=qr")

    if (res.status !== 200) {
      toast.error("Error connecting to QR code socket server")
      return
    }

    toast.info("Fetching QR Code...")

    const socket = io({
      path: process.env.NEXT_PUBLIC_QRCODE_SOCKET_SERVER,
      autoConnect: false,
      addTrailingSlash: false,
      transports: ["websocket"],
    })

    socket.on("session", ({ sessionID, clientUserId }) => {
      socket.auth = { sessionID, clientUserId }
      sessionStorage.setItem("socketSessionID_qr", sessionID)
      ;(socket as any).clientUserId = clientUserId
    })

    socket.on("connect", () => {
      console.log("connected")
      socket.emit("clientUserId", {
        clientUserId: session?.user?.username ?? "",
      })
    })

    socket.on("disconnect", () => {
      console.log("disconnected")
    })

    socket.on("qr", (qr) => {
      setQr(qr)
      toast.success("QR Code received")
    })

    socket.on("isReady", (data) => {
      if (data) {
        toast.success("Authentication successful")
        setDrawerOpen(false)
        refetch()
      }
      setAuthed(data)
      socket.disconnect()
    })

    socket.on("connect_error", async (err) => {
      toast.error(`Error connecting to socket server: ${err.message}`)
    })

    socket.on("error", async (err) => {
      toast.error(err.message)
      setQr("")
      setDrawerOpen(false)
      socket.disconnect()
    })

    socket.auth = {
      clientUserId: session?.user?.username,
      sessionID:
        sessionStorage.getItem("socketSessionID_qr") === "undefined"
          ? undefined
          : sessionStorage.getItem("socketSessionID_qr"),
    }
    socket.connect()
  }, [session, setQr, setAuthed, setDrawerOpen, refetch])

  if (isPending) {
    return <LoadingComponent />
  }

  if (isError) {
    toast.error("Error fetching user stats: " + error.message)
    return <ErrorComponent />
  }

  return (
    <div className="w-full h-full flex flex-col justify-center items-start border border-1 rounded-md p-2">
      {!data?.userAuthed && (
        <div className="w-full flex flex-row items-center justify-between">
          <p>No linked number found</p>
          <Drawer open={drawerOpen}>
            <DrawerTrigger asChild>
              <Button
                onClick={() => {
                  setDrawerOpen(true)
                  connectSocketForQRCode()
                }}
                disabled={drawerOpen}
              >
                Link Number
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="mx-auto w-full h-4/6">
                <DrawerHeader>
                  <DrawerTitle>QR Code</DrawerTitle>
                  <DrawerDescription>
                    QR Code to Link your Number
                  </DrawerDescription>
                </DrawerHeader>
                <div className="w-full flex flex-row justify-center my-4">
                  {!authed && <QRCodeDisplayerComponent qr={qr} />}
                  {authed && <p>Authenticated!</p>}
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      )}
      {data?.userAuthed && (
        <div>
          <h1>WhatsApp is Authenticated</h1>
        </div>
      )}
      <NavigationSocketDisconnect />
    </div>
  )
}
