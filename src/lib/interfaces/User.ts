import { z } from "zod"

export const UserTypeOptions = ["admin", "user"] as const

export const UserSchema = z.object({
  _id: z.string().optional(),
  username: z
    .string()
    .min(2, {
      message: "Username must be at least 2 characters long",
    })
    .max(32, {
      message: "Username must be at most 32 characters long",
    }),
  password: z
    .string()
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,32}$/,
      "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number and one special character"
    ),
  type: z.enum(UserTypeOptions).default("user"),
  isActive: z.boolean().default(true),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export const UserDTOSchema = UserSchema.omit({
  _id: true,
  password: true,
  createdAt: true,
  updatedAt: true,
})

export type TUser = z.infer<typeof UserSchema>
export type TUserType = (typeof UserTypeOptions)[number]
export type TUserDTO = z.infer<typeof UserDTOSchema>
