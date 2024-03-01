"use client"

import { getAllUsersAction } from "@/app/actions/getAllusers"
import { useQuery } from "@tanstack/react-query"
import TableSkeletonComponent from "@/components/TableSkeletonComponent"
import { toast } from "sonner"
import TableComponent from "@/components/TableComponent"
import { user_table_headers } from "@/lib/Constants"
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
import { TRegister, registerSchema } from "@/lib/interfaces/Auth"
import { useState } from "react"
import ErrorComponent from "@/components/ErrorComponent"

export default function UsersTableComponent() {
  const [loadingToastId, setLoadingToastId] = useState<string | number | null>(
    null
  )
  const { isPending, isError, data, error } = useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => await getAllUsersAction(),
  })

  if (isPending) {
    return <TableSkeletonComponent />
  }

  if (isError) {
    toast.error("Error fetching users: " + error.message)
    return <ErrorComponent />
  }

  async function onSubmit(values?: TRegister) {
    if (!values) {
      return
    }

    if (values.confirmpassword !== values.password) {
      toast.error("Passwords do not match")
      return
    }

    const toastId = toast.loading("Logging in...")
    setLoadingToastId(toastId)

    const res = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        credentials: "include",
      },
      body: JSON.stringify(values),
    })

    toast.dismiss(toastId)
    setLoadingToastId(null)

    if (res.status !== 200) {
      toast.error("Failed to create user")
      return
    }

    toast.success("User created successfully")
  }

  return (
    <>
      <TableComponent data={data} tableHeaders={user_table_headers} />
      <Sheet>
        <SheetTrigger asChild>
          <Button className="float-end">+ Add User</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>New User</SheetTitle>
            <SheetDescription>
              Add a new User to the Application
            </SheetDescription>
          </SheetHeader>
          <FormComponent
            formSchema={registerSchema}
            onSubmit={onSubmit}
            disableSubmit={loadingToastId !== null}
            defaultValues={{
              username: "",
              password: "",
              confirmpassword: "",
              type: "user",
            }}
            formFields={[
              { name: "username", label: "Username", type: "text" },
              { name: "password", label: "Password", type: "password" },
              {
                name: "confirmpassword",
                label: "Confirm Password",
                type: "password",
              },
              {
                name: "type",
                label: "User Type",
                type: "select",
                selectOptions: [
                  {
                    label: "Admin",
                    value: "admin",
                  },
                  {
                    label: "User",
                    value: "user",
                  },
                ],
              },
            ]}
          />
        </SheetContent>
      </Sheet>
    </>
  )
}
