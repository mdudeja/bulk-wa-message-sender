import { z } from "zod"
import { UserSchema } from "@/lib/interfaces/User"

export const loginSchema = z.object({
  username: UserSchema.shape.username,
  password: z.string().min(8, {
    message: "Password must be at least 8 characters long",
  }),
})

export const registerSchema = UserSchema.omit({
  id: true,
  isActive: true,
}).merge(z.object({ confirmpassword: z.string().min(8) }))

export const updateUserSchema = UserSchema.partial().merge(
  z.object({
    id: z.string(),
  })
)

export type TLogin = z.infer<typeof loginSchema>
export type TRegister = z.infer<typeof registerSchema>
export type TUpdateUser = z.infer<typeof updateUserSchema>
