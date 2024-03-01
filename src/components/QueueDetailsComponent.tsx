"use client"

import { useQuery } from "@tanstack/react-query"
import LoadingComponent from "@/components/LoadingComponent"
import { toast } from "sonner"
import ErrorComponent from "@/components/ErrorComponent"
import { Button } from "@/components/ui/button"
import { Pause, Play, StopCircle, Download } from "lucide-react"
import { getRecipientCounts } from "@/app/actions/getRecipientCounts"
import { useCallback, useEffect, useReducer } from "react"
import { io } from "socket.io-client"
import { getUserAuthed } from "@/app/actions/getUserAuthed"
import { getRecipientDetails } from "@/app/actions/getRecipientDetails"
import TableComponent from "./TableComponent"
import { Socket } from "socket.io-client"
import useSession from "@/lib/hooks/use-session"

type detailsStateType = {
  total: number
  processed: number
  responsesReceived: number
  tableData: { [key: string]: any }[]
  socket?: Socket
}

function stateReducer(
  state: detailsStateType,
  action: { type: string; payload: any }
) {
  switch (action.type) {
    case "SET_TOTAL":
      return { ...state, total: action.payload }
    case "SET_PROCESSED":
      return { ...state, processed: action.payload }
    case "SET_RESPONSES_RECEIVED":
      return { ...state, responsesReceived: action.payload }
    case "SET_TABLE_DATA":
      return { ...state, tableData: action.payload }
    case "EDIT_TABLE_DATA":
      return {
        ...state,
        tableData: state.tableData.map((row) => {
          if (row.phoneNumber === action.payload.phoneNumber) {
            action.payload.keys.forEach((key: string, i: number) => {
              if (row[key] instanceof Array) {
                row[key].push(action.payload.value[i])
                return
              }

              row[key] = action.payload.value[i]
            })
          }
          return row
        }),
      }
    case "SET_SOCKET":
      return { ...state, socket: action.payload }
    default:
      return state
  }
}

function createInitialState(): detailsStateType {
  return {
    total: 0,
    processed: 0,
    responsesReceived: 0,
    tableData: [],
  }
}

const downloadVCF = async (queueId: string) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/vcards/${queueId}`,
    {
      method: "GET",
      credentials: "include",
    }
  )
  const blob = await res.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${queueId}.vcf`
  a.click()
}

