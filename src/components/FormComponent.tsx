"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  ControllerRenderProps,
  DefaultValues,
  Path,
  useForm,
} from "react-hook-form"
import { TypeOf, z } from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormEvent } from "react"

type AsyncDefaultValues<TFieldValues> = (
  payload?: unknown
) => Promise<TFieldValues>

export type TFormComponentField<TFieldValues> = Array<{
  name: keyof TFieldValues
  label: string
  type:
    | "text"
    | "select"
    | "textarea"
    | "mobile"
    | "email"
    | "password"
    | "file"
  placeholder?: string
  disabled?: boolean
  hidden?: boolean
  description?: string
  isOptional?: boolean
  onChange?: (e: FormEvent<HTMLInputElement>) => void
  selectOptions?: {
    label: string
    value: string
  }[]
}>

export default function FormComponent<
  TSchema extends z.ZodType<any, any, any>
>({
  formSchema,
  onSubmit,
  defaultValues,
  formFields,
  disableSubmit,
}: {
  formSchema: TSchema
  onSubmit: (data: z.infer<TSchema>) => void
  defaultValues?:
    | DefaultValues<z.infer<TSchema>>
    | AsyncDefaultValues<z.infer<TSchema>>
  formFields: TFormComponentField<z.infer<TSchema>>
  disableSubmit?: boolean
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues as any,
  })

  let submitDisabled = disableSubmit || form.formState.isSubmitting

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          submitDisabled = true
          e.preventDefault()
          form.handleSubmit(onSubmit)()
        }}
        className="space-y-8"
      >
        {formFields.map((formField, idx) => {
          return (
            <FormField
              key={idx}
              control={form.control}
              name={formField.name as Path<TSchema>}
              render={({ field }) => (
                <FormItem>
                  {!formField.hidden && (
                    <FormLabel htmlFor={formField.name as string}>
                      {formField.label}
                    </FormLabel>
                  )}
                  {getControlByInputType(formField, field)}
                  {!formField.hidden && formField.description && (
                    <FormDescription>{formField.description}</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          )
        })}
        <div className="flex flex-row justify-end">
          <Button variant="default" type="submit" disabled={submitDisabled}>
            Submit
          </Button>
        </div>
      </form>
    </Form>
  )
}

function getControlByInputType<TSchema extends z.ZodType<any, any, any>>(
  formField: TFormComponentField<TSchema>[number],
  field: ControllerRenderProps<TypeOf<TSchema>, Path<TSchema>>
) {
  switch (formField.type) {
    case "select":
      return (
        <FormControl>
          <Select
            {...field}
            onValueChange={field.onChange}
            defaultValue={field.value}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={formField.placeholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>{formField.label}</SelectLabel>
                {formField.selectOptions?.map((option, idx1) => (
                  <SelectItem key={idx1} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </FormControl>
      )
    case "textarea":
      return (
        <FormControl>
          <Textarea
            {...field}
            id={formField.name as string}
            className={`${formField.hidden ? "hidden" : ""}`}
            placeholder={formField.placeholder}
            disabled={formField.disabled}
          />
        </FormControl>
      )
    case "file":
      return (
        <FormControl>
          <Input
            {...field}
            id={formField.name as string}
            className={`${formField.hidden ? "hidden" : ""}`}
            type={formField.type ?? "text"}
            placeholder={formField.placeholder}
            disabled={formField.disabled}
            multiple={false}
            accept={"text/csv"}
            value={field.value}
            onChange={(e) => {
              field.onChange(e)
              formField.onChange?.(e)
            }}
          />
        </FormControl>
      )
    default:
      return (
        <FormControl>
          <Input
            {...field}
            id={formField.name as string}
            className={`${formField.hidden ? "hidden" : ""}`}
            type={formField.type ?? "text"}
            placeholder={formField.placeholder}
            disabled={formField.disabled}
            value={field.value}
          />
        </FormControl>
      )
  }
}
