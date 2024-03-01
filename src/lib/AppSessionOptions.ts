import { SessionOptions } from "iron-session"
import { SessionData } from "./interfaces/SessionData"

export const defaultSession: SessionData = {
  user: {
    _id: "",
    username: "",
    type: "user",
    isActive: true,
  },
  isLoggedIn: false,
}

export const sessionOptions: SessionOptions = {
  cookieName: "wa-bulk-session",
  password: process.env.SECRET_COOKIE_PASSWORD ?? "",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
}
