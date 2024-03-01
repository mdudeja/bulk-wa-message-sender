"use client"

import { getUserQueues } from "@/app/actions/getUserQueues"
import { useQuery } from "@tanstack/react-query"
import LoadingComponent from "@/components/LoadingComponent"
import { toast } from "sonner"
import ErrorComponent from "@/components/ErrorComponent"
import TableComponent from "./TableComponent"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import FormComponent from "@/components/FormComponent"
import { TUserQueue, UserQueueSchema } from "@/lib/interfaces/UserQueues"
import useSession from "@/lib/hooks/use-session"
import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"

const downloadCSV = async (queueId?: string) => {
  if (!queueId) {
    return
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/queue-report/${queueId}`,
    {
      method: "GET",
      credentials: "include",
    }
  )
  const blob = await res.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${queueId}.csv`
  a.click()
}

export default function UserQueuesComponent() {
  const router = useRouter()
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const { session } = useSession()
  const { isPending, isError, data, error, refetch } = useQuery({
    queryKey: ["userQueues"],
    queryFn: () => getUserQueues(),
  })

  const generateQueue = async (values: TUserQueue) => {
    if (!values || !uploadedFile) {
      toast.error("Please fill all the fields")
      return
    }

    const formData = new FormData()
    formData.append("file", uploadedFile)

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
      cache: "no-store",
    })

    if (response.status !== 200) {
      toast.error("Error uploading file")
      return
    }

    const json = await response.json()

    const addResponse = await fetch("/api/userQueues", {
      method: "POST",
      body: JSON.stringify({
        ...values,
        file: json.filename,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (addResponse.status !== 200) {
      toast.error("Error adding queue")
      return
    }

    toast.success("Queue added successfully")
    refetch()
  }

  if (isPending) {
    return <LoadingComponent />
  }

  if (isError) {
    toast.error("Error fetching user stats: " + error.message)
    return <ErrorComponent />
  }

  return (
    <div className="w-full border border-1 rounded-md p-2 space-y-2">
      <div className="flex flex-row justify-between items-center">
        <h1 className="text-lg">Queues</h1>
        <Sheet>
          <SheetTrigger asChild>
            <Button>Create Queue</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Create Queue</SheetTitle>
              <SheetDescription>
                Create a new Queue to send Messages
              </SheetDescription>
            </SheetHeader>
            <div>
              <FormComponent
                formSchema={UserQueueSchema}
                formFields={[
                  {
                    name: "username",
                    label: "Username",
                    type: "text",
                    placeholder: "Username",
                    description: "Username",
                    disabled: true,
                  },
                  {
                    name: "queueName",
                    label: "Queue Name",
                    type: "text",
                    placeholder: "Queue Name",
                    description: "Name of the Queue",
                  },
                  {
                    name: "message",
                    type: "textarea",
                    label: "Message",
                    placeholder: "Message here...",
                    description:
                      "The message you want to send. Please use {{name}} as a placeholder for the contact's name.",
                  },
                  {
                    name: "file",
                    type: "file",
                    label: "Contacts File",
                    placeholder: "Choose File",
                    description:
                      "Choose the contacts CSV file. The file should only have two columns: name and phone. All phone numbers must start with the country code (without the + sign)",
                    onChange: (e: FormEvent<HTMLInputElement>) => {
                      setUploadedFile((e.target as any).files[0])
                    },
                  },
                ]}
                defaultValues={{
                  username: session?.user.username ?? "",
                  queueName: "",
                  message: "",
                  file: undefined,
                }}
                onSubmit={generateQueue}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
      {data && data.length > 0 && (
        <TableComponent
          data={data}
          tableHeaders={[
            "queueName",
            "status",
            "createdAt",
            "updatedAt",
            "actions",
          ]}
          truncateLongStrings={true}
          onDelete={async (index) => {
            const res = await fetch("/api/userQueues", {
              method: "DELETE",
              body: JSON.stringify({ queueName: data[index]?.queueName }),
              headers: {
                "Content-Type": "application/json",
              },
            })

            if (res.status !== 200) {
              toast.error("Error deleting queue")
              return
            }

            toast.success("Queue deleted successfully")
            refetch()
          }}
          onViewDetails={(index) => {
            router.push("/user-queues/" + data[index]?.queueName)
          }}
          onDownloadCSV={async (index) => downloadCSV(data[index]?._id)}
        />
      )}
      {data && data.length === 0 && <p>No queues found</p>}
    </div>
  )
}
