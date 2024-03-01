import { TUser } from "./User"

export interface SessionData {
  user: Omit<TUser, "password">
  isLoggedIn: boolean
}
