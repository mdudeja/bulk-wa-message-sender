"use client"

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import FormComponent from "./FormComponent"
import {
  UserQueueContentVariationsSchema,
  TUserQueueContentVariations,
} from "@/lib/interfaces/UserQueues"
import { useState } from "react"

export default function ContentVariationsComponent({
  isOpen,
  onSubmit,
  onClose,
}: {
  isOpen: boolean
  onSubmit: (data: TUserQueueContentVariations) => void
  onClose?: () => void
}) {
  const baseFields = [
    {
      name: "replacethis",
      label: "Replace This",
      type: "text",
      placeholder: "Replace This",
      description: "Replace This",
    },
    {
      name: "withthis",
      label: "With This",
      type: "text",
      placeholder: "With This",
      description: "With This",
    },
  ]
  const [thefields, setTheFields] = useState(baseFields)

  return (
    <Drawer open={isOpen}>
      <DrawerContent onClose={onClose}>
        <div className="mx-auto w-full h-4/6">
          <DrawerHeader>
            <DrawerTitle>Content Variations</DrawerTitle>
            <DrawerDescription>
              <span className="flex flex-row items-center justify-between">
                Select Variations to be randomnly selected for your content
                <span className="space-x-2">
                  <Button
                    onClick={() => {
                      const currentFields = thefields.copyWithin(
                        0,
                        thefields.length
                      )
                      const newFields = [
                        ...currentFields,
                        ...baseFields.map((field) => ({
                          ...field,
                          name: `${field.name}_${thefields.length / 2}`,
                        })),
                      ]
                      setTheFields(newFields)
                    }}
                    disabled={thefields.length >= 8}
                  >
                    + Add
                  </Button>
                  <Button
                    variant={"destructive"}
                    onClick={() => {
                      const currentFields = thefields.copyWithin(
                        0,
                        thefields.length
                      )
                      const newFields = currentFields.slice(0, -2)
                      setTheFields(newFields)
                    }}
                    disabled={thefields.length === 2}
                  >
                    - Remove
                  </Button>
                </span>
              </span>
            </DrawerDescription>
          </DrawerHeader>
          <div className="w-full flex flex-row justify-center my-4">
            <FormComponent
              formSchema={UserQueueContentVariationsSchema}
              formFields={thefields as any}
              onSubmit={onSubmit}
              clubFields={true}
              clubbedLength={2}
              defaultValues={{
                replacethis: "",
                withthis: "",
                replacethis_1: "",
                withthis_1: "",
                replacethis_2: "",
                withthis_2: "",
                replacethis_3: "",
                withthis_3: "",
              }}
            />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
