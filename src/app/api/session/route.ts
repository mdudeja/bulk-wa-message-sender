import { getIsUserLoggedIn, getSession } from "@/lib/getSession"
import { defaultSession } from "@/lib/AppSessionOptions"
import { loginUser } from "@/lib/controllers/UserController"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const session = await getSession()
  let loggedInUser: any

  const { username, password, token } = await request.json()

  if (username && password) {
    loggedInUser = await loginUser(username, password)
  }

  if (!loggedInUser || !loggedInUser.username) {
    return NextResponse.json(
      {
        status: 401,
        json: {
          error: "Invalid username or password",
        },
      },
      {
        status: 401,
      }
    )
  }

  session.user = loggedInUser
  session.isLoggedIn = true
  await session.save()

  return NextResponse.json(session)
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  const userLoggedIn = await getIsUserLoggedIn()

  if (!userLoggedIn) {
    return NextResponse.json(defaultSession)
  }

  return NextResponse.json(session)
}

export async function DELETE() {
  const session = await getSession()

  session.destroy()

  return NextResponse.json(defaultSession)
}
