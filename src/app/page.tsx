"use client"

import FormComponent from "@/components/FormComponent"
import { TUpload, uploadSchema } from "@/lib/interfaces/Upload"
import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const router = useRouter()

  async function onSubmit(values?: TUpload) {
    if (!values) {
      return
    }

    if (uploadedFile) {
      const formData = new FormData()
      formData.append("file", uploadedFile)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        cache: "no-store",
      })

      if (response.status === 200) {
        const json = await response.json()
        router.push(
          `/linking?message=${encodeURIComponent(values.message)}&filename=${
            json.filename
          }`
        )
      } else {
        alert("Error uploading file")
      }
    }
  }

  return (
    <div className="h-screen flex flex-col justify-center items-center">
      <div className="flex flex-col my-4 items-center">
        <FormComponent
          formSchema={uploadSchema}
          onSubmit={onSubmit}
          defaultValues={{ message: "", file: undefined }}
          formFields={[
            {
              name: "message",
              type: "textarea",
              label: "Message",
              placeholder: "Message here...",
              description: "The message you want to send",
            },
            {
              name: "file",
              type: "file",
              label: "Contacts File",
              placeholder: "Choose File",
              description: "Choose the contacts file",
              onChange: (e: FormEvent<HTMLInputElement>) => {
                setUploadedFile((e.target as any).files[0])
              },
            },
          ]}
        />
      </div>
    </div>
  )
}