export default function QueueDetailsComponent({
  queueName,
}: {
  queueName: string
}) {
  const { session } = useSession()
  const [state, dispatch] = useReducer(stateReducer, null, createInitialState)
  const { isPending, isError, data, error, refetch } = useQuery({
    queryKey: ["queue", queueName],
    queryFn: async () => {
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_BASE_URL
        }/api/userQueues?queueName=${decodeURIComponent(queueName)}`,
        {
          method: "GET",
          credentials: "include",
        }
      )
      return res.json()
    },
  })

  const {
    isPending: isPendingRC,
    isError: isErrorRC,
    data: dataRC,
    error: errorRC,
  } = useQuery({
    queryKey: ["recipientCounts"],
    queryFn: () => getRecipientCounts(data?._id),
    enabled: !isPending && !isError,
  })

  const {
    isPending: isPendingUA,
    isError: isErrorUA,
    data: dataUA,
    error: errorUA,
  } = useQuery({
    queryKey: ["userAuthed"],
    queryFn: async () => await getUserAuthed(),
  })

  const {
    isPending: isPendingRD,
    isError: isErrorRD,
    data: dataRD,
    error: errorRD,
  } = useQuery({
    queryKey: ["recipients", queueName],
    queryFn: () => getRecipientDetails(data?._id),
    enabled: !isPending && !isError,
  })

  useEffect(() => {
    if (dataRC) {
      dispatch({ type: "SET_TOTAL", payload: dataRC.total })
      dispatch({ type: "SET_PROCESSED", payload: dataRC.processed })
      dispatch({
        type: "SET_RESPONSES_RECEIVED",
        payload: dataRC.responsesReceived,
      })
    }

    if (dataRD) {
      dispatch({ type: "SET_TABLE_DATA", payload: dataRD })
    }
  }, [dataRC, dataRD])

  const connectSocket = useCallback(async () => {
    if (!session || !session?.user?.username) {
      setTimeout(() => {
        connectSocket()
      }, 1000)
      return
    }

    const res = await fetch("/api/socket?purpose=messages")

    if (res.status !== 200) {
      toast.error("Error connecting to message socket server")
      return
    }

    toast.success("Connected to message socket server")

    const socket = io(`:${process.env.NEXT_PUBLIC_MESSAGE_SOCKET_PORT}`, {
      path: process.env.NEXT_PUBLIC_MESSAGE_SOCKET_SERVER,
    })

    socket.on("connect", () => {
      console.log("connected")
      socket.emit("clientUserId", {
        clientUserId: session?.user?.username ?? "",
        skipPrepare: true,
      })
    })

    socket.on("disconnect", () => {
      console.log("disconnected")
    })

    socket.on("error", (d) => {
      toast.error("Error processing queue: " + d)
    })

    socket.on("messageSent", (d) => {
      dispatch({
        type: "EDIT_TABLE_DATA",
        payload: {
          phoneNumber: d.phoneNumber,
          keys: ["processed", "delivered"],
          value: [true, d.ack !== -1],
        },
      })
      dispatch({
        type: "SET_PROCESSED",
        payload: state.processed + 1,
      })
    })

    socket.on("responseReceived", (d) => {
      dispatch({
        type: "EDIT_TABLE_DATA",
        payload: {
          phoneNumber: d.phoneNumber,
          keys: ["responses"],
          value: [d.response],
        },
      })
      dispatch({
        type: "SET_RESPONSES_RECEIVED",
        payload: state.responsesReceived + 1,
      })
    })

    socket.on("allMessagesSent", (d) => {
      toast.success("All messages sent")
      refetch()
    })

    socket.connect()

    dispatch({ type: "SET_SOCKET", payload: socket })

    return socket
  }, [queueName, data, session])

  useEffect(() => {
    if (data && !state.socket) {
      connectSocket()
    }
  }, [data, state.socket, connectSocket])

  if (isPending || isPendingRC || isPendingUA || isPendingRD) {
    return <LoadingComponent />
  }

  if (isError || isErrorRC || isErrorUA || isErrorRD) {
    const errorToShow = isError
      ? error
      : isErrorRC
      ? errorRC
      : isErrorUA
      ? errorUA
      : errorRD
    toast.error("Error fetching user stats: " + (errorToShow as Error).message)
    return <ErrorComponent />
  }

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex flex-row justify-between items-center w-full border border-1 rounded-md p-2 space-y-2">
        <h1 className="text-lg">{queueName}</h1>
        <div className="flex flex-row items-center justify-evenly space-x-2">
          <Button
            className="text-green-500 disabled:text-gray-500"
            variant="ghost"
            size="smIcon"
            disabled={
              !data ||
              data.status === "completed" ||
              data.status === "in-progress" ||
              !dataUA ||
              !dataUA.userAuthed
            }
            onClick={async () => {
              const socket = state.socket ?? (await connectSocket())
              if (data.status === "paused") {
                socket?.emit("resumeQueue", { queueId: data._id ?? "" })
              }
              socket?.emit("processQueue", { queueId: data._id ?? "" })
              refetch()
            }}
          >
            <Play className="w-16 h-16" />
          </Button>
          <Button
            variant="ghost"
            size="smIcon"
            className="text-blue-500 disabled:text-gray-500"
            disabled={!data || data.status !== "in-progress"}
            onClick={async () => {
              const socket = state.socket ?? (await connectSocket())
              socket?.emit("pauseQueue", { queueId: data._id ?? "" })
              refetch()
            }}
          >
            <Pause className="w-16 h-16" />
          </Button>
          <Button
            variant="ghost"
            size="smIcon"
            className="text-red-500 disabled:text-gray-500"
            disabled={!data || data.status !== "in-progress"}
            onClick={async () => {
              const socket = state.socket ?? (await connectSocket())
              socket?.emit("stopQueue", { queueId: data._id ?? "" })
              refetch()
            }}
          >
            <StopCircle className="w-16 h-16" />
          </Button>
          <Button
            variant="ghost"
            size="smIcon"
            className="disabled:text-gray-500"
            disabled={!data || data.status === "completed"}
            onClick={() => downloadVCF(data._id)}
          >
            <Download className="w-16 h-16" />
          </Button>
        </div>
      </div>
      {data && (
        <div className="w-full border border-1 rounded-md p-2">
          <p>Message: {data.message}</p>
          <p>Status: {data.status}</p>
          <p>Total Recipients: {state.total}</p>
          <p>Processed Recipients: {state.processed}</p>
          <p>Responses Received: {state.responsesReceived}</p>
        </div>
      )}
      <TableComponent
        data={state.tableData}
        tableHeaders={[
          "name",
          "phoneNumber",
          "processed",
          "delivered",
          "responses",
        ]}
      />
    </div>
  )
}
