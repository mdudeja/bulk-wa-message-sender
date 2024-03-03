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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

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
    | "checkbox"
  placeholder?: string
  disabled?: boolean
  hidden?: boolean
  description?: string
  isOptional?: boolean
  onChange?: (e: FormEvent<HTMLInputElement> | boolean) => void
  selectOptions?: {
    label: string
    value: string
  }[]
  value?: any
}>

export type TFormComponentCompoundedField<TFieldValues> = {
  subFields: TFormComponentField<TFieldValues>
}

export default function FormComponent<
  TSchema extends z.ZodType<any, any, any>
>({
  formSchema,
  onSubmit,
  defaultValues,
  formFields,
  disableSubmit,
  clubFields,
  clubbedLength,
}: {
  formSchema: TSchema
  onSubmit: (data: z.infer<TSchema>) => void
  defaultValues?:
    | DefaultValues<z.infer<TSchema>>
    | AsyncDefaultValues<z.infer<TSchema>>
  formFields:
    | TFormComponentField<z.infer<TSchema>>
    | TFormComponentCompoundedField<z.infer<TSchema>>
  disableSubmit?: boolean
  clubFields?: boolean
  clubbedLength?: number
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues as any,
  })

  let submitDisabled = disableSubmit || form.formState.isSubmitting

  const fieldsToRender = Array.isArray(formFields)
    ? formFields
    : formFields.subFields

  let renderable: JSX.Element[] | JSX.Element[][] = fieldsToRender.map(
    (formField, idx) => {
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
    }
  )

  if (clubFields && clubbedLength && clubbedLength > 1) {
    renderable = renderable.reduce(
      (result: JSX.Element[] | JSX.Element[][], value, index, array) => {
        if (index % clubbedLength === 0) {
          result.push(array.slice(index, index + clubbedLength) as any)
        }
        return result
      },
      []
    )
  }

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
        {renderable.map((field, idx) => {
          return (
            <div key={idx} className="flex flex-row space-x-4">
              {field}
            </div>
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
    case "checkbox":
      return (
        <FormControl>
          <div className="space-x-2">
            <Checkbox
              {...field}
              id={formField.name as string}
              className={`${formField.hidden ? "hidden" : ""}`}
              disabled={formField.disabled}
              checked={
                formField.value !== undefined ? formField.value : field.value
              }
              onCheckedChange={(checked: any) => {
                field.onChange(checked)
                formField.onChange?.(checked)
              }}
            />
            <Label htmlFor={formField.name as string}>{formField.label}</Label>
          </div>
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
